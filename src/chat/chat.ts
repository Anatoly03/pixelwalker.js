// import { EventEmitter } from "events";
// import GameConnection from "../connection";

// export default class Chat<Commands extends Lowercase<string> = never> {
//     /**
//      * The Player map contains an updated map of players in the room.
//      */
//     protected players: Map<number, { id: number; cuid: string; username: string; colorCode: string }> = new Map();

//     /**
//      * Reference to the player's own ID.
//      */
//     protected readonly selfId!: number;

//     /**
//      * Reference to the player's own Connect User ID.
//      */
//     protected readonly selfCuid!: string;

//     /**
//      * The stream to write the chat messages to. If undefined,
//      * the chat messages will not be written.
//      *
//      * @example
//      *
//      * ```ts
//      * const chat = new Chat(connection)
//      *     .setUpstream(process.stdout);
//      * ```
//      */
//     private stream?: NodeJS.WriteStream;

//     /**
//      * The command prefix is the list of prefixes that are used to
//      * identify a command.
//      */
//     public commandPrefix = ["!", "."];

//     /**
//      * The event attribute is the internal event emitters for the chat
//      * manager. It is used as an abstraction layer to append events.
//      */
//     private events: EventEmitter<{ [K in Commands]: [number, ...string[]] }> = new EventEmitter();

//     /**
//      * The commandPermissions attribute is a map of commands to their
//      * permission checkers. If the permission checker returns true,
//      * the command can be executed.
//      */
//     private commandPermissions: Map<Commands, (pid: number) => boolean> = new Map();

//     /**
//      * Create a new chat manager. Note, that the generic parameter lists
//      * all registered commands and will do very strict type checking to
//      * make sure no command is called that is not registered. To avoid this,
//      * i.e create an *open* command manager, use `string` as the generic
//      * parameter.
//      *
//      * All commands follow the convention of being lowercase. Intelisense
//      * will automatically error at commands with capital letters, however if
//      * this fails, the command will never be called at runtime.
//      *
//      * ```ts
//      * const chat = new Chat<string>(connection);
//      * chat.emit('hello', 5);       // OK
//      * chat.emit('goodbye', 4);     // OK
//      *
//      * const chat2 = new Chat<'hello' | 'hi'>(connection);
//      * chat2.emit('hello', 4);      // OK
//      * chat2.emit('goodbye', 4);    // Error: Command 'goodbye' is not registered.
//      * ```
//      */
//     public constructor(private connection: GameConnection) {
//         /**
//          * @event
//          *
//          * The `PlayerInit` event is emitted when the player is initialized.
//          */
//         connection.once("PlayerInit", (id, cuid, username, face, isAdmin, x, y, chatColor, isWorldOwner, canUseEdit, canUseGod, ..._) => {
//             this.players.set(id, {
//                 id: ((this as any).selfId = id),
//                 cuid: ((this as any).selfCuid = cuid),
//                 username,
//                 colorCode: "\x1b[0;36m",
//             });
//         });

//         /**
//          * @event
//          *
//          * The `PlayerJoin` event is emitted when a player other than self
//          * joins the room.
//          */
//         connection.on("PlayerJoined", (id, cuid, username, face, isAdmin, isFriend, isOwner, canUseGod, canUseEdit, x, y, chatColor, coins, blueCoins, deaths, collectedItems, isInGod, isInMod, crown, win, team, switches) => {
//             let colorCode: string;

//             switch (true) {
//                 case isAdmin:
//                     colorCode = "\x1b[1;33m";
//                     break;
//                 case isFriend:
//                     colorCode = "\x1b[1;32m";
//                     break;
//                 default:
//                     colorCode = "\x1b[0;36m";
//             }

//             const player = {
//                 id,
//                 cuid,
//                 username,
//                 colorCode,
//             };

//             this.players.set(id, player);
//         });

//         connection.on("PlayerLeft", (id) => {
//             const player = this.players.get(id);
//             if (!player) return;

//             this.players.delete(id);
//         });

//         connection.on("PlayerChatMessage", (id, message) => {
//             const player = this.players.get(id);
//             if (!player) return;

//             for (const prefix of this.commandPrefix) {
//                 if (message.startsWith(prefix)) {
//                     const [command, ...args] = message.substring(prefix.length).split(" ");
//                     (this as any).emit(command.toLowerCase(), id, ...args);
//                     return;
//                 }
//             }

//             if (this.stream) {
//                 // Replace usernames to highlight with their color code
//                 for (const [id, player] of this.players) {
//                     message = message.replace(new RegExp(`\\b${player.username}\\b`, "gi"), `${player.colorCode}${player.username}\x1b[0;0m`);
//                 }
//                 this.stream.write(`[${player.colorCode}${player.username}\x1b[0;0m] ${message}\n`);
//             }
//         });

//         connection.on("PlayerDirectMessage", (id, message) => {
//             const player = this.players.get(id);
//             if (!player) return;

//             for (const prefix of this.commandPrefix) {
//                 if (message.startsWith(prefix)) {
//                     const [command, ...args] = message.substring(prefix.length).split(" ");
//                     (this as any).emit(command.toLowerCase(), id, ...args);
//                     return;
//                 }
//             }

//             if (this.stream) {
//                 // Replace usernames to highlight with their color code
//                 for (const [id, player] of this.players) {
//                     message = message.replace(new RegExp(`\\b${player.username}\\b`, "gi"), `${player.colorCode}${player.username}\x1b[0;0m`);
//                 }

//                 this.stream.write(`[${player.colorCode}${player.username}\x1b[0;0m → \x1b[1;36mYOU\x1b[0;0m] ${message}\n`);
//             }
//         });

