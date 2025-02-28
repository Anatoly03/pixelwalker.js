import { GameClient, GamePlayer } from "..";

/**
 * Arguments for a command, this also includes the permission,
 * and metadata for the command.
 */
type Command = {
    initialized: boolean;
    name: string;
    description: string;
    callback: (player: GamePlayer, ...args: string[]) => void;
    permission: (player: GamePlayer) => boolean;
};

/**
 * Arguments for a command, this also includes the permission,
 * and metadata for the command.
 */
type NewCommandArgs = {
    name: string;
    callback: (player: GamePlayer, ...args: string[]) => void;
    permission?: (player: GamePlayer) => boolean;
};

/**
 * @since 1.4.11
 */
export default class CommandManager {
    /**
     * If the client has initted, register new commands
     * manually, on init register all command register
     * requests.
     */
    private init = false;

    /**
     * Array of commands that are registered. The commands are
     * emit when a player sends a command-prefixed chat.
     *
     * @since 1.4.6
     */
    private commands: Command[] = [];

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
    private static ArgParser = /"(\\"|\\.|.)*?"|'(\\'|\\.|.)*?'|\S+/gm;

    constructor(protected game: GameClient) {
        this.addListeners();
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
        // On init, register all commands.
        this.game.listen("Init", () => {
            this.init = true;

            for (const command of this.commands) {
                command.initialized = true;
                this.game.sendChat(`/custom register ${command.name}`);
            }
        });

        // Listen chat messages for commands.
        this.game.connection.listen('playerDirectMessagePacket', (data) => {
            const prefix = "//";
            if (!data.message.startsWith("//")) return;

            const [cmd, ...args] = data.message.substring(prefix.length).match(CommandManager.ArgParser) ?? ['help'];
            if (!cmd) return;

            console.log(cmd, args);

            const player = this.game.players[data.fromPlayerId];
            if (!player) return;

            this.commands.forEach((command) => {
                if (command.name !== cmd) return;
                if (command.permission && !command.permission(player)) return;

                command.callback(player, ...args);
            });
        });

        // Register a universal help message with access to
        // commands and their descriptions.

        // Register the help command. This lists all available
        // commands for a player, or, command description if a
        // command is specified.
        this.register({
            name: "help",
            callback: (player, cmd) => {
                if (cmd) {
                    // TODO implement for `cmd` argument
                    // TODO implement private messages
                    this.game.sendChat(`/pm ${player.properties.username} //help <cmd> not implemented since pixelwalker.js@1.4.6`);
                    return;
                }

                const commands = this.commands
                    .filter((c) => !c.permission || c.permission(player))
                    .map((i) => i.name)
                    .join(", ");

                // TODO implement private messages
                this.game.sendChat(`/pm ${player.properties.username} ${commands}`);
            },
        });
    }

    //
    //
    // METHODS
    //
    //

    /**
     * Registers new commands to the command manager. This
     * method will automatically manage the rest, such as
     * initializing the command and responding to it.
     *
     * @since 1.4.11
     */
    public register(args: Partial<NewCommandArgs>): this {
        if (!args.name) throw new Error("command name is required.");

        const cmd: Command = {
            initialized: this.init,
            name: args.name,
            description: args.name,
            callback: args.callback ?? (() => {}),
            permission: args.permission ?? ((_) => true),
        };

        if (this.init) {
            this.game.sendChat(`/custom register ${cmd.name}`);
        }

        this.commands.push(cmd);
        return this;
    }
}
