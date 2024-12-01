import EventEmitter from "events";
import WebSocket from "ws";

import Config from "./data/config.js";
import * as Protocol from "./network/pixelwalker_pb.js";
import { toBinary, fromBinary, create } from "@bufbuild/protobuf";

type WorldEventNames = Protocol.WorldPacket["packet"]["case"];
type WorldEventData<Name extends WorldEventNames> = Protocol.WorldPacket["packet"] & { name: Name };
export type Events = { [K in WorldEventNames & string]: [(WorldEventData<K> & { case: K })["value"]] };

/**
 * The GameConnection is a connection to the game server at the
 * {@link https://game.pixelwalker.net/ PixelWalker Game Server}.
 * It is used to send and receive messages from the game server. The methods
 * `listen` and `send` provide interfaces to operate on incoming and with
 * outgoing messages.
 *
 * @example
 *
 * This is a minimal example to keep a connection to the game server alive.
 * The bot will not do anything other than responding to the PlayerInit event
 * once and then keep the connection alive.
 *
 * ```ts
 * export const client = LobbyClient.withToken(process.env.token);
 * export const game = await GameConnection(client.getJoinKey(process.env.world_id))
 *
 * game.listen('playerInitPacket', () => {
 *     game.send('playerInitReceived');
 * });
 * 
 * this.connection.listen("ping", () => {
 *     this.connection.send("ping");
 * });
 *
 * game.bind();
 * ```
 */
export default class GameConnection {
    /**
     * The protocol is a collection of all the possible messages that can be
     * sent and received from the game server. It is used to serialize and
     * deserialize messages to and from the game server.
     * 
     * @kind file
     */
    public static Protocol = Protocol;

    /**
     * An open HTML connection to the game server. This is the tunnel with the
     * game server, which manages realtime communication with a world.
     */
    public socket!: WebSocket;

    /**
     * The event event attributes are the internal event emitters for the
     * game connection. They are used as an abstraction layer to append events.
     */
    #receiver: EventEmitter<Events> = new EventEmitter();

    /**
     * 
     * @param joinkey The joinkey retrieved from the API server.
     * 
     * ```ts
     * import { LobbyClient } from "pixelwalker.js/localhost"
     * 
     * const client = LobbyClient.withToken(process.env.token)
     * const joinkey = await client.getJoinKey(process.env.world_id);
     * ```
     * 
     * @returns {GameConnection} A new instance of the GameConnection.
     * 
     * ```ts
     * const connection = GameConnection.withJoinKey(joinkey);
     * ```
     */
    public static withJoinKey(joinkey: string) {
        return new this(joinkey);
    }

    /**
     * **NOTE**: Creating a `GameConnection` is not enough to connect to the game.
     * You need to manually call the `bind` method to establish a connection, after
     * registering event handlersand managing the state of your program.
     */
    protected constructor(private joinkey: string) {}

    //
    //
    // EVENTS
    //
    //

    /**
     * Adds the listener function to the end of the listeners array for the
     * event named `eventName`. No checks are made to see if the listener has
     * already been added. Multiple calls passing the same combination of
     * `eventNameand` listener will result in the listener being added, and
     * called, multiple times.
     * 
     * | Event Name         | Description |
     * |--------------------|-------------|
     * | `playerInitPacket` | The message event is received when the client opens the connection.
     */
    public listen<Event extends keyof Events>(eventName: Event, callback: (e: Events[Event][0]) => void): this {
        this.#receiver.on(eventName as any, callback as any);
        return this;
    }

    /**
     * Sends a message to the game server, evaluating the header bytes and argument
     * format based on `eventName`.
     * 
     * | Event Name         | Description |
     * |--------------------|-------------|
     * | `playerInitReceived` | The message has to be sent when the client receives `playerInitPacket`.
     */
    public send<Event extends keyof Events>(eventName: Event, value: Events[Event][0] = <any>{}): this {
        const message = create(Protocol.WorldPacketSchema, { packet: { case: eventName, value } } as any);
        const buffer = toBinary(Protocol.WorldPacketSchema, message);
        this.socket.send(buffer);
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
    public bind(): void {
        if (process.env.LOCALHOST) {
            this.socket = new WebSocket(`${Config.GameServerSocketLink}/room/${this.joinkey}`, { port: 5148 }) as any;
        } else {
            this.socket = new WebSocket(`${Config.GameServerSocketLink}/room/${this.joinkey}`) as any;
        }

        this.socket.binaryType = "arraybuffer";

        /**
         * @event
         *
         * Unexpected Response is received usually when the server is down. In
         * general, it is received when the opening connection could not be
         * established.
         */
        this.socket.on("unexpected-response", (request, response) => {
            throw new Error(`Could not connect to ${request.method} ${request.host}: ${response.statusCode} ${response.statusMessage}`);
        });

        /**
         * @event
         *
         * The message event is received for every incoming socket message.
         */
        this.socket.on("message", (message: WithImplicitCoercion<ArrayBuffer>) => {
            const packet = fromBinary(Protocol.WorldPacketSchema, Buffer.from(message));
            this.#receiver.emit(packet.packet.case as any, packet.packet.value ?? {});
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
            this.close();
        });
    }

    /**
     * Is the current connection connected?
     */
    public connected(): this is GameConnection {
        return this.socket && this.socket.readyState === this.socket.OPEN;
    }

    /**
     * Disconnect the websocket.
     */
    public close() {
        this.socket?.close();
    }
}
