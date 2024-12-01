import EventEmitter from "events";
import GameConnection from "../game.connection.js";
import BufferReader from "../util/buffer-reader.js";
import Structure from "./structure.js";
import Block from "./block.js";

import { WorldMeta } from "../network/pixelwalker_pb.js";

// export type WorldEvents = {
//     Init: [Structure];
// };

/**
 * A World is a structure wrapper synchronized with a client.
 */
export default class World {
    /**
     * The metadata of the structure. This attribute can be used
     * to store additional information about the structure.
     */
    public get meta(): WorldMeta | undefined {
        return this.structure?.meta;
    }

    /**
     * The internal reference to a structure instance. This attribute
     * is undefined, if the world did not process `PlayerInit` yet.
     */
    public structure?: Structure<WorldMeta>;

    /**
     * The event attributes are the internal event emitters for the
     * game connection. They are used as an abstraction layer to append events.
     */
    // private events: EventEmitter<WorldEvents> = new EventEmitter();

    public constructor(connection: GameConnection) {
        /**
         * @event PlayerInit
         * 
         * The `PlayerInit` event is emitted when the player is initialized. It
         * receives the world data.
         */
        connection.listen('playerInitPacket', message => {
            const buffer = BufferReader.from(message.worldData);

            this.structure = new Structure(message.worldWidth, message.worldHeight).deserialize(buffer) as Structure<WorldMeta>;
            this.structure.meta = message.worldMeta!;

            if (buffer.subarray().length) {
                console.error(`WorldSerializationFault: World data buffer has ${buffer.subarray().length} remaining bytes.`);
                // connection.close();
                return;
            }

            // this.events.emit("Init", this.structure);
        });

        /**
         * @event WorldBlockPlaced
         * 
         * The `WorldBlockPlaced` event is emitted when a block is placed in the world.
         */
        // connection.listen('worldBlockPlacedPacket', message => {
        //     const coordinates = new Uint16Array(Buffer.from(coords).buffer);
        //     const block = new Block(bid)
        //     block.data = args;

        //     for (let i = 0; i < coords.length; i += 2) {
        //         const [x, y] = coordinates.slice(i, i + 2);
        //         // TODOthis.structure![layer][x][y] = block;
        //         console.log(block, x, y)
        //     }
        // })
    }

    //
    //
    // EVENTS
    //
    //

    /**
     * Adds the listener function to the end of the listeners array for the
     * event named `eventName`. No checks are made to see if the listener has
     * already been added. Multiple calls passing the same combination of
     * `eventNameand` listener will result in the listener being added, and called,
     * multiple times.
     */
    // public listen<Event extends keyof WorldEvents>(eventName: Event, cb: (...args: WorldEvents[Event]) => void): this {
    //     this.events.on(eventName, cb as any);
    //     return this;
    // }

    //
    //
    // METHODS
    //
    //

    // public isInitialized(): this is World<true> {
    //     return this.structure !== undefined;
    // }

    // public get width(): Init extends true ? number : undefined {
    //     return this.structure.width as any;
    // }

    // public get height(): Init extends true ? number : undefined {
    //     return this.structure.width as any;
    // }
}
