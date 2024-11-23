import { EventEmitter } from "events";
import GameConnection from "../connection";

export default class Chat<T extends { [keys: string]: [number, ...string[]] } = {}> {
    /**
     * The Player map contains an updated map of players in the room.
     */
    protected players: Map<number, { id: number, cuid: string, username: string, colorCode: string }> = new Map();

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
    public commandPrefix = ['!', '.'];

    /**
     * The event attribute is the internal event emitters for the chat
     * manager. It is used as an abstraction layer to append events.
     */
    private events: EventEmitter<T> = new EventEmitter();

    /**
     * Create a new chat manager.
     */
    public constructor(private connection: GameConnection) {
        /**
         * @event
         *
         * The `PlayerInit` event is emitted when the player is initialized.
         */
        connection.once("PlayerInit", (id, cuid, username, face, isAdmin, x, y, chatColor, isWorldOwner, canUseEdit, canUseGod, ..._) => {
            this.players.set(id, {
                id,
                cuid,
                username,
                colorCode: '\x1b[0;36m',
            });
        });

        /**
         * @event
         *
         * The `PlayerJoin` event is emitted when a player other than self
         * joins the room.
         */
        connection.on("PlayerJoined", (id, cuid, username, face, isAdmin, isFriend, isOwner, canUseGod, canUseEdit, x, y, chatColor, coins, blueCoins, deaths, collectedItems, isInGod, isInMod, crown, win, team, switches) => {
            let colorCode: string;

            switch (true) {
                case (isAdmin):
                    colorCode = '\x1b[1;33m';
                    break;
                case (isFriend):
                    colorCode = '\x1b[1;32m';
                    break;
                default:
                    colorCode = '\x1b[0;36m';
            }

            const player = {
                id,
                cuid,
                username,
                colorCode
            };

            connection.send('PlayerChatMessage', `/giveedit ${username}`);

            this.players.set(id, player);
        });

        connection.on("PlayerLeft", (id) => {
            const player = this.players.get(id);
            if (!player) return;

            this.players.delete(id);
        });

        connection.on('PlayerChatMessage', (id, message) => {
            const player = this.players.get(id);
            if (!player) return;

            for (const prefix of this.commandPrefix) {
                if (message.startsWith(prefix)) {
                    const [command, ...args] = message.substring(prefix.length).split(' ');
                    (this as any).emit(command, id, ...args);
                    return;
                }
            }
            
            if (this.stream) {
                // Replace usernames to highlight with their color code
                for (const [id, player] of this.players) {
                    message = message.replace(new RegExp(`\\b${player.username}\\b`, 'gi'), `${player.colorCode}${player.username}\x1b[0;0m`);
                }
                this.stream.write(`[${player.colorCode}${player.username}\x1b[0;0m] ${message}\n`);
            }
        });

        connection.on('PlayerDirectMessage', (id, message) => {
            const player = this.players.get(id);
            if (!player) return;

            for (const prefix of this.commandPrefix) {
                if (message.startsWith(prefix)) {
                    const [command, ...args] = message.substring(prefix.length).split(' ');
                    (this as any).emit(command, id, ...args);
                    return;
                }
            }

            if (this.stream) {
                // Replace usernames to highlight with their color code
                for (const [id, player] of this.players) {
                    message = message.replace(new RegExp(`\\b${player.username}\\b`, 'gi'), `${player.colorCode}${player.username}\x1b[0;0m`);
                }

                this.stream.write(`[${player.colorCode}${player.username}\x1b[0;0m → \x1b[1;36mYOU\x1b[0;0m] ${message}\n`);
            }
        });

        connection.on('SystemMessage', (title, message) => {
            if (this.stream) {
                if (title.startsWith('* '))
                    title = title.substring(2);

                // Replace usernames to highlight with their color code
                for (const [id, player] of this.players) {
                    message = message.replace(new RegExp(`\\b${player.username}\\b`, 'gi'), `${player.colorCode}${player.username}\x1b[0;34m`);
                }

                this.stream.write(`[\x1b[0;34m${title}\x1b[0;0m] \x1b[0;34m${message}\x1b[0;0m\n`);
            }
        })
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
    public on<Event extends keyof T>(eventName: Event, cb: (...args: [number, ...string[]]) => void): this;

    public on(event: string, callee: (...args: any[]) => void): this {
        this.events.on(event as any, callee as any);
        return this;
    }

    /**
     * Adds a **one-time** listener function for the event named `eventName`. The
     * next time `eventName` is triggered, this listener is removed and then invoked.
     */
    public once<Event extends keyof T>(eventName: Event, cb: (...args: T[Event]) => void): this;

    public once(event: string, callee: (...args: any[]) => void): this {
        this.events.once(event as any, callee as any);
        return this;
    }

    /**
     * Synchronously calls each of the listeners registered for the event named `eventName`,
     * in the order they were registered, passing the supplied arguments to each.
     */
    public emit<Event extends keyof T>(eventName: Event, ...args: T[Event]): this;

    public emit(event: string, ...args: any[]): this {
        this.events.emit(event as any, ...args as any);
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
    public register<A extends string>(commandName: A, callee: (playerId: number, ...args: string[]) => any): Chat<T & { [K in A]: [number, ...string[]] }> {
        (this as any).events.on(commandName, callee);
        return this as any;
    }

    /**
     * Appends a command handler to the event list.
     */
    public registerHelp(): Chat<T & { [K in 'help']: [number, ...string[]] }> {
        (this as any).events.on('help', (pid: number) => {
            this.send(`Commands: !help`);
        });
        return this as any;
    }

    /**
     * Write to the chat as a player.
     */
    public send(message: string): void {
        this.connection.send('PlayerChatMessage', message);
    }
}
