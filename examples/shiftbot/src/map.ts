

import Client, { Animation, Block, Structure } from '../../../dist/index.js'
import client from './shift.js'
import fs from 'node:fs'
import path from 'node:path'

import { is_bot_admin } from './admin.js'

export const width = 50
export const height = 37

const TOP_LEFT = { x: parseInt(process.env.TLX || '0'), y: parseInt(process.env.TLY || '0') }
const QUEUE: string[] = []
const MAPS_PATH = process.env.MAPS_PATH || 'maps'

const map = new Structure(50, 37)
const map_without_doors = new Structure(50, 37)

function create_map() {

}

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

export function clear_map() {
    let s = fs.readFileSync(path.join(MAPS_PATH, 'empty.yaml')).toString()
    map.paste(0, 0, Structure.fromString(s))
    // map_without_doors.paste(0, 0, Structure.fromString(s))
    return client.world?.paste(TOP_LEFT.x, TOP_LEFT.y, map, {animation: Animation.RANDOM, write_empty: true })
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
        return clear_map()
    })

    return client
}