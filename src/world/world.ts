import EventEmitter from "events";

import { Palette } from "../build/block-mappings.js";

import GameClient from "../game.js";
import Block from "./block.js";
import Structure from "./structure.js";
import BufferReader from "../util/buffer.js";
import WorldPosition from "../types/world-position.js";
import BlockScheduler from "./block-scheduler.js";
import WorldMeta from "../types/world-meta.js";

import { ALL_AT_ONCE } from "./paste-animation.js";
import wait from "../util/wait.js";

/**
 * // TODO document, expand events
 */
type Events = {
    Clear: [];
    Reload: [];
    Block: [Block, WorldPosition[]];
};

/**
 * @since 1.4.8
 */
type StructurePasteOptions = {
    omit: (typeof Palette)[number][];

    pasteAnimation: (structure: Structure<{}>) => Generator<WorldPosition[], void, unknown>;
    pasteAnimationCooldown: number;

    layer: number[];
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
};

/**
 * The Game Client is responsible for communication with the
 * {@link https://game.pixelwalker.net/ PixelWalker Game Server}.
 * The Game server has acustom implementation and is mostly
 * responsible for managing the online game worlds and running
 * socket connection.
 *
 * To compare it with how users sign up, the API Client is
 * the "lobby" from which you can access the open game rooms
 * or join a world. Then you join a world and let the Game
 * Client take over.
 *
 * This is a wrapper for the {@link GameConnection} class that
 * manages the connection to the game server on a lower level
 * where as this class is more focused on implementation of
 * logic.
 *
 * @since 1.4.2
 */
export default class GameWorld {
    /**
     * The event emitter is used to emit events when the
     * socket receives a message. The events are then
     * distributed to the listeners.
     */
    private receiver = new EventEmitter<Events>();

    /**
     * // TODO document
     */
    public structure!: Structure<WorldMeta>;

    /**
     * The block scheduling instance. This is used to organize blocks
     * into packets, and manage ratelimit, failed packets, and retries.
     */
    private scheduler: BlockScheduler;

    /**
     * // TODO document
     */
    public constructor(private game: GameClient) {
        this.scheduler = new BlockScheduler(game);
        this.addListeners();
    }

    //
    //
    // GETTERS
    //
    //

    /**
     * The width of the world.
     *
     * @since 1.4.9
     */
    public get width() {
        return this.structure.width;
    }

    /**
     * The height of the world.
     *
     * @since 1.4.9
     */
    public get height() {
        return this.structure.height;
    }

    //
    //
    // EVENTS
    //
    //

    /**
     * This method is invoked on construction of the connection
     * and adds the required listeners to the receiver.
     *
     * @since 1.4.2
     */
    private addListeners() {
        const { connection } = this.game;

        // Upon receiving player init, serialize the world buffer
        // into understandable representation of blocks.
        connection.listen("playerInitPacket", (packet) => {
            this.structure = new Structure(packet.worldWidth, packet.worldHeight);
            this.structure.deserialize(packet.worldData);
        });

        // Upon world reload, process the new world data and set
        // the blocks to its' new representation.
        connection.listen("worldReloadedPacket", (packet) => {
            this.structure.deserialize(packet.worldData);
            this.receiver.emit("Reload");
        });

        // Upon world clearing, remove all blocks and leave only a
        // gray border in the foreground layer behind.
        connection.listen("worldClearedPacket", () => {
            this.receiver.emit("Clear");
        });

        // Upon receiving meta update, process the meta update.
        // This contains attributes like the world name, description,
        // play count and other.
        connection.listen("worldMetaUpdatePacket", (meta) => {
            // TODO handle meta update
        });

        // Upon receiving a block placement, update the block in the
        // structure.
        connection.listen("worldBlockPlacedPacket", (packet) => {
            const { layer } = packet;
            const block = Block.fromId(packet.blockId);

            block.deserialize(BufferReader.from(packet.extraFields), {
                endian: "big",
                readTypeByte: true,
            });

            for (const { x, y } of packet.positions) {
                this.structure[layer][x][y] = block.copy();
            }

            this.receiver.emit(
                "Block",
                block,
                packet.positions.map(({ x, y }) => ({
                    x,
                    y,
                    layer,
                }))
            );
        });

        // TODO globalSwitchChangedPacket

        // TODO globalSwitchResetPacket

        // TODO performWorldActionPacket
    }

