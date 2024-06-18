
import { PlayerBase } from './player'
import util from 'util'

export interface PlayerArray<P, Mut extends boolean> {
    /**
     * Get an empty array. 
     */
    none<P extends PlayerBase>(this: PlayerArray<P, Mut>): this

    /**
     * Type guard, wether or not the array is mutable.
     */
    is_mut(): this is PlayerArray<P, true>

    /**
     * Get the amount of players in the array.
     */
    get length(): number

    /**
     * Maps all players to a regular array with a callback function.
     */
    map<Z>(callback: (value: P, index: number) => Z): Z[]

    /**
     * Iterate with callback over each player.
     */
    forEach(callback: (value: P, index: number) => void): this

    /**
     * Returns a string representation of all players separated by a string, which defaults to a comma.
     */
    join(separator?: string, startWith?: string, endWith?: string): string

    /**
     * Run over all players and make sure all players satisfy a conditional lambda.
     */
    every(callback: (value: P, index: number) => boolean): boolean

    /**
     * Filter by keeping only players that satisfy the predicate. Returns an mutable array copy.
     */
    filter(predicate: (value: P, index: number) => boolean): this

    /**
     * Find the first player that matches the predicate.
     */
    find(callback: (p: P) => boolean): P | undefined

    /**
     * Determines wether a player object is in the array or not.
     */
    includes(searchElement: P): boolean

    /**
     * Accumulates a result over all player entries and returns.
     */
    reduce<Z>(callback: (previousValue: Z, currentValue: P, currentIndex: number) => Z, initialValue: Z): Z

    /**
     * Accumulates a result over all player entries and returns, starting from the right.
     */
    reduceRight<Z>(callback: (previousValue: Z, currentValue: P, currentIndex: number) => Z, initialValue: Z): Z

    /**
     * Reverse the order of entries in the player array.
     */
    reverse(): this

    /**
     * Determines whether the specified callback function returns true for any element of an array.
     */
    some(callback: (value: P, index: number) => boolean): boolean

    /**
     * Sort players with comparator lambda.
     */
    sort(compareFn: ((a: P, b: P) => number)): this

    /**
     * Shuffle the array with a random order.
     * 
     * @example Shuffled order of player turns for all players without god mode
     * ```ts
     * client.players
     *     .filter(p => !p.god)
     *     .shuffle()
     * ```
     */
    shuffle(): this

    /**
     * Sort by attribute or mapping of players
     */
    sortBy(callback: (value: P) => keyof P): this

    /**
     * Returns an iterable over all players.
     */
    values(): IterableIterator<P>

    /**
     * Iterate over all players
     */
    [Symbol.iterator](): { next: () => { value: P, done: boolean } }

    /**
     * Get the first element
     */
    first(): P | undefined

    /**
     * Get the last element
     */
    last(): P | undefined

    /**
     * Get player by cuid
     */
    byId<T extends number | string>(this: PlayerArray<{ id: T }, Mut>, id: T): P | undefined

    /**
     * Get player by cuid
     */
    byCuid(this: PlayerArray<{ cuid: string }, Mut>, cuid: string): P | undefined

    /**
     * Get player by username
     */
    byUsername(this: PlayerArray<{ username: string }, Mut>, username: string): P | undefined

    /**
     * Get a random player from selected array
     */
    random(): P | undefined

    /**
     * Pushes items into the array if mutable.
     */
    push(this: PlayerArray<P, true>, ...items: P[]): this

    /**
     * Mutable Filter
     */
    filter_mut(this: PlayerArray<P, true>, predicate: (value: P, index: number) => boolean): this

    /**
     * Remove players by trait and return all removed results.
     */
    remove_all(this: PlayerArray<P, true>, predicate: (value: P, index: number) => boolean): this

    /**
     * Return an immutable copy of the class.
     */
    immut(this: PlayerArray<P, true>): PlayerArray<P, false>

    /**
     * Returns a string representation of the player array.
     */
    toString(keys?: (keyof P)[]): string

    // https://stackoverflow.com/a/40699119/16002144
    [util.inspect.custom](): string
    get [Symbol.toStringTag](): string

    /**
     * Returns a copy of the array data.
     */
    toArray(): P[]
}
