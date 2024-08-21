import Player from './player.js';

export default class PlayerMap {
    /**
     * @param players The direct reference of the player array.
     */
    constructor(protected players: Map<number, Player> = new Map()) {}

    /**
     * Returns the value of the player element in the list
     * where the id is the same, and undefined otherwise.
     */
    public get(id: number) {
        return this.players.get(id);
    }

    /**
     * Returns an array representation of the map.
     */
    public toArray() {
        return [...this.players.values()];
    }

    /**
     * Calls a defined callback function on each player,
     * and returns an array that contains the results.
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
    public join(separator: string = ', '): string {
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