    /**
     * Adds the listener function to the end of the listeners array for the
     * event named `eventName`. No checks are made to see if the listener has
     * already been added. Multiple calls passing the same combination of
     * `eventNameand` listener will result in the listener being added, and
     * called, multiple times.
     *
     * | Event Name         | Description |
     * |--------------------|-------------|
     * | `Clear`            | The world content was emptied.
     * | `Reload`           | The world content was reloaded.
     *
     * @since 1.4.2
     */
    public listen<Event extends keyof Events>(eventName: Event, callback: (...e: Events[Event]) => void): this {
        this.receiver.on(eventName, callback as any);
        return this;
    }

    //
    //
    // METHODS
    //
    //

    /**
     * Requests to clear the world.
     *
     * // TODO document return, scheduling and await
     *
     * @since 1.4.2
     */
    public async clear() {
        this.game.sendChat("/clearworld");

        // TODO return promise, schedule chat and await world clear packet
    }

    /**
     * Requests to reload the world. This will sync the world with
     * its' persistant storage.
     *
     * // TODO document return, scheduling and await
     *
     * @since 1.4.2
     */
    public async reload() {
        this.game.sendChat("/reloadworld");

        // TODO return promise, schedule chat and await world reload packet
    }

    /**
     * Requests to reload the world. This will sync the world with
     * its' persistant storage.
     *
     * // TODO document return, scheduling and await
     *
     * @since 1.4.2
     */
    public async save() {
        this.game.sendChat("/saveworld");

        // TODO return promise, schedule chat and await "World saved" message
    }

    /**
     * Places a block at the specified positions. The block is placed
     * in the specified positions which include the layer. The packet is
     * sent up to a maximum of {@link Structure.LAYER_COUNT} times and
     * compress the positions per layer into one packet.
     *
     * // TODO document return, scheduling and await
     *
     * @since 1.4.3
     */
    public placeBlock(block: Block, ...positions: WorldPosition[]): Promise<any> {
        // const packet = block.toPacket();

        // for (let i = 0; i < Structure.LAYER_COUNT; i++) {
        //     packet.layer = i;
        //     packet.positions = positions.filter((pos) => pos.layer === i).map((pos) => create(PointIntegerSchema, pos));
        //     if (packet.positions.length === 0) continue;
        //     this.game.connection.send("worldBlockPlacedPacket", packet);
        // }

        // TODO return promise, schedule blocks and await

        const promises = positions.map((p) => this.scheduler.push(block, p));
        this.scheduler.process();
        return Promise.all(promises);
    }

    /**
     * Pastes a structure at given position. The structure is pasted
     * using the scheduler and will return a process that resolves once
     * all blocks are placed.
     *
     * @since 1.4.6
     */
    public async pasteStructure(structure: Structure, ox: number, oy: number, options: Partial<StructurePasteOptions> = {}) {
        const allPromises = [];
        
        const settings: StructurePasteOptions = {
            omit: [],
            pasteAnimation: ALL_AT_ONCE,
            pasteAnimationCooldown: 0,
            layer: [... new Array(Structure.LAYER_COUNT).keys()],
            minX: 0,
            minY: 0,
            maxX: this.game.width - 1,
            maxY: this.game.height - 1,
            ...options,
        };

        for (const positions of settings.pasteAnimation(structure)) {
            const promises = positions
                .filter(({ x, y, layer }) => {
                    const block = structure[layer][x][y];

                    const px = ox + x;
                    const py = oy + y;

                    let place = true;

                    // Check out bounds.
                    place &&= px >= settings.minX && py >= settings.minY && px <= settings.maxX && py <= settings.maxY;
                    
                    // Check out layer is in settings.
                    place &&= settings.layer.includes(layer);

                    // Check already placed.
                    place &&= !this.structure[layer][px][py].equals(block);

                    // Check Settings: Omit
                    place && !settings.omit.includes(block.mapping);

                    return place;
                })
                .map(({ x, y, layer }) => {
                    const block = structure[layer][x][y];

                    const px = ox + x;
                    const py = oy + y;

                    return this.scheduler.push(block, { x: px, y: py, layer });
                });

            this.scheduler.process();
            allPromises.push(...promises);

            await wait(settings.pasteAnimationCooldown);
        }

        return Promise.all(allPromises);
    }
}
