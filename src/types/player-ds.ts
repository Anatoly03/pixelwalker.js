import Client from "../client.js"
import Player, { PlayerBase } from "./player.js"

import StartModule from "../modules/start.js"
import { GamePlayerModule, BasePlayerModule } from "../modules/player-manager.js"

type ReturnGuarantee<G extends boolean, R> = G extends true ? R : (R | undefined)

class GamePlayerArray extends Array<Player> {
    // private selectors: any[] // Game selectors @p[]?

    constructor(...args: Player[]) {
        super(...args)
        // this.selectors = []
    }

    /**
     * Send a PM to all players in array.
     */
    public pm(content: string): this {
        this.forEach(player => player.pm(content))
        return this
    }

    /**
     * Kick all players in array
     */
    public kick(reason?: string): this {
        this.forEach(player => player.kick(reason))
        return this
    }

    /**
     * Give all players rights to edit or take
     */
    public edit(state: boolean): this {
        this.forEach(player => player.edit(state))
        return this
    }

    /**
     * Give all players rights to god mode or take
     */
    public god(state: boolean): this {
        this.forEach(player => player.god(state))
        return this
    }

    /**
     * Get a random player from selected array
     */
    public random() {
        return this[Math.floor(this.length * Math.random())]
    }

    /**
     * Filter players based on if they are in god mode (and/or) mod mode
     */
    public filter_god(god: boolean, mod: boolean = god) {
        return new GamePlayerArray(...this.filter(v => v.god_mode == god && v.mod_mode == mod))
    }

    /**
     * Filter only players who won
     */
    public winners() {
        return new GamePlayerArray(...this.filter(v => v.win))
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

    /**
     * Returns a string representation of the player array.
     */
    toString(): string {
        return '[' + this.map(player => player.username).join(', ') + ']'
    }

    toLocaleString(): string {
        return this.toString()
    }
}

abstract class DataStructure<K, V extends PlayerBase, A extends Array<V> = Array<V>> {
    protected data: Map<K, V> = new Map()

    protected abstract createArray(...a: V[]): A

    public toArray(): V[] {
        return Array.from(this.data.values())
    }

    public byCuid(cuid: string) {
        for (const p of this.data.values())
            if (p.cuid == cuid)
                return p
    }

    public byUsername(username: string): V | undefined {
        for (const p of this.data.values())
            if (p.username == username)
                return p
    }

    public all(): A {
        return this.createArray(...this.data.values())
    }

    public filter(callback: (p: V) => boolean): A {
        const r: A = this.createArray()

        for (const p of this.data.values())
            if (callback(p))
                r.push(p)

        return r
    }

    public find(callback: (p: V) => boolean): V | undefined {
        for (const p of this.data.values())
            if (callback(p))
                return p
    }

    public map<Z>(callback: (p: V) => Z): Z[] {
        const r: Z[] = []

        for (const p of this.data.values())
            r.push(callback(p))

        return r
    }

    public forEach(callback: (p: V) => void) {
        for (const p of this.data.values())
            callback(p)
    }
}

export class PlayerMap extends DataStructure<number, Player, GamePlayerArray> {
    private client: Client

    constructor(client: Client) {
        super()
        this.client = client
            .include(StartModule(this.data))
            .include(GamePlayerModule(this, this.data))
    }

    protected createArray(...args: Player[]): GamePlayerArray {
        return new GamePlayerArray(...args)
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
        return this.data.get(id) as ReturnGuarantee<Guarantee, Player>
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
     * Returns a string representation of the players.
     */
    toString(): string {
        return '[' + this.map(player => player.username).join(', ') + ']'
    }
}

export class StoredPlayerMap extends DataStructure<string, PlayerBase> {
    constructor(client: Client) {
        super()
        client.include(BasePlayerModule(this.data))
    }

    protected createArray(...args: PlayerBase[]): PlayerBase[] {
        return [...args]
    }

    public byCuid<Guarantee extends boolean = false>(cuid: string): ReturnGuarantee<Guarantee, PlayerBase> {
        return this.data.get(cuid) as ReturnGuarantee<Guarantee, PlayerBase>
    }
}