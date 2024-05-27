
import Client from '../client'
import Player, { PlayerBase, SelfPlayer } from '../types/player'
import { PlayerArray } from '../types/player-ds'
import fs from 'node:fs'
import YAML from 'yaml'
import util from 'util'

type PTBase<P extends PlayerBase> = {
    new(p?: Player): P,
    players: PlayerArray<P, true>,
    module?: (c: Client) => Client
}

export default class StoredPlayerArray<P extends PlayerBase> extends PlayerArray<P, true> {
    private PT: PTBase<P> | undefined
    public readonly path: string = 'players.yaml'

    constructor(path: string, ClassT?: PTBase<P>, array: P[] = []) {
        super(array)
        this.path = path
        this.PT = ClassT

        if (this.PT)
            Object.defineProperty(this.PT, 'players', {
                get: () => this.wrapper()
            })

        if (fs.existsSync(this.path)) {
            this.read()
        } else {
            this.save()
        }
    }

    private read() {
        this.data = YAML.parse(fs.readFileSync(this.path).toString('ascii'))
    }

    private save() {
        fs.writeFileSync(this.path, YAML.stringify(this.data))
    }

    public override push(...items: P[]): this {
        const that = super.push(...items)
        this.save()
        return that
    }

    public override filter_mut(predicate: (value: P, index: number, array: P[]) => boolean): this {
        const that = super.filter_mut(predicate)
        this.save()
        return that
    }

    public remove_all(predicate: (value: P, index: number, array: P[]) => boolean): this {
        const that = super.remove_all(predicate)
        this.save()
        return that
    }

    public module(client: Client): Client {
        if (!this.PT || !this.PT.module) return client
        return this.PT.module(client)
    }

    private wrapper(): PlayerArray<P, true> {
        if (!this.PT || !this.PT.module) throw new Error('PT was unexpected null')

        const array: P[] = []
        const that = this

        for (const cuid in this.data) {
            const wrap = {
                [util.inspect.custom]: () => `StorageWrapper[${this.PT?.name}, cuid='${cuid}']`,
            }

            for (const key in this.data[cuid]) {
                Object.defineProperty(wrap, key, {
                    get: () => {
                        this.read()
                        const p = this.data[cuid]
                        if (!p) return null
                        return p[key]
                    },
                    set: (value: any) => {
                        this.read()
                        const p = this.data[cuid]
                        if (!p) return
                        p[key] = value
                        this.save()
                    }
                })
            }

            array.push(wrap as unknown as P)
        }

        return new StoredPlayerArray<P>(this.path, undefined, array)
    }
}

