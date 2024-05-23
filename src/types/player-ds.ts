import Client from "../client.js"
import Player, { PlayerBase } from "./player.js"
import util from 'util'

import StartModule from "../modules/start.js"
import { GamePlayerModule, BasePlayerModule } from "../modules/player-manager.js"

type ReturnGuarantee<G extends boolean, R> = G extends true ? R : (R | undefined)

class PlayerArray<P extends PlayerBase> {
    protected data: Array<P>

    constructor(reference: P[]) {
        this.data = reference
    }

    get length() {
        return this.data.length
    }

    public map<Z>(callback: (p: P) => Z): Z[] {
        const r: Z[] = []

        for (const p of this.data.values())
            r.push(callback(p))

        return r
    }

    public forEach(callback: (p: P) => void) {
        for (const p of this.data.values())
            callback(p)
        return this
    }

    public join(separator: string = ', '): string {
        let r: string = ''

        for (const p of this.data.values())
            r += (r == '' ? '' : separator) + p.username

        return r
    }

    public every(callback: (p: P) => boolean) {
        for (const p of this.data.values())
            if (!callback(p))
                return false
        return true
    }

    public filter(predicate: (value: P, index: number, array: P[]) => boolean): any {
        const copy = new PlayerArray(this.toArray())
        copy.data = this.data.filter(predicate)
        return copy
    }

    public find(callback: (p: P) => boolean): P | undefined {
        for (const p of this.data.values())
            if (callback(p))
                return p
    }

    public includes(searchElement: P) {
        return this.data.includes(searchElement)
    }

    public reduce<Z>(callback: (previousValue: Z, currentValue: P, currentIndex: number, array: P[]) => Z, initialValue: Z): Z {
        return this.data.reduce<Z>(callback, initialValue)
    }

    public reduceRight<Z>(callback: (previousValue: Z, currentValue: P, currentIndex: number, array: P[]) => Z, initialValue: Z): Z {
        return this.data.reduceRight<Z>(callback, initialValue)
    }

    public reverse() {
        this.data = this.data.reverse()
        return this
    }

    public some(callback: (p: P) => boolean) {
        for (const p of this.data.values())
            if (callback(p))
                return true
        return false
    }

    public sort(compareFn: ((a: P, b: P) => number) = (player => parseInt(player.username, 36))) {
        this.data.sort(compareFn)
        return this
    }

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
     * Get player by public uid
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
     * Returns a string representation of the player array.
     */
    public toString(): string {
        return '[' + this.map(player => player.username).join(', ') + ']'
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

export class PlayerMap extends PlayerArray<Player> {
    private client?: Client
    // private selectors: any[] // TODO Game selectors @p[]?

    constructor(client?: Client) {
        const array: Player[] = []
        super(array)
        // this.selectors = []

        if (client) {
            this.client = client
                .include(StartModule(array))
                .include(GamePlayerModule(this, array))
        }
    }
    
    public filter(predicate: (value: Player, index: number, array: Player[]) => boolean): PlayerMap {
        const copy = new PlayerMap()
        copy.data = this.data.filter(predicate)
        return copy
    }

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
    public byId<Guarantee extends boolean = false>(id: number): ReturnGuarantee<Guarantee, Player> {
        return this.data.find(v => v.id == id) as ReturnGuarantee<Guarantee, Player>
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

    public toString(): string {
        return '[' + this.map(player => `${player.username}[${player.id}]`).join(', ') + ']'
    }
}

export class StoredPlayerMap extends PlayerArray<PlayerBase> {
    constructor(client?: Client) {
        const array: PlayerBase[] = []
        super(array)

        if (client) {
            client.include(BasePlayerModule(array))
        }
    }

    public filter(predicate: (value: PlayerBase, index: number, array: PlayerBase[]) => boolean): StoredPlayerMap {
        const copy = new StoredPlayerMap()
        copy.data = this.data.filter(predicate)
        return copy
    }

    public toString(): string {
        return '[' + this.map(player => `${player.username}[${player.cuid}]`).join(', ') + ']'
    }
}