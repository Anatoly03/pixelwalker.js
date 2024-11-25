import EventEmitter from "events";
import WebSocket from "ws";

import Config from "./data/config";
import BufferReader from "./util/buffer-reader.js";
import { MessageTypes } from "./data/message-types.js";
import { SelfPlayer } from "./types/player";
import { PlayerMap, World } from "./local";

/**
 * The Magic Bytes noting the type of connection message. All incoming
 * messages start with either of the magic bytes.
 */
const HeaderBytes = {
    Ping: 0x3f,
    Message: 0x6b,
};

export type ReceiveEvents = {
    Init: [];
    Drop: [];

    PlayerAdd: [];
    PlayerLeave: [];
};

export type SendEvents = {
    Init: [];
};

/**
 * ### Listener Events
 *
 * | Event Name   | Arguments | Description |
 * |--------------|-----------|-------------|
 * | `Init`       |           | The connection has been established. |
 * | `Drop`       |           | The connection has been dropped. |
 * | `PlayerAdd`  |           | A player has joined the game. |
 * | `PlayerLeave`|           | A player has left the game. |
 * 
 * ### Send Events
 * 
 * | Event Name   | Arguments | Description |
 * |--------------|-----------|-------------|
 */
export default class GameClient {
    /**
     * Reference to a player collection, tracking and syncing with the players
     * in the game room.
     */
    public readonly players!: PlayerMap;

    /**
     * Reference to the client player instance.
     */
    public get self(): SelfPlayer {
        return this.players.self!;
    }

    /**
     * Reference to the world instance and content
     * management.
     */
    public readonly world!: World;

    /**
     * An open HTML connection to the game server. This is the tunnel with the
     * game server, which manages realtime communication with a world.
     */
    private readonly socket!: WebSocket;

    /**
     * 
     */
    private readonly extensions: EventEmitter<> = new Map();

    /**
     * The event event attributes are the internal event emitters for the
     * game connection. They are used as an abstraction layer to append events.
     */
    #receiver: EventEmitter<ReceiveEvents> = new EventEmitter();

    /**
     * The event event attributes are the internal event emitters for the
     * game connection. They are used as an abstraction layer to append events.
     */
    #sender: EventEmitter<SendEvents> = new EventEmitter();

    /**
     * Creates a new game client from a join key. The join key can be generated
     * from the lobby client (The PocketBase) manager.
     */
    public static withKey(joinKey: string): GameClient {
        return new this(joinKey);
    }

    /**
     * **NOTE**: Creating a `GameConnection` is not enough to connect to the game.
     * You need to manually call the `bind` method to establish a connection, after
     * registering event handlersand managing the state of your program.
     */
    private constructor(private joinKey: string) {
        // this.players = new PlayerMap(this.#binaryReceiver);
        // this.world = new World(this.#binaryReceiver);
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
    public listen<Index extends number, Event extends (typeof MessageTypes)[Index] & keyof ReceiveEvents>(eventName: Event, cb: (...args: ReceiveEvents[Event]) => void): this {
        // switch (eventName) {
        //     default:
        //     case "Init":
        //     case "Drop":
        //         this.#receiver.once(event as any, cb as any);
        //         break;
        // }

        this.#receiver.on(event as any, cb as any);
        return this;
    }

    /**
     * Synchronously calls each of the listeners registered for all events (`eventName="*"`)
     * in the order they were registered, passing the supplied arguments to each.
     */
    private emitListen<Index extends number, Event extends (typeof MessageTypes)[Index] & keyof ReceiveEvents>(listenerClass: "*", eventName: Event, ...args: ReceiveEvents[Event]): this;

    /**
     * Synchronously calls each of the listeners registered for the event named `eventName`,
     * in the order they were registered, passing the supplied arguments to each.
     */
    private emitListen<Index extends number, Event extends (typeof MessageTypes)[Index] & keyof ReceiveEvents>(eventName: Event, ...args: ReceiveEvents[Event]): this;

    private emitListen(event: string, ...args: any[]): this {
        this.#receiver.emit(event as any, ...args);
        return this;
    }

    /**
     * Adds a **one-time** listener function for the event named `eventName`. The
     * next time `eventName` is triggered, this listener is removed and then invoked.
     */
    public send<Index extends number, Event extends (typeof MessageTypes)[Index] & keyof SendEvents>(eventName: Event, cb: (...args: SendEvents[Event]) => void): this;

    public send(event: string, ...args: any[]): this {
        this.#sender.emit(event as any, ...args);
        return this;
    }

    //
    //
    // METHODS
    //
    //

    /**
     *
     */
    public bind(): this {
        (this as any).socket = new WebSocket(`wss://${Config.GameServerLink}/room/${this.joinKey}`);
        this.socket.binaryType = "arraybuffer";

        /**
         * @event
         *
         * Unexpected Response is received usually when the server is down. In
         * general, it is received when the opening connection could not be
         * established.
         */
        this.socket.on("unexpected-response", (request, response) => {
            throw new Error(`Could not connect to ${request.method} "${request.host}/${request.path}": ${response.statusCode} ${response.statusMessage}`);
        });

        /**
         * @event
         *
         * The message event is received for every incoming socket message.
         */
        this.socket.on("message", (message: WithImplicitCoercion<ArrayBuffer>) => {
            const buffer = BufferReader.from(message);
            if (buffer.length == 0) return;

            switch (buffer.readUInt8()) {
                case HeaderBytes.Ping:
                    return this.socket.send(Buffer.from([HeaderBytes.Ping]), {});

                case HeaderBytes.Message:
                    const messageId = buffer.read7BitInt();
                    const args = buffer.deserialize();
                    console.log(MessageTypes[messageId], args);
                    // this.#binaryReceiver.emit("*", MessageTypes[messageId] as any, ...args);
                    // this.#binaryReceiver.emit(MessageTypes[messageId] as any, ...args);
                    break;

                default:
                    console.error(`Unknown Message Type Received: 0x${buffer.readUInt8().toString(16)}`);
                    this.disconnect();
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

        /**
         * @event PlayerInit
         *
         * Upon receiving the `PlayerInit` event, the server requires
         * the client to send the `PlayerInit` event as well back to
         * the server.
         */
        // this.#binaryReceiver.once("PlayerInit", () => {
        //     this.socket.send(Buffer.from([HeaderBytes.Message, MessageTypes.findIndex((m) => m === "PlayerInit")]), {});
        // });

        return this;
    }

    /**
     * Is the current connection connected?
     */
    public connected(): boolean {
        return this.socket ? this.socket.readyState === this.socket.OPEN : false;
    }

    /**
     * Disconnect the websocket.
     */
    public disconnect() {
        this.socket?.close();
        this.emit("Drop");
    }
}
