import EventEmitter from "events";
import GameConnection from "../connection.js";
import Player, { SelfPlayer } from "../types/player.js";

export type PlayerMapEvents = {
    Init: [SelfPlayer];
    Add: [Player];
    Leave: [Player];
    Face: [Player, number];
};

/**
 * The `PlayerMap` class is a wrapper around a map of players in the room.
 * It provides some methods to interact with the event manager.
 * 
 * | Event | Arguments | Description |
 * | --- | --- | --- |
 * | `Init` | `new selfPlayer` | The client is initialized. |
 * | `Add` | `new player` | A player joins the room. |
 * | `Face` | `old player`, `new face` | A player changes their face. The old face is stored under `arg0.face`, and the new face is stored under `face` |
 * | `Leave` | `old player` | A player leaves the room. |
 */
export default class PlayerMap {
    [id: number]: Player | undefined;

    /**
     * The Player map contains an updated map of players in the room.
     */
    protected players: Map<number, Player> = new Map();

    /**
     * The self player is the player that is the client itself.
     */
    public self: SelfPlayer | undefined;

    /**
     * The event event attributes are the internal event emitters for the
     * game connection. They are used as an abstraction layer to append events.
     */
    private events: EventEmitter<PlayerMapEvents> = new EventEmitter();

    /**
     * Constructs the player map wrapper on a map of players.
     */
    constructor(private connection: GameConnection) {
        /**
         * @event
         *
         * The `PlayerInit` event is emitted when the player is initialized.
         */
        connection.once("PlayerInit", (id, cuid, username, face, isAdmin, x, y, chatColor, isWorldOwnner, canUseEdit, canUseGod, ..._) => {
            this.self = {
                id,
                cuid,
                username,
                isAdmin,
                isSelf: true,
                face,
                x,
                y,
                velX: 0,
                velY: 0,
                isInGod: false,
                isInMod: false,
                canUseGod,
                canUseEdit,
                crown: false,
                win: false,
                team: 0,
                coins: 0,
                blueCoins: 0,
                deaths: 0,
                tickId: 0,
            };

            this.players.set(id, this.self);
            this.emit("Init", this.self);
        });

        /**
         * @event
         *
         * The `PlayerJoin` event is emitted when a player other than self
         * joins the room.
         */
        connection.on("PlayerJoined", (id, cuid, username, face, isAdmin, isFriend, isOwner, canUseGod, canUseEdit, x, y, chatColor, coins, blueCoins, deaths, collectedItems, isInGod, isInMod, crown, win, team, switches) => {
            const player = {
                id,
                cuid,
                username,
                isAdmin,
                isSelf: true,
                face,
                x,
                y,
                velX: 0,
                velY: 0,
                isInGod: false,
                isInMod: false,
                canUseGod,
                canUseEdit,
                crown: false,
                win: false,
                team: 0,
                coins: 0,
                blueCoins: 0,
                deaths: 0,
            };

            this.players.set(id, player);
            this.emit("Add", player);
        });

        connection.on('PlayerLeft', (id) => {
            this.emit('Leave', this.players.get(id)!);
            this.players.delete(id);
        });

        connection.on('PlayerFace', (id, face) => {
            const player = this.players.get(id)!;
            this.emit('Face', player, face);
            player.face = face;
        });

        return new Proxy(this, {
            get: (target, prop: string) => {
                if (!isNaN(+prop)) return target.players.get(+prop);
                return target[prop as any];
            },
        }) as PlayerMap;
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
    public on<Event extends keyof PlayerMapEvents>(eventName: Event, cb: (...args: PlayerMapEvents[Event]) => void): this;

    public on(event: string, callee: (...args: any[]) => void): this {
        this.events.on(event as any, callee);
        return this;
    }

    /**
     * Adds a **one-time** listener function for the event named `eventName`. The
     * next time `eventName` is triggered, this listener is removed and then invoked.
     */
    public once<Event extends keyof PlayerMapEvents>(eventName: Event, cb: (...args: PlayerMapEvents[Event]) => void): this;

    public once(event: string, callee: (...args: any[]) => void): this {
        this.events.once(event as any, callee);
        return this;
    }

    /**
     * Synchronously calls each of the listeners registered for the event named `eventName`,
     * in the order they were registered, passing the supplied arguments to each.
     */
    public emit<Event extends keyof PlayerMapEvents>(eventName: Event, ...args: PlayerMapEvents[Event]): this;

    public emit(event: string, ...args: any[]): this {
        this.events.emit(event as any, ...args);
        return this;
    }

    //
    //
    // METHODS
    //
    //

    /**
     * Returns an array representation snapshot of the map. This array will not
     * be updated or synced with the game.
     */
    public toArray() {
        return [...this.players.values()];
    }

    /**
     * Calls a defined callback function on each player,
     * and returns a snapshot array that contains the results.
     *
     * @example
     *
     * ```ts
     * // Retrieves an array of player identifiers.
     * players.map(player => player.id)
     * ```
     */
    public map<Z>(callback: (p: Player) => Z): Z[] {
        return this.toArray().map(callback);
    }

    /**
     * Performs the specified action for each player in a player array.
     */
    public forEach(callback: (p: Player) => void): this {
        this.players.forEach(callback);
        return this;
    }

    /**
     * Adds all the players of an array into a string, separated by the
     * specified separator string. Optionally, define the constants which
     * the string should start and end with.
     */
    public join(separator: string = ", "): string {
        return this.toArray().join(separator);
    }

    // /**
    //  * Run over all players and make sure all players satisfy a conditional lambda.
    //  */
    // public every(callback: (p: P) => boolean) {
    //     for (const p of this.data.values()) if (!callback(p)) return false;
    //     return true;
    // }

    // /**
    //  * Filter by keeping only players that satisfy the predicate. Returns an mutable array copy.
    //  */
    // public filter(predicate: (value: P, index: number) => boolean) {
    //     return new PlayerArray(this.data.filter(predicate), false);
    // }

    // /**
    //  * Find the first player that matches the predicate.
    //  */
    public find(callback: (p: Player) => boolean): Player | undefined {
        for (const p of this.players.values()) if (callback(p)) return p;
    }

    // /**
    //  * Determines wether a player object is in the array or not.
    //  */
    // public includes(searchElement: P): boolean {
    //     return (
    //         this.data.find((p) =>
    //             Object.entries(searchElement as Object).every(
    //                 ([k, v]) => (p as any)[k] == v
    //             )
    //         ) != undefined
    //     );
    // }

    // /**
    //  * Accumulates a result over all player entries and returns.
    //  */
    // public reduce<Z>(
    //     callback: (
    //         previousValue: Z,
    //         currentValue: P,
    //         currentIndex: number
    //     ) => Z,
    //     initialValue: Z
    // ): Z {
    //     return this.data.reduce<Z>(callback, initialValue);
    // }

    // /**
    //  * Accumulates a result over all player entries and returns, starting from the right.
    //  */
    // public reduceRight<Z>(
    //     callback: (
    //         previousValue: Z,
    //         currentValue: P,
    //         currentIndex: number
    //     ) => Z,
    //     initialValue: Z
    // ): Z {
    //     return this.data.reduceRight<Z>(callback, initialValue);
    // }

    // /**
    //  * Reverse the order of entries in the player array.
    //  */
    // public reverse() {
    //     this.data = this.data.reverse();
    //     return this;
    // }

    // /**
    //  * Determines whether the specified callback function returns true for any element of an array.
    //  */
    // public some(callback: (p: P) => boolean) {
    //     for (const p of this.data.values()) if (callback(p)) return true;
    //     return false;
    // }

    // /**
    //  * Sort players with comparator lambda.
    //  */
    // public sort(
    //     compareFn: (a: P, b: P) => number = (player1, player2) =>
    //         parseInt((player1 as any).username, 36) -
    //         parseInt((player2 as any).username, 36)
    // ): this {
    //     this.data.sort(compareFn);
    //     return this;
    // }

    // /**
    //  * Shuffle the array with a random order.
    //  *
    //  * @example Shuffled order of player turns for all players without god mode
    //  * ```ts
    //  * client.players
    //  *     .filter(p => !p.god)
    //  *     .shuffle()
    //  * ```
    //  */
    // public shuffle(): this {
    //     return this.sort(() => Math.random() - 0.5);
    // }

    // /**
    //  * Sort by attribute or mapping of players
    //  */
    // public sortBy(callback: (p: P) => keyof P) {
    //     this.data.sort((p1, p2) => {
    //         const m1 = callback(p1) as any,
    //             m2 = callback(p2) as any;

    //         if (Number.isInteger(m1)) return (m1 as number) - (m2 as number);
    //         else if (m1 == true || m1 == false)
    //             return (m1 ? 2 : 1) - (m2 ? 2 : 1);
    //         return (m1 as string).localeCompare(m2 as string);
    //     });
    //     return this;
    // }

    // /**
    //  * Get a random player from selected array
    //  */
    // public random() {
    //     if (this.length == 0) return
    //     return this.data[Math.floor(this.length * Math.random())]
    // }
}
