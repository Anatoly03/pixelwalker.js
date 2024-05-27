import Client from "../client.js"
import Player, { PlayerBase } from "./player.js"
import util from 'util'

export class PlayerArray<P extends PlayerBase, Mut extends boolean> {
    protected data: Array<P>
    protected mut: Mut

    constructor(reference: P[] = [], mut: Mut = false as Mut) {
        this.data = reference
        this.mut = mut
    }

    /**
     * Get the amount of players in the array.
     */
    get length() {
        return this.data.length
    }

    /**
     * Maps all players to a regular array with a callback function.
     */
    public map<Z>(callback: (p: P) => Z): Z[] {
        const r: Z[] = []

        for (const p of this.data.values())
            r.push(callback(p))

        return r
    }

    /**
     * Iterate with callback over each player.
     */
    public forEach(callback: (p: P) => void) {
        for (const p of this.data.values())
            callback(p)
        return this
    }

    /**
     * Returns a string representation of all players separated by a string, which defaults to a comma.
     */
    public join(separator: string = ', '): string {
        let r: string = ''

        for (const p of this.data.values())
            r += (r == '' ? '' : separator) + p.username

        return r
    }

    /**
     * Run over all players and make sure all players satisfy a conditional lambda.
     */
    public every(callback: (p: P) => boolean) {
        for (const p of this.data.values())
            if (!callback(p))
                return false
        return true
    }

    /**
     * Filter by keeping only players that satisfy the predicate.
     */
    public filter(predicate: (value: P, index: number, array: P[]) => boolean): this {
        return new (<{ new(a: P[]): unknown }> this.constructor)(this.data.filter(predicate)) as this
    }

    /**
     * Find the first player that matches the predicate.
     */
    public find(callback: (p: P) => boolean): P | undefined {
        for (const p of this.data.values())
            if (callback(p))
                return p
    }

    /**
     * Determines wether a player object is in the array or not.
     */
    public includes(searchElement: P) {
        return this.data.includes(searchElement)
    }

    /**
     * Accumulates a result over all player entries and returns.
     */
    public reduce<Z>(callback: (previousValue: Z, currentValue: P, currentIndex: number, array: P[]) => Z, initialValue: Z): Z {
        return this.data.reduce<Z>(callback, initialValue)
    }

    /**
     * Accumulates a result over all player entries and returns, starting from the right.
     */
    public reduceRight<Z>(callback: (previousValue: Z, currentValue: P, currentIndex: number, array: P[]) => Z, initialValue: Z): Z {
        return this.data.reduceRight<Z>(callback, initialValue)
    }

    /**
     * Reverse the order of entries in the player array.
     */
    public reverse() {
        this.data = this.data.reverse()
        return this
    }

    /**
     * Determines whether the specified callback function returns true for any element of an array.
     */
    public some(callback: (p: P) => boolean) {
        for (const p of this.data.values())
            if (callback(p))
                return true
        return false
    }

    /**
     * Sort players with comparator lambda.
     */
    public sort(compareFn: ((a: P, b: P) => number) = ((player1, player2) => parseInt(player1.username, 36) - parseInt(player2.username, 36))) {
        this.data.sort(compareFn)
        return this
    }

    /**
     * Sort by attribute or mapping of players
     */
    public sortBy<Z extends string | number | boolean>(callback: (p: P) => Z) {
        this.data.sort((p1, p2) => {
            const m1 = callback(p1),
                m2 = callback(p2)

            if (Number.isInteger(m1))
                return m1 as number - (m2 as number)
            else if (m1 == true || m1 == false)
                return (m1 ? 2 : 1) - (m2 ? 2 : 1)
            return (m1 as string).localeCompare(m2 as string)
        })
        return this
    }

    /**
     * Returns an iterable over all players.
     */
    public values() {
        return this.data.values()
    }

    [Symbol.iterator]() {
        let idx = 0, data = this.data
        return {
            next: () => ({
                value: data[idx++],
                done: idx >= data.length
            })
        }
    }

    /**
     * Get the first element
     */
    public first() {
        if (this.data.length == 0) return
        return this.data[0]
    }

    /**
     * Get the last element
     */
    public last() {
        if (this.data.length == 0) return
        return this.data[this.data.length - 1]
    }

    /**
     * Get an empty array. 
     */
    public none(): this {
        return new (<{ new(a: P[]): unknown }> this.constructor)([]) as this
    }

    /**
     * Get player by public cuid
     */
    public byCuid(cuid: string) {
        for (const p of this.data.values())
            if (p.cuid == cuid)
                return p
    }

