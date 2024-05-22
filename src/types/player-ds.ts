import Client from "../client.js"
import Player, { PlayerBase } from "./player.js"

import StartModule from "../modules/start.js"
import { GamePlayerModule, BasePlayerModule } from "../modules/player-manager.js"

type ReturnGuarantee<G extends boolean, R> = G extends true ? R : (R | undefined)

class PlayerArray<P extends PlayerBase> {
    protected data: Array<P>
    // private selectors: any[] // TODO Game selectors @p[]?

    constructor(reference: P[]) {
        this.data = reference
        // this.selectors = []
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

    public forEach(callback: (p: P) => void): this {
        for (const p of this.data.values())
            callback(p)
        return this
    }

    get join() {
        return this.data.join
    }

    get every() {
        return this.data.every
    }

    public filter(predicate: (value: P, index: number, array: P[]) => boolean): this {
        return new (this.constructor as new(array: P[]) => this)(this.data.filter(predicate))
    }

    public find(callback: (p: P) => boolean): P | undefined {
        for (const p of this.data.values())
            if (callback(p))
                return p
    }

    get includes() {
        return this.data.includes
    }

    get reduce() {
        return this.data.reduce
    }

    get reduceRight() {
        return this.data.reduceRight
    }

    // reverse?

    get some() {
        return this.data.some
    }

    // sort?

    get values() {
        return this.data.values
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
    toString(): string {
        return '[' + this.map(player => player.username).join(', ') + ']'
    }

    /**
     * Returns a copy of the array data.
     */
    toArray(): P[] {
        return new Array(...this.data)
    }
}

export class PlayerMap extends PlayerArray<Player> {
    private client: Client

    constructor(client: Client) {
        const array: Player[] = []
        super(array)
        this.client = client
            .include(StartModule(array))
            .include(GamePlayerModule(this, array))
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
}

export class StoredPlayerMap extends PlayerArray<PlayerBase> {
    constructor(client: Client) {
        const array: PlayerBase[] = []
        super(array)
        client.include(BasePlayerModule(array))
    }
}