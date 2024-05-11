

import Client, { Structure } from '../../../dist/index.js'
import { is_bot_admin } from './admin.js'

export const width = 50
export const height = 37

const TOP_LEFT = { x: parseInt(process.env.TLX || '0'), y: parseInt(process.env.TLY || '0') }
const QUEUE: string[] = []
const MAPS_PATH = process.env.MAPS_PATH

const map = new Structure(50, 37)
const map_without_doors = new Structure(50, 37)

export function module (client: Client) {
    client.on('cmd:queue', ([p, _, name]) => {
        if (!is_bot_admin(p)) return
        // TODO Add map to queue
    })

    client.on('cmd:*open', ([p, _, name]) => {
        if (!is_bot_admin(p)) return
        // TODO Open door
    })

    client.on('cmd:*close', ([p, _, name]) => {
        if (!is_bot_admin(p)) return
        // TODO Close door
    })

    client.on('cmd:*build', ([p, _, name]) => {
        if (!is_bot_admin(p)) return
        // TODO Build map
    })

    client.on('cmd:*clear', ([p, _, name]) => {
        if (!is_bot_admin(p)) return
        // TODO Clear map
    })

    return client
}