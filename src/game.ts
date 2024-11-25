import EventEmitter from "events";
import WebSocket from "ws";

import MessageTypes from "./data/message-types.js";
import BufferReader, { ComponentTypeHeader } from "./util/buffer-reader.js";
import { Block, GameConnection } from "./index.js";
import Chat from "./chat/chat.js";
import PlayerMap from "./players/map.js";
import World from "./world/world.js";

export type ReceiveEvents = {
    Init: [];
    Block: [Block, [number, number][], 0 | 1];
    Chat: [string];
};

export type SendEvents = {
    Block: [Block, [number, number][], 0 | 1];
    Chat: [string];
};

/**
 * The GameClient is a connection interface with the game server. It is used to
 * send and receive messages from the game server. The methods `listen` and `send`
 * provide interfaces to operate on incoming and with outgoing messages.
 *
 * @example
 *
 * This is a minimal example to keep a connection to the game server alive.
 * The bot will not do anything other than responding to the PlayerInit event
 * once and then keep the connection alive.
 *
 * ```ts
 * export const client = LobbyClient.withToken(process.env.token);
 * export const game = await client.connection(process.env.world_id);
 *
 * game.listen('PlayerInit', () => {
 *     game.send('PlayerInit');
 * });
 *
 * game.bind();
 * ```
 */
export default class GameClient {
    /**
     * Get an array of message typed sequenced integer → message name. Note,
     * that the array in the example below is not full.
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
    public static HeaderBytes = {
        Ping: 0x3f,
        Message: 0x6b,
    };

    /**
     * An open HTML connection to the game server. This is the tunnel with the
     * game server, which manages realtime communication with a world.
     */
    private connection!: GameConnection;

    /**
     * The chat manager is a utility to manage chat messages in the game. It can
     * be used to listen for chat messages, bot command requests and send to chat.
     */
    public readonly chat: Chat;

    /**
     * The Player map contains an updated map of players in the room.
     */
    public readonly players: PlayerMap;

    /**
     * The world is a structure wrapper synchronized with a client. It tracks
     * the world state and provides an interface to interact with the world.
     */
    public readonly world: World;

    /**
     * The event event attributes are the internal event emitters for the
     * game connection. They are used as an abstraction layer to append events.
     *
     * The receiver is emitted on incoming connections.
     */
    #receiver: EventEmitter<ReceiveEvents> = new EventEmitter();

    /**
     * **NOTE**: Creating a `GameClient` is not enough to connect to the game.
     * You need to manually call the `bind` method to establish a connection, after
     * registering event handlersand managing the state of your program.
     */
    constructor(joinkey: string) {
        this.connection = new GameConnection(joinkey);
        this.chat = new Chat(this.connection);
        this.players = new PlayerMap(this.connection);
        this.world = new World(this.connection);
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
    public listen<Event extends keyof ReceiveEvents>(eventName: Event, cb: (...args: ReceiveEvents[Event]) => void): this;

    public listen(event: string, callee: (...args: any[]) => void): this {
        this.#receiver.on(event as any, callee);
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
        this.connection.bind();

        /**
         * @event PlayerInit
         *
         * Upon receiving the `PlayerInit` event, the server requires
         * the client to send the `PlayerInit` event as well back to
         * the server.
         */
        this.connection.listen("PlayerInit", () => {
            this.connection.send("PlayerInit");
            // TODO initialize
            this.#receiver.emit("Init");
        });

        return this;
    }

    /**
     * Returns the current connection life state.
     */
    public connected(): boolean {
        return this.connection.connected();
    }

    /**
     * Disconnect the connection.
     */
    public disconnect() {
        this.connection.close();
    }
}
