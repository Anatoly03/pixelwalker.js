
import Client from '../client'
import Player, { PlayerBase, SelfPlayer } from '../types/player'
import { PlayerArray, StoredPlayerMap } from '../types/player-ds'
import fs from 'node:fs'
import YAML from 'yaml'
import util from 'util'

type PTBase<P extends PlayerBase> = {
    new(p?: Player): P,
    players: PlayerArray<P>,
    module?: (c: Client) => Client }

export class PlayerStorageModule<P extends PlayerBase> {
    protected data: { [keys: string]: P } = {}
    protected PT: PTBase<P>
    public path: string = 'players.yaml'

    constructor(path: string, ClassT: PTBase<P>) {
        this.path = path
        this.PT = ClassT

        Object.defineProperty(this.PT, 'players', {
            get: () => this.players()
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

    private players(): PlayerArray<P> {
        const array: P[] = []
        const that = this

        for (const cuid in this.data) {
            const wrap = {
                [util.inspect.custom]: () => `StorageWrapper[${this.PT.name}, cuid='${cuid}']`,
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

        return new PlayerArray<P>(array)
    }

    public module(client: Client) {

        client.on('player:join', ([p]) => {
            if (this.players().byCuid(p.cuid)) return
            this.read()
            this.data[p.cuid] = new this.PT(p)
            this.save()
        })

        if (this.PT.module)
            return this.PT.module(client)

        return client
    }
}

export default <P extends PlayerBase> (PATH: string, ClassT: { new(p?: Player): P, players: PlayerArray<P> }) => {
    return new PlayerStorageModule<P>(PATH, ClassT)
}
