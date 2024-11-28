import GameConnection from "./game.connection.js";

import { Events } from "./game.connection.js";
import PlayerMap from "./players/map.js";
import World from "./world/world.js";

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
     * An open HTML connection to the game server. This is the tunnel with the
     * game server, which manages realtime communication with a world.
     */
    protected connection!: GameConnection;

    /**
     * The chat manager is a utility to manage chat messages in the game. It can
     * be used to listen for chat messages, bot command requests and send to chat.
     */
    // public readonly chat: Chat;

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
    // #receiver: EventEmitter<Events> = new EventEmitter();


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
     * @returns {GameClient} A new instance of the GameClient.
     * 
     * ```ts
     * const connection = GameClient.withJoinKey(joinkey);
     * ```
     */
    public static withJoinKey(joinkey: string): GameClient | null {
        return new this(joinkey);
    }

    /**
     * **NOTE**: Creating a `GameClient` is not enough to connect to the game.
     * You need to manually call the `bind` method to establish a connection, after
     * registering event handlersand managing the state of your program.
     */
    constructor(joinkey: string) {
        this.connection = GameConnection.withJoinKey(joinkey);
        // this.chat = new Chat(this.connection);
        this.players = new PlayerMap(this.connection);
        this.world = new World(this.connection);
    }

    //
    //
    // EVENTS
    //
    //

    /**
     * Calls the internal {@link GameConnection.listen} method to listen for
     * incoming events from the server. Refer to the {@link GameConnection.listen}
     * method for more information.
     */
    public listen<Event extends keyof Events>(eventName: Event, callback: (e: Events[Event][0]) => void): this {
        this.connection.listen(eventName, callback);
        return this;
    }

    /**
     * Calls the internal {@link GameConnection.send} method to send a packet to
     * the server. Refer to the {@link GameConnection.send} method for more information.
     * 
     * The {@link GameClient} class automatically manages pings and the init hanshake to
     * keep the connection alive.
     */
    public send<Event extends keyof Events>(eventName: Event, value: Events[Event][0] = <any>{}): this {
        this.connection.send(eventName, value);
        return this;
    }
    //
    //
    // METHODS
    //
    //

    /**
     * Binds the connection to the game server. Internally, this method
     * creates a socket in the connection class and appens core event listeners.
     */
    public bind(): this {
        this.connection.bind();

        /**
         * @event Ping
         *
         * Upon receiving the `ping` event, the server requires the client to
         * send back a pong back to the server. Clients which forget to send
         * a pong back to the server will be disconnected after a while.
         */
        this.connection.listen("ping", () => {
            this.connection.send("ping");
        });

        /**
         * @event PlayerInit
         *
         * Upon receiving the `PlayerInit` event, the server requires
         * the client to send the `PlayerInit` event as well back to
         * the server.
         */
        this.connection.listen("playerInitPacket", () => {
            this.connection.send("playerInitReceived");
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
