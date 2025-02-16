import { create } from "@bufbuild/protobuf";
import GameClient from "../game.js";
import { PointIntegerSchema, WorldBlockPlacedPacket } from "../protocol/world_pb.js";
import WorldPosition from "../types/world-position.js";
import Block from "./block.js";

/**
 *
 */
export type BlockSchedulerEvent = {
    block: Block;
    position: WorldPosition;
    resolve: () => void;
    reject: (reason: string) => void;
    success: boolean;
    lastSent: number;
};

/**
 * The block scheduler is used to time block placement
 * packets to the server to prevent hitting the ratelimit.
 * The scheduler works as follows. When a block placement
 * is requested with {@link BlockScheduler#push}, the block
 * is added to the scheduler. If the scheduler is not looping,
 * it will start its' loop and send the block to the server.
 *
 * The loop is timed for the ratelimit and will keep trying to
 * send blocks in queue until the queue is empty. If the queue
 * is empty, the loop will stop.
 * 
 * The scheduler is also used to combine multiple tickets into
 * one packet. This is used to optimize the client performance.
 *
 * @since 1.4.6
 */
export default class BlockScheduler {
    /**
     * The queue of to-does. This is a list of entries that
     * need to be put upon the world.
     * 
     * @since 1.4.6
     */
    private events: BlockSchedulerEvent[] = [];

    /**
     * The state of the scheduler. If the scheduler is ticking,
     * it will not start another loop. This is used to prevent
     * multiple runs over the same scheduler.
     *
     * @since 1.4.6
     */
    private ticking = false;

    /**
     * This is the amount of equal blocks we can compress into
     * one packet. This is used to prevent getting a failed
     * packet, as the server has an unknown blocklimit.
     *
     * @since 1.4.6
     */
    private readonly BLOCKS_PER_PACKET = 100;

    /**
     * The frequency/ performance of the scheduler. Set it too
     * low, and there is a risk of being ratelimited, set it too
     * high, and there is a performance problem.
     *
     * @since 1.4.6
     */
    private readonly LOOP_FREQUENCY = 25;

    /**
     * // TODO document
     * 
     * @since 1.4.6
     */
    public constructor(private game: GameClient) {
        game.connection.listen("worldBlockPlacedPacket", this.resolve.bind(this));
    }

    /**
     * Pushes a new entry to the scheduler. The scheduler entry is
     * a promise-event correlation. It dispatches block placement
     * of unfinished events and resolves the promise when the block
     * is placed.
     *
     * @since 1.4.6
     */
    public push(block: Block, position: WorldPosition): Promise<void> {
        let resolve!: () => void;
        let reject!: (reason: string) => void;

        /**
         * The event-related promise. This exposes the resolve and
         * reject methods to the scheduler, these are managed by the
         * class instance afterwards.
         */
        const promise = new Promise<void>((res, rej) => {
            resolve = res;
            reject = rej;
        });

        /**
         * The event object that is pushed to the scheduler.
         */
        const event: BlockSchedulerEvent = {
            block,
            position,
            resolve,
            reject,
            success: false,
            lastSent: 0,
        };

        this.events.push(event);
        // this.process();

        return promise;
    }

    /**
     * Resolves the block placement event. This is called when the
     * server sends a block placed packet. The packet is then compared
     * to the events in the scheduler and if a match is found, the event
     * is resolved.
     *
     * @since 1.4.6
     */
    private async resolve(event: WorldBlockPlacedPacket) {
        const block = Block.fromId(event.blockId);
        block.deserialize(event.extraFields, { endian: "big", readTypeByte: true });

        // this.events = this.events.filter((entry) => {
        //     if (!block.equals(entry.block)) return true;
        //     if (event.layer !== entry.position.layer) return true;
        //     if (!event.positions.some(({ x, y }) => entry.position.x === x && entry.position.y === y)) return true;

        //     // We have a match: Block & Coordinates.
        //     entry.success = true;
        //     entry.resolve();

        //     return false;
        // });

        for (const entry of this.events) {
            if (!block.equals(entry.block)) continue;
            if (event.layer !== entry.position.layer) continue;
            if (!event.positions.some(({ x, y }) => entry.position.x === x && entry.position.y === y)) continue;

            // We have a match: Block & Coordinates.
            entry.success = true;
            entry.resolve();
        }
    }

    /**
     * Start the block scheduling loop. This method is called to
     * tell the scheduler that a queue hasbeen readied and should
     * be processed.
     *
     * @since 1.4.6
     */
    public process() {
        if (this.ticking) return;
        this.ticking = true;

        this.tick();
    }

    /**
     * The main loop of the scheduler. This loop is responsible
     * for sending the block placement packets to the server.
     *
     * @since 1.4.6
     */
    private async tick() {
        // TODO implement retries
        const event = this.events.shift();

        if (event === undefined) {
            this.ticking = false;
            return;
        }

        // Start tracking the positions of the blocks, start with
        // the position of our current block.
        const positions: { x: number; y: number; }[] = [{
            x: event.position.x,
            y: event.position.y,
        }];

        // Iterate over the next blocks in the queue and check if
        // they are the same block, if so, add them to the positions
        // array and resend.
        for (let i = 0, b = 1; i < this.events.length && b < this.BLOCKS_PER_PACKET; i++) {
            const next = this.events[i];

            if (!event.block.equals(next.block)) continue;
            if (event.position.layer !== next.position.layer) continue;

            positions.push({
                x: next.position.x,
                y: next.position.y,
            });

            this.events.splice(i, 1);
            i--;
            b++;
        }

        // Update the last sent time of the event.
        // TODO implement ratelimit
        event.lastSent = performance.now();

        // Send the block to the server.
        this.game.connection.send("worldBlockPlacedPacket", {
            blockId: event.block.id,
            isFillOperation: false,
            positions: positions.map(p => create(PointIntegerSchema, p)),
            layer: event.position.layer,
            extraFields: event.block.serialize({ endian: "big", writeId: false, writeTypeByte: true }),
        });

        // Schedule the next tick: Wait leftover time, if more events
        // are in queue and tick again, otherwise stop ticking.
        if (this.events.length) {
            // TODO implement improved frequency calculation with minimum `lastTime + offset` calculation
            setTimeout(this.tick.bind(this), this.LOOP_FREQUENCY);
        } else {
            this.ticking = false;
        }
    }
}
