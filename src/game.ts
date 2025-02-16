import EventEmitter from "events";

import GameConnection from "./connection.js";
import PlayerMap from "./players/map.js";
import GameWorld from "./world/world.js";
import JoinData from "./types/join-data.js";
import GamePlayer from "./types/game-player.js";

/**
 *
 */
type Events = {
    Init: [];
};

/**
 * Arguments for a command, this also includes the permission,
 * and metadata for the command.
 */
type NewCommandArgs = {
    name: string;
    // description?: string;
    callback: (player: GamePlayer, ...args: string[]) => void;
    permission?: (player: GamePlayer) => boolean;
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
 * @since 1.4.0
 */
export default class GameClient {
    /**
     * The event emitter is used to emit events when the
     * socket receives a message. The events are then
     * distributed to the listeners.
     *
     * @since 1.4.0
     */
    private receiver = new EventEmitter<Events>();

    /**
     * @since 1.4.0
     */
    public connection: GameConnection;

    /**
     * The player map is a map of all players in the world. This
     * is synced with the server and is used to manage the world
     * players. If you want to get a snapshot of players without
     * interference use {@link PlayerMap.toArray}
     *
     * @since 1.4.1
     */
    public players = new PlayerMap();

    /**
     * // TODO document
     *
     * @since 1.4.2
     */
    public world: GameWorld;

    /**
     * Array of commands that are registered. The commands are
     * emit when a player sends a command-prefixed chat.
     *
     * @since 1.4.6
     */
    private commands: NewCommandArgs[] = [];

    /**
     * The prefix that is used to identify a user-to-bot command
     * in the chat.
     *
     * @since 1.4.6
     */
    public COMMAND_PREFIXES = ["!", "."];

    //
    //
    // STATIC
    //
    //

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
    private static CommandLineParser = /"(\\"|\\.|.)*?"|'(\\'|\\.|.)*?'|\S+/gm;

    /**
     * // TODO document
     */
    public constructor(joinKey: string) {
        this.connection = new GameConnection(joinKey);
        this.world = new GameWorld(this);
        this.players.addListeners(this);
        this.addListeners();
    }

    //
    //
    // GETTERS
    //
    //

    /**
     * @returns `true` if the connection to the server is running.
     *
     * @since 1.4.0
     */
    public get connected(): boolean {
        return this.connection.connected;
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
     * @since 1.4.1
     */
    private addListeners() {
        // Upon player init received, send init.
        this.connection.listen("playerInitPacket", () => {
            this.receiver.emit("Init");
        });

        // Listen chat messages for commands.
        this.connection.listen("playerChatPacket", (data) => {
            const prefix = this.COMMAND_PREFIXES.find((i) => data.message.startsWith(i));
            if (!prefix) return;

            const [cmd, ...args] = data.message.substring(prefix.length).match(GameClient.CommandLineParser) ?? [];
            if (!cmd) return;

            const player = this.players[data.playerId];
            if (!player) return;

            this.commands.forEach((command) => {
                if (command.name !== cmd) return;
                if (command.permission && command.permission(player)) return;

                command.callback(player, ...args);
            });
        });

        // Register the help command. This lists all available
        // commands for a player, or, command description if a
        // command is specified.
        this.registerCommand({
            name: "help",
            callback: (player, cmd) => {
                if (cmd) {
                    // TODO implement for `cmd` argument
                    // TODO implement private messages
                    this.sendChat(`/pm ${player.properties.username} /help <cmd> not implemented in pixelwalker.js@1.4.6`);
                    return;
                }

                const commands = this.commands
                    .filter((c) => !c.permission || c.permission(player))
                    .map((i) => i.name)
                    .join(", ");

                // TODO implement private messages
                this.sendChat(`/pm ${player.properties.username} ${commands}`);
            },
        });
    }

    /**
     * Adds the listener function to the end of the listeners array for the
     * event named `eventName`. No checks are made to see if the listener has
     * already been added. Multiple calls passing the same combination of
     * `eventName` and listener will result in the listener being added, and
     * called, multiple times.
     *
     * | Event Name         | Description |
     * |--------------------|-------------|
     * | `Init`             | Game emit `Init` after processing all inits synchronously: {@link PlayerMap}, {@link GameWorld}
     *
     * @since 1.4.0
     */
    public listen<Event extends keyof Events>(eventName: Event, callback: (...e: Events[Event]) => void): this {
        this.receiver.on(eventName as any, callback as any);
        return this;
    }

    /**
     * Sends a chat message to the game server. Internally this invokes
     * the `playerChatPacket` event.
     *
     * @since 1.4.1
     */
    public sendChat(message: string) {
        this.connection.send("playerChatPacket", { message });
    }

    //
    //
    // BUILDER METHODS
    //
    //

    /**
     * Set the unsaved world flag, the connection should create a new
     * world, i.e. join the world if it does not exist.
     *
     * This is a wrapper method for {@link GameConnection#addJoinData}.
     *
     * @since 1.4.4
     */
    public addJoinData(joinData: JoinData): this {
        if (this.connection.connected) throw new Error("tried to add join data after connection was established");
        this.connection.addJoinData(joinData);
        return this;
    }

    /**
     * Set the unsaved world flag, the connection should create a new
     * world, i.e. join the world if it does not exist.
     *
     * This is a wrapper method for {@link GameConnection#unsaved}.
     *
     * @since 1.4.4
     */
    public unsaved(world_title: string, world_width: number, world_height: number): this {
        if (this.connection.connected) throw new Error("tried to add unsaved world flag after connection was established");
        this.connection.unsaved(world_title, world_width, world_height);
        return this;
    }

    //
    //
    // METHODS
    //
    //

    /**
     * Binds the socket connection to the game server. The method
     * will create a new WebSocket instance and connect to the
     * game room. It will also start processing the incoming
     * messages and emit events.
     *
     * @since 1.4.0
     */
    public bind() {
        this.connection.bind();
    }

    /**
     * Closes the socket connection to the game server.
     *
     * @since 1.4.0
     */
    public close() {
        this.connection.close();
    }

    /**
     * Registers a command. The command is a string that is
     * sent to the server. The server will then process the
     * command and return a response.
     *
     * @since 1.4.6
     */
    public registerCommand(args: NewCommandArgs): this {
        this.commands.push(args);
        return this;
    }
}
