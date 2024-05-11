

import Client, { Block, Structure } from '../../../dist/index.js'
import client from './shift.js'

import { is_bot_admin } from './admin.js'

export const width = 50
export const height = 37

const TOP_LEFT = { x: parseInt(process.env.TLX || '0'), y: parseInt(process.env.TLY || '0') }
const QUEUE: string[] = []
const MAPS_PATH = process.env.MAPS_PATH

const map = new Structure(50, 37)
const map_without_doors = new Structure(50, 37)

export async function open_door() {
    await client.block(TOP_LEFT.x + 22, TOP_LEFT.y + map.height - 2, 1, 'gravity_right')
    await client.block(TOP_LEFT.x + 26, TOP_LEFT.y + map.height - 2, 1, 'gravity_right')
    await client.block(TOP_LEFT.x + 28, TOP_LEFT.y + map.height - 2, 1, 'gravity_right')
    return client.block(TOP_LEFT.x + 29, TOP_LEFT.y + map.height - 2, 1, 'gravity_right')
}

export async function create_win_zone() {
    await client.block(TOP_LEFT.x + 26, TOP_LEFT.y + map.height - 2, 1, 'crown')
    await client.block(TOP_LEFT.x + 28, TOP_LEFT.y + map.height - 2, 1, 0)
    return client.block(TOP_LEFT.x + 29, TOP_LEFT.y + map.height - 2, 1, 'hazard_stripes')
}

export function close_door() {
    return client.block(TOP_LEFT.x + 22, TOP_LEFT.y + map.height - 2, 1, 'hazard_stripes')
}

export function module (client: Client) {
    client.on('cmd:queue', ([p, _, name]) => {
        if (!is_bot_admin(p)) return
        // TODO Add map to queue
    })

    client.on('cmd:*open', ([p, _, name]) => {
        if (!is_bot_admin(p)) return
        return open_door()
    })

    client.on('cmd:*create-platform', ([p, _, name]) => {
        if (!is_bot_admin(p)) return
        return create_win_zone()
    })

    client.on('cmd:*close', ([p, _, name]) => {
        if (!is_bot_admin(p)) return
        return close_door()
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