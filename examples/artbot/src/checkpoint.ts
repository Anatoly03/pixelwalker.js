

import 'dotenv/config'
import Client, { Modules, Player } from '../../../dist/index.js'
import { RULE, Rule } from './settings.js'

let CHECKPOINT: {[keys: number]: [number, number]} = {}

export function module (client: Client) {
    client.onCommand('checkpoint', () => !!Rule(RULE.EVERYONE_CHECKPOINT), ([p, _, v]) => {
        if (v == 'remove') {
            delete CHECKPOINT[p.id]
            return 'Checkpoint removed!'
        }
        CHECKPOINT[p.id] = [Math.round(p.x), Math.round(p.y)]
        return 'Checkpoint saved!'
    })

    client.on('player:respawn', ([p]) => {
        if (!CHECKPOINT[p.id]) return
        p.teleport(CHECKPOINT[p.id][0], CHECKPOINT[p.id][1])
    })

    client.on('player:checkpoint', ([p]) => {
        delete CHECKPOINT[p.id]
    })

    client.on('player:reset', ([p]) => {
        delete CHECKPOINT[p.id]
    })

    return client
}
