
import Client from '../client'
import Player, { PlayerBase, SelfPlayer } from '../types/player'
import { PlayerArray } from '../types/player-ds'
import fs from 'node:fs'
import YAML from 'yaml'
import util from 'util'

type PTBase<P extends PlayerBase, K extends PlayerBase> = {
    new(p: K): P,
    players: PlayerArray<P, true, true>,
    module?: (c: Client, ...args: any[]) => Client
}

export default class StoredPlayerArray<P extends PlayerBase, K extends PlayerBase> extends PlayerArray<P, true, true> {
    private PT: PTBase<P, K> | undefined
    public readonly path: string = 'players.yaml'
    public module_args: any[] = []

    constructor(path: string, ClassT?: PTBase<P, K>, array: P[] = []) {
        super(typeof path == 'string' ? array : path, true, true)

        this.path = path
        this.PT = ClassT

        if (this.PT)
            Object.defineProperty(this.PT, 'players', {
                get: () => this.wrapper()
            })

        if (fs.existsSync(this.path)) {
            this.load()
        } else {
            this.save()
        }
    }

    protected load() {
        super.load()
        this.data = YAML.parse(fs.readFileSync(this.path).toString('ascii'))
    }

    protected save() {
        super.save()
        fs.writeFileSync(this.path, YAML.stringify(this.data))
    }

    public module(client: Client): Client {
        if (!this.PT || !this.PT.module) return client
        return this.PT.module(client, ...this.module_args)
    }

    private wrapper(): PlayerArray<P, true, true> {
        if (!this.PT || !this.PT.module) throw new Error('PT was unexpected null')

        const array: P[] = []
        const that = this

        for (const cuid in this.data) {
            const wrap = {
                [util.inspect.custom]: () => `StorageWrapper[${this.PT?.name}, cuid='${cuid}']`,
            }

            // TODO should it be deep keys wrapping?

            for (const key in this.data[cuid]) {
                Object.defineProperty(wrap, key, {
                    get: () => {
                        this.load()
                        const p = this.data[cuid]
                        if (!p) return null
                        return p[key]
                    },
                    set: (value: any) => {
                        this.load()
                        const p = this.data[cuid]
                        if (!p) return
                        p[key] = value
                        this.save()
                    }
                })
            }

            array.push(wrap as unknown as P)
        }

        return new StoredPlayerArray<P, K>(this.path, undefined, array)
    }
}

