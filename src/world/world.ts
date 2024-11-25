import EventEmitter from "events";
import GameConnection from "../game.connection.js";
import BufferReader from "../util/buffer-reader.js";
import Structure from "./structure.js";
import Block from "./block.js";

export type WorldMeta = {
    title: string;
    owner: string;
    plays: number;
    description: string;
};

export type WorldEvents = {
    Init: [Structure];
};

/**
 * A World is a structure wrapper synchronized with a client.
 */
export default class World {
    /**
     * The metadata of the structure. This attribute can be used
     * to store additional information about the structure.
     */
    public meta?: WorldMeta;

    /**
     * The internal reference to a structure instance. This attribute
     * is undefined, if the world did not process `PlayerInit` yet.
     */
    public structure?: Structure;

    /**
     * The event attributes are the internal event emitters for the
     * game connection. They are used as an abstraction layer to append events.
     */
    private events: EventEmitter<WorldEvents> = new EventEmitter();

    public constructor(private connection: GameConnection) {
        connection.listen("PlayerInit", (_0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, title, plays, owner, description, visibility, isUnsaved, hasUnsavedChanges, globalSwitchStates, width, height, worldData) => {
            const buffer = BufferReader.from(worldData);

            this.meta = { title, owner, plays, description };
            this.structure = new Structure(width, height).deserialize(buffer);

            if (buffer.subarray().length) {
                console.error(`WorldSerializationFault: World data buffer has ${buffer.subarray().length} remaining bytes.`);
                // connection.close();
                return;
            }

            this.events.emit("Init", this.structure);
        });

        connection.listen("WorldBlockPlaced", (...args) => {
            console.log(args)
        })
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
    public listen<Event extends keyof WorldEvents>(eventName: Event, cb: (...args: WorldEvents[Event]) => void): this {
        this.events.on(eventName, cb as any);
        return this;
    }

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
