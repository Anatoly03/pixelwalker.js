import Client from "../client.js"
import Player, { PlayerBase } from "./player.js"

import StartModule from "../modules/start.js"
import { GamePlayerModule, BasePlayerModule } from "../modules/player-manager.js"

type ReturnGuarantee<G extends boolean, R> = G extends true ? R : (R | undefined)

abstract class DataStructure<K, V extends PlayerBase> {
    protected data: Map<K, V> = new Map()

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

    public all(): V[] {
        return [...this.data.values()]
    }

    public filter(callback: (p: V) => boolean): V[] {
        const r: V[] = []

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

export class PlayerMap extends DataStructure<number, Player> {
    constructor(client: Client) {
        super()
        client.include(StartModule(this.data))
        client.include(GamePlayerModule(this, this.data))
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
}

export class StoredPlayerMap extends DataStructure<string, PlayerBase> {
    constructor(client: Client) {
        super()
        client.include(BasePlayerModule(this.data))
    }

    public byCuid<Guarantee extends boolean = false>(cuid: string): ReturnGuarantee<Guarantee, PlayerBase> {
        return this.data.get(cuid) as ReturnGuarantee<Guarantee, PlayerBase>
    }
}