import EventEmitter from "events";
import WebSocket from "ws";

import MessageTypes from "./data/message-types.js";
import BufferReader from "./util/buffer-reader.js";
import ReceiveEvents from "./events/incoming.js";

export default class GameConnection {
    /**
     * Get an array of message typed sequenced integer → message name. Note,
     * that the array below is not full,
     *
     * @example
     *
     * ```ts
     * import { Connection } from 'pixelwalker.js'
     * console.log(Connection.MessageTypes); // ["PlayerInit", "UpdateRights", ...]
     * ```
     */
    public static MessageTypes: typeof MessageTypes = MessageTypes;

    /**
     * The Magic Bytes noting the type of connection message. All incoming
     * messages start with either of the magic bytes.
     */
    private static HeaderBytes = {
        Ping: 0x3f,
        Message: 0x6b,
    };

    /**
     * The event event attributes are the internal event emitters for the
     * game connection. They are used as an abstraction layer to append events.
     */
    #receiver: EventEmitter<ReceiveEvents> = new EventEmitter();

    /**
     * **NOTE**: Creating a `GameConnection` is not enough to connect to the game.
     * You need to manually call the `bind` method to establish a connection, after
     * registering event handlersand managing the state of your program.
     */
    constructor(private websocket: WebSocket) {
        websocket.binaryType = "arraybuffer";

        /**
         * @event
         *
         * Unexpected Response is received usually when the server is down. In
         * general, it is received when the opening connection could not be
         * established.
         */
        websocket.on("unexpected-response", (request, response) => {
            throw new Error(`Could not connect to ${request.method} "${request.host}/${request.path}": ${response.statusCode} ${response.statusMessage}`);
        });

        /**
         * @event
         *
         * The message event is received for every incoming socket message.
         */
        websocket.on("message", (message: WithImplicitCoercion<ArrayBuffer>) => {
            const buffer = BufferReader.from(message);
            if (buffer.length == 0) return;

            switch (buffer.readUInt8()) {
                case GameConnection.HeaderBytes.Ping:
                    return websocket.send(Buffer.from([GameConnection.HeaderBytes.Ping]), {});

                case GameConnection.HeaderBytes.Message:
                    const messageId = buffer.read7BitInt();
                    const args = buffer.deserialize();
                    this.emit(GameConnection.MessageTypes[messageId] as any, ...args);
                    break;
            }
        });

        /**
         * @event
         *
         * Report unhandled promises. This will log all unhandled
         * promise rejections to the event emitter.
         */
        process.on("unhandledRejection", (error) => {
            if (!(error instanceof Error)) return console.error("Unhandled Rejection:", error);

            console.error(`Unhandled Rejection: ${error.name}: ${error.message}\n${error.stack}`);
        });

        /**
         * @event
         *
         * Interupt signal. Disconnect the websocket on interupt
         * signal. This is mainly used to signal instant closing
         * of the socket tunnel, so the player instances don't
         * flood the world.
         */
        process.on("SIGINT", (signals) => {
            this.disconnect();
        });
    }

    /**
     * Adds the listener function to the end of the listeners array for all
     * events. No checks are made to see if the listener has already been added.
     * Multiple calls passing the same combination of `eventName="*"` and listener
     * will result in the listener being added, and called, multiple times.
     */
    public on<Event extends (typeof MessageTypes)[number] & keyof ReceiveEvents>(eventName: "*", cb: (eventName: Event, ...args: ReceiveEvents[Event]) => void): this;

    /**
     * Adds the listener function to the end of the listeners array for the
     * event named `eventName`. No checks are made to see if the listener has
     * already been added. Multiple calls passing the same combination of
     * `eventNameand` listener will result in the listener being added, and called,
     * multiple times.
     */
    public on<Index extends number, Event extends (typeof MessageTypes)[Index] & keyof ReceiveEvents>(eventName: Event, cb: (...args: ReceiveEvents[Event]) => void): this;

    public on(event: string, callee: (...args: any[]) => void): this {
        this.#receiver.on(event as any, callee);
        return this;
    }

    /**
     * Adds a **one-time** listener function for the event named `eventName`. The
     * next time `eventName` is triggered, this listener is removed and then invoked.
     */
    public once<Index extends number, Event extends (typeof MessageTypes)[Index] & keyof ReceiveEvents>(eventName: Event, cb: (...args: ReceiveEvents[Event]) => void): this;

    public once(event: string, callee: (...args: any[]) => void): this {
        this.#receiver.once(event as any, callee);
        return this;
    }

    /**
     * Synchronously calls each of the listeners registered for all events (`eventName="*"`)
     * in the order they were registered, passing the supplied arguments to each.
     */
    public emit<Index extends number, Event extends (typeof MessageTypes)[Index] & keyof ReceiveEvents>(listenerClass: "*", eventName: Event, ...args: ReceiveEvents[Event]): this;

    /**
     * Synchronously calls each of the listeners registered for the event named `eventName`,
     * in the order they were registered, passing the supplied arguments to each.
     */
    public emit<Index extends number, Event extends (typeof MessageTypes)[Index] & keyof ReceiveEvents>(eventName: Event, ...args: ReceiveEvents[Event]): this;

    public emit(event: string, ...args: any[]): this {
        this.#receiver.emit(event as any, ...args);
        return this;
    }

    /**
     * Synchronously sends a message to the game server, evaluating the header
     * bytes and argument format based on `eventName`.
     */
    public send(event: string, ...args: Buffer[]): this {
        const buffer = [Buffer.from([GameConnection.HeaderBytes.Message, GameConnection.MessageTypes.findIndex((m) => m === event)]), ...args];
        this.websocket.send(Buffer.concat(buffer));
        return this;
    }

    // /**
    //  * Synchronously sends a message to the game server, evaluating the header
    //  * bytes and argument format for world block placement. The reason this is
    //  * an external method is because the block data a bit more complicated as a
    //  * message.
    //  */
    // public async sendBlock(coordinates: [number, number][], layer: 0 | 1, block: Block): Promise<true> {
    //     const buffer = [
    //         Buffer.from([
    //             // The header byte
    //             GameConnection.HeaderBytes.Message,
    //             // The message type
    //             GameConnection.MessageTypes.findIndex((m) => m === "WorldBlockPlaced"),
    //         ]),
    //     ];

    //     const coords_buffer: Buffer[] = [];

    //     for (const [x, y] of coordinates) {
    //         coords_buffer.push(Buffer.from([x & 0xff, (x >> 8) & 0xff, y & 0xff, (y >> 8) & 0xff]));
    //     }

    //     buffer.push(BufferReader.ByteArray(Buffer.concat(coords_buffer)));
    //     buffer.push(BufferReader.Int32(layer));
    //     buffer.push(block.serialize());

    //     websocket.send(Buffer.concat(buffer));
    //     return true;
    // }

    /**
     * Is the current connection connected?
     */
    public connected(): boolean {
        return this.websocket && this.websocket.readyState === this.websocket.OPEN;
    }

    /**
     * Disconnect the websocket.
     */
    public disconnect() {
        this.websocket.close();
    }
}
