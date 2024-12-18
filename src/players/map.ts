// import EventEmitter from "events";

import GameConnection from "../game.connection.js";
import Player from "../types/player.js";
import { BlockMappingsReverse } from "../data/block-mappings.js";

// export type PlayerMapEvents = {
//     Init: [SelfPlayer];
//     Add: [Player];
//     Leave: [Player];
//     Face: [Player, number];
//     GodMode: [Player, boolean];
//     ModMode: [Player, boolean];
//     Respawn: [Player];
//     Crown: [Player | undefined, Player | undefined];
//     Trophy: [Player];
// };

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
 * | `GodMode` | `player`, `god` | A player enables or disables god mode. |
 * | `ModMode` | `player`, `mod` | A player enables or disables moderator mode. |
 * | `Respawn` | `player` | A player respawns. |
 * | `Crown` | `old crown`, `new crown` | The crown is passed from one player to another. |
 * | `Trophy` | `player` | A player wins a trophy. |
 */
export default class PlayerMap {
    readonly [id: number]: Player | undefined;

    /**
     * The Player map contains an updated map of players in the room.
     */
    protected players: Map<number, Player> = new Map();

    /**
     * The self player is the player that is the client itself.
     */
    public self: Player | undefined;

    /**
     * The public crown is the player that is holding the golden crown.
     */
    public crown: Player | undefined;

    /**
     * The event event attributes are the internal event emitters for the
     * game connection. They are used as an abstraction layer to append events.
     */
    // private events: EventEmitter<PlayerMapEvents> = new EventEmitter();

    /**
     * Constructs the player map wrapper on a map of players.
     */
    constructor(connection: GameConnection) {
        /**
         * @event
         *
         * The `PlayerInit` event is emitted when the player is initialized.
         */
        connection.listen("playerInitPacket", message => {
            const { playerId } = message.playerProperties!;

            this.self = {
                properties: message?.playerProperties!,
                state: {
                    $typeName: "WorldPackets.PlayerWorldState",
                    coinsGold: 0,
                    coinsBlue: 0,
                    deaths: 0,
                    collectedItems: [], // TODO
                    hasGoldCrown: false,
                    hasSilverCrown: false,
                    switches: new Uint8Array(999),
                    godmode: false,
                    modmode: false,
                    teamId: 0,
                },
            };

            this.players.set(playerId, this.self);
            // this.events.emit("Init", this.self);
        });

        /**
         * @event
         *
         * The `PlayerJoin` event is emitted when a player other than self
         * joins the room.
         */
        connection.listen("playerJoinedPacket", message => {
            const { playerId } = message.properties!;

            const player: Player = {
                properties: message.properties!,
                state: message.worldState ?? {
                    $typeName: "WorldPackets.PlayerWorldState",
                    coinsGold: 0,
                    coinsBlue: 0,
                    deaths: 0,
                    collectedItems: [], // TODO
                    hasGoldCrown: false,
                    hasSilverCrown: false,
                    switches: new Uint8Array(999),
                    godmode: false,
                    modmode: false,
                    teamId: 0,
                },
            };

            this.players.set(playerId, player);
            // this.events.emit("Add", player);
        });

        connection.listen("playerLeftPacket", message => {
            const { playerId } = message!;
            const player = this.players.get(playerId);
            if (!player) return;

            // this.events.emit("Leave", player);
            this.players.delete(playerId);
        });

        connection.listen("playerFacePacket", message => {
            const { playerId } = message!;
            const player = this.players.get(playerId!);
            if (!player) return;

            // this.events.emit("Face", player, face);
            player.properties.face = message.faceId;
        });

        connection.listen("playerGodModePacket", message => {
            const { playerId } = message!;
            const player = this.players.get(playerId!);
            if (!player) return;

            // this.events.emit("GodMode", player, god);
            player.state.godmode = message.enabled;
            player.state.modmode = false;
        });

        connection.listen("playerModModePacket", message => {
            const { playerId } = message!;
            const player = this.players.get(playerId!);
            if (!player) return;

            // this.events.emit("ModMode", player, mod);
            player.state.godmode = false;
            player.state.modmode = message.enabled;
        });

        connection.listen("playerRespawnPacket", message => {
            const { playerId } = message!;
            const player = this.players.get(playerId!);
            if (!player) return;

            if (message.position) {
                delete player.movement;
                player.properties.position!.x = message.position.x;
                player.properties.position!.y = message.position.y;
            }
            // this.events.emit("Respawn", player);
        });

        connection.listen("playerResetPacket", message => {
            const { playerId } = message!;
            const player = this.players.get(playerId!);
            if (!player) return;

            console.log("TODO RESET PLAYER: " + player.properties.username);

            if (message.position) {
                delete player.movement;
                player.properties.position!.x = message.position.x;
                player.properties.position!.y = message.position.y;
            }

            // this.events.emit("Respawn", player);
        });

        connection.listen("playerTouchBlockPacket", message => {
            const { playerId } = message!;
            const player = this.players.get(playerId!);
            if (!player) return;

            switch (BlockMappingsReverse[message.blockId]) {
                case "crown_gold":
                    if (this.crown) this.crown.state.hasGoldCrown = false;
                    player.state.hasGoldCrown = true;
                    // this.events.emit("Crown", this.crown, player);
                    break;
                case "crown_silver":
                    player.state.hasSilverCrown = true;
                    // this.events.emit("Trophy", player);
                    break;
                default:
                    console.log("TODO TOUCH BLOCK: " + BlockMappingsReverse[message.blockId]);
            }
        });

        connection.listen('playerMovedPacket', message => {
            const { playerId } = message!;
            const player = this.players.get(playerId!);
            if (!player) return;

            player.movement = message;
            // emit
        })

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
    // public listen<Event extends keyof PlayerMapEvents>(eventName: Event, cb: (...args: PlayerMapEvents[Event]) => void): this {
    //     this.events.on(eventName, cb as any);
    //     return this;
    // }

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
