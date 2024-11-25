import { EventEmitter } from "events";

import GameConnection from "../game.connection.js";
import BufferReader from "../util/buffer-reader.js";

export default class Chat {
    /**
     * The Player map contains an updated map of players in the room.
     */
    protected players: Map<number, { id: number; cuid: string; username: string; colorCode: string }> = new Map();

    /**
     * Reference to the player's own ID.
     */
    protected readonly selfId!: number;

    /**
     * The stream to write the chat messages to. If undefined,
     * the chat messages will not be written.
     *
     * @example
     *
     * ```ts
     * const chat = new Chat(connection)
     *     .setUpstream(process.stdout);
     * ```
     */
    private stream?: NodeJS.WriteStream;

    /**
     * The command prefix is the list of prefixes that are used to
     * identify a command.
     */
    public commandPrefix = ["!", "."];

    /**
     * The event attribute is the internal event emitters for the chat
     * manager. It is used as an abstraction layer to append events.
     */
    private events: EventEmitter<{ [k: string]: [number, ...string[]] }> = new EventEmitter();

    /**
     * Create a new chat manager.
     */
    public constructor(private connection: GameConnection) {
        /**
         * @event
         *
         * The `PlayerInit` event is emitted when the player is initialized.
         */
        connection.listen("PlayerInit", (id, cuid, username, face, isAdmin, x, y, chatColor, isWorldOwner, canUseEdit, canUseGod, ..._) => {
            (this as any).selfId = id;
            this.players.set(id, {
                id,
                cuid,
                username,
                colorCode: "\x1b[0;36m",
            });
        });

        /**
         * @event
         *
         * The `PlayerJoin` event is emitted when a player other than self
         * joins the room.
         */
        connection.listen("PlayerJoined", (id, cuid, username, face, isAdmin, isFriend, isOwner, canUseGod, canUseEdit, x, y, chatColor, coins, blueCoins, deaths, collectedItems, isInGod, isInMod, crown, win, team, switches) => {
            let colorCode: string;

            switch (true) {
                case isAdmin:
                    colorCode = "\x1b[1;33m";
                    break;
                case isFriend:
                    colorCode = "\x1b[1;32m";
                    break;
                default:
                    colorCode = "\x1b[0;36m";
            }

            const player = {
                id,
                cuid,
                username,
                colorCode,
            };

            this.players.set(id, player);
        });

        connection.listen("PlayerLeft", (id) => {
            const player = this.players.get(id);
            if (!player) return;

            this.players.delete(id);
        });

        connection.listen("PlayerChatMessage", (id, message) => {
            const player = this.players.get(id);
            if (!player) return;

            for (const prefix of this.commandPrefix) {
                if (message.startsWith(prefix)) {
                    const [command, ...args] = message.substring(prefix.length).split(" ");
                    this.events.emit(command, id, ...args);
                    return;
                }
            }

            if (this.stream) {
                // Replace usernames to highlight with their color code
                for (const [id, player] of this.players) {
                    message = message.replace(new RegExp(`\\b${player.username}\\b`, "gi"), `${player.colorCode}${player.username}\x1b[0;0m`);
                }
                this.stream.write(`[${player.colorCode}${player.username}\x1b[0;0m] ${message}\n`);
            }
        });

        connection.listen("PlayerDirectMessage", (id, message) => {
            const player = this.players.get(id);
            if (!player) return;

            for (const prefix of this.commandPrefix) {
                if (message.startsWith(prefix)) {
                    const [command, ...args] = message.substring(prefix.length).split(" ");
                    this.events.emit(command, id, ...args);
                    return;
                }
            }

            if (this.stream) {
                // Replace usernames to highlight with their color code
                for (const [id, player] of this.players) {
                    message = message.replace(new RegExp(`\\b${player.username}\\b`, "gi"), `${player.colorCode}${player.username}\x1b[0;0m`);
                }

                this.stream.write(`[${player.colorCode}${player.username}\x1b[0;0m → \x1b[1;36mYOU\x1b[0;0m] ${message}\n`);
            }
        });

        connection.listen("SystemMessage", (title, message) => {
            if (this.stream) {
                if (title.startsWith("* ")) title = title.substring(2);

                // Replace usernames to highlight with their color code
                for (const [id, player] of this.players) {
                    message = message.replace(new RegExp(`\\b${player.username}\\b`, "gi"), `${player.colorCode}${player.username}\x1b[0;34m`);
                }

                this.stream.write(`[\x1b[0;34m${title}\x1b[0;0m] \x1b[0;34m${message}\x1b[0;0m\n`);
            }
        });
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
    public listen(cb: (...args: [number, string]) => void): this {
        this.connection.listen("PlayerChatMessage", cb);
        return this;
    }

    //
    //
    // METHODS
    //
    //

    /**
     * Adds an upstream to write the chat messages to.
     */
    public setUpstream(stream: NodeJS.WriteStream): this {
        this.stream = stream;
        return this;
    }

    /**
     * Appends a command handler to the event list.
     */
    public register(commandName: string, callee: (playerId: number, ...args: string[]) => any): this {
        this.events.on(commandName, callee);
        return this;
    }

    /**
     * Appends a command handler to the event list.
     */
    public registerHelp(): this {
        this.events.on("help", (pid: number) => {
            this.send(`Commands: !help`);
        });
        return this;
    }

    /**
     * Write to the chat as a player.
     */
    public send(message: string): void {
        this.connection.send("PlayerChatMessage", BufferReader.String(message));
    }

    // /**
    //  * Log to upstream.
    //  */
    // public log(level: "error" | "warning" | "info" | "success", message: string): void {
    //     if (this.stream) {
    //         switch (level) {
    //             case "success":
    //                 // message = message.replace('\x1b[0;0m', '\x1b[0;32m'); // TODO reset color?
    //                 message = `\x1b[0;32m${message}\n\x1b[0;0m`;
    //                 break;
    //             case "error":
    //                 message = `\x1b[0;31m${message}\n\x1b[0;0m`;
    //                 break;
    //             case "warning":
    //                 message = `\x1b[0;33m${message}\n\x1b[0;0m`;
    //                 break;
    //             case "info":
    //                 message = `\x1b[0;36m${message}\n\x1b[0;0m`;
    //                 break;
    //         }
    //         this.stream.write(message);
    //     }
    // }
}