    /**
     * Get player by username
     */
    public byUsername(username: string): P | undefined {
        for (const p of this.data.values())
            if (p.username == username)
                return p
    }

    /**
     * Pushes items into the array if mutable.
     */
    public push(this: PlayerArray<P, true>, ...items: P[]): this {
        this.data.push(...items)
        return this as this
    }

    /**
     * Mutable Filter
     */
    public filter_mut(this: PlayerArray<P, true>, predicate: (value: P, index: number, array: P[]) => boolean): this {
        this.data = this.data.filter(predicate)
        return this as this
    }

    /**
     * Remove players by trait
     */
    public remove_all(this: PlayerArray<P, true>, predicate: (value: P, index: number, array: P[]) => boolean): this {
        this.filter_mut(predicate)
        return this.filter(predicate) as this
    }

    /**
     * Return an immutable copy of the class.
     */
    public immut() {
        return this as PlayerArray<P, false>
    }

    /**
     * Returns a string representation of the player array.
     */
    public toString(keys: (keyof P)[] = ['username', 'cuid']): string {
        const mapper = (player: P) => keys.map((k, i) => i == 0 ? player[k] : `[${player[k]}]`).join('')
        return '[' + this.map(mapper).join(', ') + ']'
        // return '[' + this.map(player => `${player.username}[${player.cuid}]`).join(', ') + ']'
    }

    // https://stackoverflow.com/a/40699119/16002144
    public [util.inspect.custom](): string {
        return this.toString()
    }

    get [Symbol.toStringTag]() {
        return 'PlayerArray'
    }

    /**
     * Returns a copy of the array data.
     */
    public toArray(): P[] {
        return new Array(...this.data)
    }
}

export class PlayerMap<Mut extends boolean = false> extends PlayerArray<Player, Mut> {
    
    // public override filter(predicate: (value: Player, index: number, array: Player[]) => boolean): PlayerMap {
    //     return new PlayerMap(this.data.filter(predicate))
    // }

    public byUsername(username: string): Player | undefined;
    public byUsername(identifier: `#${number}`): Player | undefined;
    public byUsername(username: string): Player | undefined {  
        if (username.startsWith('#'))
            return this.byId(parseInt(username.substring(1)))
        return super.byUsername(username)
    }

    /**
     * Gets player by specified `id`. If the generic parameter is set to true, the type
     * is forced to return a value. Use it only when output is guaranteed.
     */
    public byId<Guarantee extends boolean = false>(id: number) {
        return this.data.find(v => v.id == id) as (Guarantee extends true ? Player : (Player | undefined))
    }

    /**
     * Get Crown Holder
     */
    public byCrown(): Player | undefined {
        for (const p of this.data.values())
            if (p.has_crown)
                return p
    }

    /**
     * Send a PM to all players in array.
     */
    public pm(content: string): this {
        this.data.forEach(player => player.pm(content))
        return this
    }

    /**
     * Kick all players in array
     */
    public kick(reason?: string): this {
        this.data.forEach(player => player.kick(reason))
        return this
    }

    /**
     * Give all players rights to edit or take
     */
    public edit(state: boolean): this {
        this.data.forEach(player => player.edit(state))
        return this
    }

    /**
     * Give all players rights to god mode or take
     */
    public god(state: boolean): this {
        this.data.forEach(player => player.god(state))
        return this
    }

    /**
     * Get a random player from selected array
     */
    public random() {
        return this.data[Math.floor(this.length * Math.random())]
    }

    /**
     * Filter players based on if they are in god mode (and/or) mod mode
     */
    public filter_god(god: boolean, mod: boolean = god) {
        return this.filter(v => v.god_mode == god && v.mod_mode == mod)
    }

    /**
     * Filter only players who won
     */
    public winners() {
        return this.filter(v => v.win)
    }

    /**
     * Teleports all players to a position, or a random position, if an array is given.
     */
    public teleport(x: number, y: number): this;
    public teleport(position_list: [number, number][]): this;
    public teleport(x: number | [number, number][], y?: number): this {
        // We deal with one position.
        if (typeof x == 'number' && typeof y == 'number') {
            this.forEach(player => player.teleport(x, y))
            return this
        }
        // Here we deal with an array of positions
        const pos = x as [number, number][]
        const RANDOM_POSITION = pos[Math.floor(pos.length * Math.random())] as [number, number]
        return this.teleport(...RANDOM_POSITION)
    }

    /**
     * Reset all players in array
     */
    public reset(): this {
        this.forEach(player => player.reset())
        return this
    }

    public override toString(): string {
        return super.toString(['username', 'id'])
        // return '[' + this.map(player => `${player.username}[${player.id}]`).join(', ') + ']'
    }
}
