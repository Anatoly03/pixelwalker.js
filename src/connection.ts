import EventEmitter from "events";
import WebSocket from "ws";

import Config from "./data/config.js";
import MessageTypes from "./data/message-types.js";
import BufferReader, { ComponentTypeHeader } from "./util/buffer-reader.js";
import ReceiveEvents from "./events/incoming.js";
import SendEvents, { SendEventsFormat } from "./events/outgoing.js";

export default class GameConnection<Ready extends boolean = false> {
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
     * This is the variable containing the joinkey for the game connection.
     */
    #joinkey: string;

    /**
     * An open HTML connection to the game server. This is the tunnel with the
     * game server, which manages realtime communication with a world.
     */
    #socket!: Ready extends true ? WebSocket : never;

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
    constructor(joinKey: string) {
        this.#joinkey = joinKey;
    }

    /**
     * Is the current connection connected?
     */
    public connected(): this is GameConnection<true> {
        return this.#socket && this.#socket.readyState === this.#socket.OPEN;
    }

    /**
     * Adds the listener function to the end of the listeners array for the
     * event named `eventName`. No checks are made to see if the listener has
     * already been added. Multiple calls passing the same combination of
     * `eventNameand` listener will result in the listener being added, and called,
     * multiple times.
     */
    public on<
        Index extends number,
        Event extends (typeof MessageTypes)[Index] & keyof ReceiveEvents
    >(eventName: Event, cb: (...args: ReceiveEvents[Event]) => void): this;

    public on(event: string, callee: (...args: any[]) => void): this {
        this.#receiver.on(event as any, callee);
        return this;
    }

    /**
     * Adds a **one-time** listener function for the event named `eventName`. The
     * next time `eventName` is triggered, this listener is removed and then invoked.
     */
    public once<
        Index extends number,
        Event extends (typeof MessageTypes)[Index] & keyof ReceiveEvents
    >(eventName: Event, cb: (...args: ReceiveEvents[Event]) => void): this;

    public once(event: string, callee: (...args: any[]) => void): this {
        this.#receiver.once(event as any, callee);
        return this;
    }

    /**
     * Synchronously calls each of the listeners registered for the event named `eventName`,
     * in the order they were registered, passing the supplied arguments to each.
     */
    public emit<
        Index extends number,
        Event extends (typeof MessageTypes)[Index] & keyof ReceiveEvents
    >(eventName: Event, ...args: ReceiveEvents[Event]): this;

    public emit(event: string, ...args: any[]): this {
        this.#receiver.emit(event as any, ...args);
        return this;
    }

    /**
     * Synchronously sends a message to the game server, evaluating the header
     * bytes and argument format based on `eventName`.
     */
    public send<
        Index extends number,
        Event extends (typeof MessageTypes)[Index] & keyof SendEvents
    >(eventName: Event, ...args: SendEvents[Event]): this;

    public send(event: string, ...args: (boolean | number | bigint | string | Buffer)[]): this {
        const format: ComponentTypeHeader[] = SendEventsFormat[
            event as keyof typeof SendEventsFormat
        ] as any;

        const buffer = [
            Buffer.from([
                GameConnection.HeaderBytes.Message,
                GameConnection.MessageTypes.findIndex((m) => m === event),
            ]),
        ];

        for (let i = 0; i < format.length; i++) {
            buffer.push(BufferReader.Dynamic(format[i], args[i]));
        }

        this.#socket.send(Buffer.concat(buffer));
        return this;
    }

    /**
     *
     */
    public bind(): GameConnection<true> {
        this.#socket = new WebSocket(
            `wss://${Config.GameServerLink}/room/${this.#joinkey}`
        ) as any;
        this.#socket.binaryType = "arraybuffer";

        /**
         * @event
         *
         * Unexpected Response is received usually when the server is down. In
         * general, it is received when the opening connection could not be
         * established.
         */
        this.#socket.on("unexpected-response", (request, response) => {
            throw new Error(
                `Could not connect to ${request.method} "${request.host}/${request.path}": ${response.statusCode} ${response.statusMessage}`
            );
        });

        /**
         * @event
         *
         * The message event is received for every incoming socket message.
         */
        this.#socket.on(
            "message",
            (message: WithImplicitCoercion<ArrayBuffer>) => {
                const buffer = BufferReader.from(message);
                if (buffer.length == 0) return;

                switch (buffer.readUInt8()) {
                    case GameConnection.HeaderBytes.Ping:
                        return this.#socket.send(
                            Buffer.from([GameConnection.HeaderBytes.Ping]),
                            {}
                        );

                    case GameConnection.HeaderBytes.Message:
                        const messageId = buffer.read7BitInt();
                        const args = buffer.deserialize();
                        this.emit(
                            GameConnection.MessageTypes[messageId] as any,
                            ...args
                        );
                        break;
                }
            }
        );

        /**
         * @event
         *
         * Report unhandled promises. This will log all unhandled
         * promise rejections to the event emitter.
         */
        process.on("unhandledRejection", (error) => {
            if (!(error instanceof Error))
                return console.error("Unhandled Rejection:", error);

            console.error(
                `Unhandled Rejection: ${error.name}: ${error.message}\n${error.stack}`
            );
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

        return this as GameConnection<true>;
    }

    /**
     * Disconnect the websocket.
     */
    public disconnect() {
        this.#socket.close();
    }
}
