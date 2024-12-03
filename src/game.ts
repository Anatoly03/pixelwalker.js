import EventEmitter from "events";
import GameConnection from "./game.connection.js";

import LobbyClient from "./lobby.js";
import PlayerMap from "./players/map.js";
import World from "./world/world.js";
import Player from "./types/player.js";

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
export default class GameClient extends GameConnection {
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
     * The command prefix is a list of prefixes that are used to identify
     * bot commands in the chat.
     */
    public commandPrefix: string[] = ["!", "."];

    /**
     * The command event is called to handle chat commands from players.
     * You can listen for commands like in the example below.
     *
     * ```ts
     * game.commands.on('giveedit', ([player, username]) => {
     *     // `player` is the command caller, `username` is the argument.
     *     // You can do permission checking here.
     *
     *     game.send('playerChatPacket', {
     *         message: `/giveedit ${username}`,
     *     })
     * })
     */
    private commands = new EventEmitter<{ [commandName: string]: [Player, ...string[]] }>();

    /**
     * This static variable is used for command argument parsing. You
     * can test it at a website like [Regex101](https://regex101.com/)
     *
     * The regular expression consists of three components: a double
     * quoted string, a single quoted string and a word. The string
     * components consists of a bracket structure to match for beginning
     * and end of a string. The center part `(\\"|\\.|.)*?` matches for
     * string escapes non-greedy. The word component `\S+` matches for
     * a word (any combination of non-whitespace characters.)
     * 
     * @example
     * 
     * Here is an example of a command and the resulting matches.
     * 
     * ```
     * !test "Hello, \"World!\"" 256 wonderful-evening! --help
     *  ^^^^ ^^^^^^^^^^^^^^^^^^^ ^^^ ^^^^^^^^^^^^^^^^^^ ^^^^^^
     * ```
     */
    private static CommandLineParser = /"(\\"|\\.|.)*?"|'(\\'|\\.|.)*?'|\S+/mg;

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
    // public static withJoinKey(joinkey: string) {
    //     return new this(joinkey);
    // }

    /**
     * @todo
     */
    public static async withPocketBaseToken(args: { token: string; world_id: string }) {
        const lobby = LobbyClient.withToken(args.token);
        if (!lobby) return null;
        const joinkey = await lobby!.getJoinKey(args.world_id);
        return this.withJoinKey(joinkey);
    }

    /**
     * **NOTE**: Creating a `GameClient` is not enough to connect to the game.
     * You need to manually call the `bind` method to establish a connection, after
     * registering event handlersand managing the state of your program.
     */
    constructor(joinkey: string) {
        super(joinkey);

        // this.chat = new Chat(this.connection);
        this.players = new PlayerMap(this);
        this.world = new World(this);
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
    public override bind(): this {
        super.bind();

        /**
         * @event Ping
         *
         * Upon receiving the `ping` event, the server requires the client to
         * send back a pong back to the server. Clients which forget to send
         * a pong back to the server will be disconnected after a while.
         */
        super.listen("ping", () => {
            super.send("ping");
        });

        /**
         * @event PlayerInit
         *
         * Upon receiving the `PlayerInit` event, the server requires
         * the client to send the `PlayerInit` event as well back to
         * the server.
         */
        super.listen("playerInitPacket", () => {
            super.send("playerInitReceived");
        });

        /**
         * @event PlayerChat
         *
         * The `PlayerChat` event is emitted when a player sends a chat message.
         * This event handler will only listen for chat commands and emit the
         * command manager.
         */
        super.listen("playerChatPacket", ({ playerId, message }) => {
            let idx = this.commandPrefix.findIndex((prefix) => message.startsWith(prefix));
            if (idx === -1) return;

            const [command, ...args] = message.substring(this.commandPrefix[idx].length).match(GameClient.CommandLineParser) ?? [];
            if (!command) return;

            const player = this.players[playerId];
            if (!player) return;

            this.commands.emit(command, player, ...args);
        });

        return this;
    }

    /**
     * Register a command handler. The command handler is called when a player
     * sends a chat message that starts with the command prefix. The command
     * arguments are then parsed with a regular expression and passes the results
     * to the callback function.
     * 
     * @param commandName The name of the command to listen for. This is the first
     * argument of the command message.
     * 
     * @param player The player who sent the command. This is the first argument
     * of the callback function, you do permission checking on this instance to
     * determine if the player is allowed to execute the command.
     */
    public listenCommand(commandName: string, callback: (player: Player, ...args: string[]) => void): this {
        this.commands.on(commandName, callback);
        return this;
    }
}
