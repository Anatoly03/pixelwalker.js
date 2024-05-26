
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
    #DATA: { [keys: string]: P } = {}
    #PATH: string = 'players.yaml'
    #PT: PTBase<P>

    constructor(path: string, ClassT: PTBase<P>) {
        this.#PATH = path
        this.#PT = ClassT

        Object.defineProperty(this.#PT, 'players', {
            get: () => this.players()
        })

        if (fs.existsSync(this.#PATH)) {
            this.read()
        } else {
            this.save()
        }
    }

    private read() {
        this.#DATA = YAML.parse(fs.readFileSync(this.#PATH).toString('ascii'))
    }

    private save() {
        fs.writeFileSync(this.#PATH, YAML.stringify(this.#DATA))
    }

    private players(): PlayerArray<P> {
        const array: P[] = []
        const that = this

        for (const cuid in this.#DATA) {
            const wrap = {
                [util.inspect.custom]: () => `StorageWrapper[${this.#PT.name}, cuid='${cuid}']`,
            }

            for (const key in this.#DATA[cuid]) {
                Object.defineProperty(wrap, key, {
                    get: () => {
                        this.read()
                        const p = this.#DATA[cuid]
                        if (!p) return null
                        return p[key]
                    },
                    set: (value: any) => {
                        this.read()
                        const p = this.#DATA[cuid]
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
            this.#DATA[p.cuid] = new this.#PT(p)
            this.save()
        })

        if (this.#PT.module)
            return this.#PT.module(client)

        return client
    }
}

export default <P extends PlayerBase> (PATH: string, ClassT: { new(p?: Player): P, players: PlayerArray<P> }) => {
    return new PlayerStorageModule<P>(PATH, ClassT)
}

// export function fss (PATH: string) {
//     // if (!fs.existsSync(PATH)) {
//     //     fs.writeFileSync(PATH, YAML.stringify([{
//     //         username: 'TESTUSER',
//     //         cuid: 'testuserid',
//     //     }]))
//     // }

//     return (client: Client) => {
//         client.once('start', ([p]) => {
//             client_self = p
//         })

//         client.on('cmd:ban', ([player, _, to_ban, reason]) => {
//             if (!PERMISSION_CALLBACK(player)) return
//             if (!to_ban) return

//             to_ban = to_ban.toUpperCase()

//             const similar = Array.from(client.globalPlayers.values()).filter(p => p.username.includes(to_ban))
//             const to_ban_player = Array.from(client.globalPlayers.values()).find(p => to_ban == p.username)

//             if (to_ban_player) {
//                 const BANLIST_NEW = [...YAML.parse(fs.readFileSync(PATH).toString('ascii')), { username: to_ban_player.username, cuid: to_ban_player.cuid, reason }]
//                 fs.writeFileSync(PATH, YAML.stringify(BANLIST_NEW))
//                 player.pm('[BOT] Banned: ' + to_ban_player.username)
//                 // TODO find active player, if exists, kick
//                 return
//             }

//             if (similar.length > 0) {
//                 return player.pm(`[BOT] Could not ban. Did you mean any of: ${similar.map(p => p.username).join(', ')}?`)
//             }

//             return player.pm('[BOT] Could not find any player.')
//         })

//         client.on('cmd:unban', ([player, _, to_unban]) => {
//             if (!PERMISSION_CALLBACK(player)) return

//             to_unban = to_unban.toUpperCase()

//             const BANLIST: { username: string, cuid: string, reason: string }[] = YAML.parse(fs.readFileSync(PATH).toString('ascii'))
//             const similar = BANLIST.filter(p => p.username.includes(to_unban))
//             const to_unban_player = BANLIST.find(p => to_unban == p.username)

//             if (to_unban_player) {
//                 const BANLIST_NEW = BANLIST.filter(p => p.cuid != to_unban_player.cuid)
//                 fs.writeFileSync(PATH, YAML.stringify(BANLIST_NEW))
//                 player.pm('[BOT] Unbanned: ' + to_unban_player.username)
//                 return
//             }

//             if (similar.length > 0) {
//                 return player.pm(`[BOT] Could not unban. Did you mean any of: ${similar.map(p => p.username).join(', ')}?`)
//             }

//             return player.pm('[BOT] Could not find any player.')
//         })

//         client.on('player:join', async ([player]) => {
//             const BANLIST: { username: string, cuid: string, reason: string }[] = YAML.parse(fs.readFileSync(PATH).toString('ascii'))
//             let match

//             if (match = BANLIST.find(p => p.cuid == player.cuid)) {
//                 const { cuid, username, reason } = match
//                 player.kick(reason)
//             }
//         })

//         return client
//     }
// }
