
import Client, { Animation, Block, Structure } from '../../../dist/index.js'
import client from './shift.js'
import fs from 'node:fs'
import path from 'node:path'

import { is_bot_admin } from './admin.js'

export const width = 50
export const height = 37

const TOP_LEFT = { x: parseInt(process.env.TLX || '0'), y: parseInt(process.env.TLY || '0') }
const QUEUE: [string, string][] = []
const RECENT_MAPS: string[] = []
const MAPS_PATH = process.env.MAPS_PATH || 'maps'

const map = new Structure(50, 37)
const map_without_doors = new Structure(50, 37)

function get_map(): Structure {
    let map_path: string

    if (QUEUE.length > 0)
        map_path = QUEUE.shift()?.[0] as string
    else {
        const maps = fs.readdirSync(MAPS_PATH).filter(p => !p.startsWith('filled') && !p.startsWith('empty') && !RECENT_MAPS.includes(p))
        map_path = maps[Math.floor(maps.length * Math.random())]
        RECENT_MAPS.push(map_path)
        if (RECENT_MAPS.length >= maps.length / 2) RECENT_MAPS.shift()
    }

    return Structure.fromString(
        fs.readFileSync(path.join(MAPS_PATH, map_path))
            .toString('ascii'))
}

function encode_doors() {
    // Bottom Door
    for (let x = 1; x < map.width - 1; x++) {
        if (map_without_doors.foreground[x][map.height - 3].name == 'key_door_green') {
            map_without_doors.foreground[x][map.height - 5] = new Block('gravity_up')
            map_without_doors.foreground[x][map.height - 4] = new Block('gravity_up')
            map_without_doors.foreground[x][map.height - 3] = new Block('gravity_up')
            map_without_doors.foreground[x][map.height - 2] = new Block('gravity_up')
            map_without_doors.foreground[x + 1][map.height - 2] = new Block('hazard_stripes')
        }
    }

    // Right door
    for (let y = map.height - 1; y >= 1; y--) {
        if (map_without_doors.foreground[map.width - 1][y].name == 'key_door_green') {
            map_without_doors.foreground[map.width - 1][y] = new Block('gravity_left')
            map_without_doors.foreground[map.width - 2][y] = new Block('gravity_left')
            map_without_doors.foreground[map.width - 3][y] = new Block('gravity_left')
            map_without_doors.foreground[map.width - 4][y] = new Block('gravity_left')
            map_without_doors.foreground[0][y + 1] = new Block('hazard_stripes')
        }
    }

    // Top Door
    for (let x = map.width - 1; x >= 0; x--) {
        if (map_without_doors.foreground[x][1].name == 'key_door_green') {
            map_without_doors.foreground[x][0] = new Block('gravity_down')
            map_without_doors.foreground[x][1] = new Block('gravity_down')
            map_without_doors.foreground[x][2] = new Block('gravity_down')
            map_without_doors.foreground[x][3] = new Block('gravity_down')
            map_without_doors.foreground[x - 1][0] = new Block('hazard_stripes')
        }
    }

    // Left Door
    for (let y = 1; y < map.height - 1; y++) {
        if (map_without_doors.foreground[1][y].name == 'key_door_green') {
            map_without_doors.foreground[0][y] = new Block('gravity_right')
            map_without_doors.foreground[1][y] = new Block('gravity_right')
            map_without_doors.foreground[2][y] = new Block('gravity_right')
            map_without_doors.foreground[3][y] = new Block('gravity_right')
            map_without_doors.foreground[0][y + 1] = new Block('hazard_stripes')
        }
    }
}

function construct_map() {
    const map_no_border = get_map()
    console.log(map_no_border.meta) // TODO keep till bug gets fixed
    map.paste(1, 1, map_no_border)
    map_without_doors.paste(1, 1, map_no_border)
    encode_doors()
    return map_no_border.meta
}