//         connection.on("SystemMessage", (title, message) => {
//             if (this.stream) {
//                 if (title.startsWith("* ")) title = title.substring(2);

//                 // Replace usernames to highlight with their color code
//                 for (const [id, player] of this.players) {
//                     message = message.replace(new RegExp(`\\b${player.username}\\b`, "gi"), `${player.colorCode}${player.username}\x1b[0;34m`);
//                 }

//                 this.stream.write(`[\x1b[0;34m${title}\x1b[0;0m] \x1b[0;34m${message}\x1b[0;0m\n`);
//             }
//         });
//     }

//     //
//     //
//     // EVENTS
//     //
//     //

//     /**
//      * Adds the listener function to the end of the listeners array for the
//      * event named `eventName`. No checks are made to see if the listener has
//      * already been added. Multiple calls passing the same combination of
//      * `eventNameand` listener will result in the listener being added, and called,
//      * multiple times.
//      */
//     public on<Event extends Commands>(eventName: Event, cb: (...args: [number, ...string[]]) => void): this;

//     public on(event: string, callee: (...args: any[]) => void): this {
//         this.events.on(event as any, callee as any);
//         return this;
//     }

//     /**
//      * Adds a **one-time** listener function for the event named `eventName`. The
//      * next time `eventName` is triggered, this listener is removed and then invoked.
//      */
//     public once<Event extends Commands>(eventName: Event, cb: (...args: [number, ...string[]]) => void): this;

//     public once(event: string, callee: (...args: any[]) => void): this {
//         this.events.once(event as any, callee as any);
//         return this;
//     }

//     /**
//      * Synchronously calls each of the listeners registered for the event named `eventName`,
//      * in the order they were registered, passing the supplied arguments to each.
//      */
//     public emit<Event extends Commands>(eventName: Event, ...args: [number, ...string[]]): this;

//     public emit(event: string, ...args: any[]): this {
//         this.events.emit(event as any, ...(args as any));
//         return this;
//     }

//     //
//     //
//     // METHODS
//     //
//     //

//     /**
//      * Adds an upstream to write the chat messages to.
//      */
//     public setUpstream(stream: NodeJS.WriteStream): this {
//         this.stream = stream;
//         return this;
//     }

//     /**
//      * Appends a command handler to the event list. **This command can
//      * be called by anyone.**
//      *
//      * @example
//      *
//      * ```ts
//      * export const chat = new Chat(connection)
//      *     .register('hello', (pid) => {
//      *         console.log(`Player ${pid} said Hello!`)
//      *     });
//      * ```
//      */
//     public register<A extends Lowercase<string>>(commandName: A, callee: (playerId: number, ...args: string[]) => any): Chat<Commands | A>;

//     /**
//      * Appends a command handler to the event list. The second argument
//      * is a permission callback that is called with the player's ID and
//      * returns a boolean. If the callback returns true, the command listener
//      * will be activated.
//      *
//      * @example
//      *
//      * ```ts
//      * export const players = new PlayerMap(connection);
//      *
//      * function PERMISSION_SELF(pid: number) {
//      *     return pid => players[pid].cuid === players.self.cuid;
//      * }
//      *
//      * export const chat = new Chat(connection)
//      *     // This registers an admin command only for even player IDs.
//      *     .register(
//      *         'even',
//      *         pid => pid % 2 == 0,
//      *         (pid) => console.log(`Player ${pid} said Hello!`)
//      *     );
//      *     // This registers an admin command only for the bot owner.
//      *     .register(
//      *         'admin',
//      *         PERMISSION_SELF,
//      *         (pid) => console.log(`Bot Admin ${pid} said Hello!`)
//      *     );
//      * ```
//      */
//     public register<A extends Lowercase<string>>(commandName: A, permissionCallback: (playerId: number) => boolean, callee: (playerId: number, ...args: string[]) => any): Chat<Commands | A>;

//     public register(commandName: string, ...callee: ((...args: any[]) => any)[]): this {
//         switch (callee.length) {
//             case 1: {
//                 (this as any).commandPermissions.set(commandName, (_: number) => true);
//                 (this as any).events.on(commandName, callee[0]);
//                 return this as any;
//             }
//             case 2: {
//                 (this as any).commandPermissions.set(commandName, callee[0]);
//                 (this as any).events.on(commandName, callee[1]);
//                 return this as any;
//             }
//             default:
//                 throw new Error("Unreachable: Invalid number of arguments despite function overloads and type hints.");
//         }
//     }

//     /**
//      * Appends a command handler to the event list.
//      */
//     public registerHelp(): Chat<Commands | "help"> {
//         (this as any).events.on("help", (pid: number) => {
//             // TODO: Implement help command
//             this.send(`Commands: !help`);
//         });
//         return this as any;
//     }

//     /**
//      * Write to the chat as a player.
//      */
//     public send(message: string): void {
//         this.connection.send("PlayerChatMessage", message);
//     }

//     /**
//      * Log to upstream.
//      */
//     public log(level: "error" | "warning" | "info" | "success", message: string): void {
//         if (this.stream) {
//             switch (level) {
//                 case "success":
//                     // message = message.replace('\x1b[0;0m', '\x1b[0;32m'); // TODO reset color?
//                     message = `\x1b[0;32m${message}\n\x1b[0;0m`;
//                     break;
//                 case "error":
//                     message = `\x1b[0;31m${message}\n\x1b[0;0m`;
//                     break;
//                 case "warning":
//                     message = `\x1b[0;33m${message}\n\x1b[0;0m`;
//                     break;
//                 case "info":
//                     message = `\x1b[0;36m${message}\n\x1b[0;0m`;
//                     break;
//             }
//             this.stream.write(message);
//         }
//     }
// }