function find_map(search_string: string): [string, string] | null {
    let maps: [string, { name: string }][] = fs.readdirSync(MAPS_PATH)
        .filter(p => p.startsWith('map'))
        .map(name => [name, Structure.metaFromString(
            fs.readFileSync(path.join(MAPS_PATH, name))
                .toString('ascii'))])
    const map = maps.find(p => p[1].name == search_string)
    if (map) return [map[0], map[1].name]
    maps = maps.filter(p => p[1].name.includes(search_string))
    if (maps.length == 0) return null
    return [maps[0][0], maps[0][1].name]
}

export async function open_door() {
    await client.block(TOP_LEFT.x + 22, TOP_LEFT.y + map.height - 2, 1, 'gravity_right')
    await client.block(TOP_LEFT.x + 26, TOP_LEFT.y + map.height - 2, 1, 'gravity_right')
    await client.block(TOP_LEFT.x + 28, TOP_LEFT.y + map.height - 2, 1, 'gravity_right')
    return client.block(TOP_LEFT.x + 29, TOP_LEFT.y + map.height - 2, 1, 'gravity_right')
}

export async function create_win_zone() {
    // Close Map Door
    await client.world?.paste(TOP_LEFT.x, TOP_LEFT.y, map, { animation: Animation.RANDOM, write_empty: true })
    // Create Win Zone
    await client.block(TOP_LEFT.x + 26, TOP_LEFT.y + map.height - 2, 1, 'crown')
    await client.block(TOP_LEFT.x + 28, TOP_LEFT.y + map.height - 2, 1, 0)
    return client.block(TOP_LEFT.x + 29, TOP_LEFT.y + map.height - 2, 1, 'hazard_stripes')
}

export function set_spawn() {
    return client.block(TOP_LEFT.x + 28, TOP_LEFT.y + map.height - 2, 1, 'spawn_point')
}

export function remove_spawn() {
    return client.block(TOP_LEFT.x + 28, TOP_LEFT.y + map.height - 2, 1, 0)
}

export function close_door() {
    return client.block(TOP_LEFT.x + 22, TOP_LEFT.y + map.height - 2, 1, 'hazard_stripes')
}

export async function build_map() {
    const data = fs.readFileSync(path.join(MAPS_PATH, 'filled.yaml')).toString()
    const structure = Structure.fromString(data)
    map.paste(0, 0, structure)
    map_without_doors.paste(0, 0, structure)
    const meta = construct_map()
    await client.world?.paste(TOP_LEFT.x, TOP_LEFT.y, map_without_doors, { animation: Animation.RANDOM, write_empty: true })
    return meta
}

export function clear_map() {
    const data = fs.readFileSync(path.join(MAPS_PATH, 'empty.yaml')).toString()
    map.paste(0, 0, Structure.fromString(data))
    // map_without_doors.paste(0, 0, Structure.fromString(s))
    return client.world?.paste(TOP_LEFT.x, TOP_LEFT.y, map, { animation: Animation.RANDOM, write_empty: true })
}

export function module(client: Client) {
    client.on('cmd:queue', ([player, _, name]) => {
        if (!name)
            return player.pm('[BOT] Queue: ' + (QUEUE.length > 0 ? QUEUE.map(p => p[1]).join(', ') : '---'))
        if (!is_bot_admin(player))
            return
        const result = find_map(name)
        if (!result)
            return player.pm('[BOT] Couldn\'t find that map.')
        QUEUE.push(result)
        return player.pm('[BOT] Added to Queue: ' + result[1])
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

    client.on('cmd:*build', async ([p, _, name]) => {
        if (!is_bot_admin(p)) return
        const meta = await build_map()
        client.say(`[BOT] "${meta.name}" by ${meta.creator}`)
    })

    client.on('cmd:*build-frame', async ([p, _, name]) => {
        if (!is_bot_admin(p)) return
        const data = fs.readFileSync(path.join(MAPS_PATH, 'filled.yaml')).toString()
        const structure = Structure.fromString(data)
        map.paste(0, 0, structure)
        await client.world?.paste(TOP_LEFT.x, TOP_LEFT.y, map, { animation: Animation.RANDOM, write_empty: true })
    })

    client.on('cmd:*clear', ([p, _, name]) => {
        if (!is_bot_admin(p)) return
        return clear_map()
    })

    return client
}
