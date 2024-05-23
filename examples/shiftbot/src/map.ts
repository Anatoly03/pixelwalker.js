
import Client, { Animation, Block, Structure } from '../../../dist/index.js'
import client from './shift.js'
import fs, { writeFileSync } from 'node:fs'
import path from 'node:path'

import { is_bot_admin } from './admin.js'

export const width = 50
export const height = 37

export const TOP_LEFT = { x: parseInt(process.env.TLX || '0'), y: parseInt(process.env.TLY || '0') }
const QUEUE: [string, string][] = []
const RECENT_MAPS: string[] = []
const MAPS_PATH = process.env.MAPS_PATH || 'maps'

const map = new Structure(50, 37)
const map_without_doors = new Structure(50, 37)

let CrowdControlFlip = false // Crowd Control Flip

function get_map(): Structure {
    let maps = fs.readdirSync(MAPS_PATH).filter(p => !p.startsWith('filled') && !p.startsWith('empty')),
        map_path: string

    if (QUEUE.length > 0)
        map_path = QUEUE.shift()?.[0] as string
    else {
        maps = maps.filter(p => !RECENT_MAPS.includes(p))
        map_path = maps[Math.floor(maps.length * Math.random())]
    }

    RECENT_MAPS.push(map_path)
    if (RECENT_MAPS.length >= maps.length / 2) RECENT_MAPS.shift()

    return Structure.fromString(
        fs.readFileSync(path.join(MAPS_PATH, map_path))
            .toString('ascii'))
}

function encode_doors() {
    const DOOR_LINE = ['gravity_up', 'gravity_up', 'gravity_up', 'gravity_up', 'hazard_stripes']
    const OFFSET = CrowdControlFlip ? -1 : 1

    let HORIZONTAL = [...Array(map.width - 2).keys()].map(i => i + 1)
    let VERTICAL = [...Array(map.height - 2).keys()].map(i => i + 1)

    if (CrowdControlFlip) {
        HORIZONTAL = HORIZONTAL.reverse()
        VERTICAL = VERTICAL.reverse()
    }

    // Bottom Door
    HORIZONTAL.forEach(x => {
        if (map_without_doors.foreground[x][map.height - 3].name != 'key_door_green') return
        map_without_doors.foreground[x][map.height - 5] = new Block('gravity_up')
        map_without_doors.foreground[x][map.height - 4] = new Block('gravity_up')
        map_without_doors.foreground[x][map.height - 3] = new Block('gravity_up')
        map_without_doors.foreground[x][map.height - 2] = new Block('gravity_up')
        map_without_doors.foreground[x + OFFSET][map.height - 2] = new Block('hazard_stripes')
    })

    // Left Door
    VERTICAL.forEach(y => {
        if (map_without_doors.foreground[1][y].name != 'key_door_green') return
        map_without_doors.foreground[0][y] = new Block('gravity_right')
        map_without_doors.foreground[1][y] = new Block('gravity_right')
        map_without_doors.foreground[2][y] = new Block('gravity_right')
        map_without_doors.foreground[3][y] = new Block('gravity_right')
        map_without_doors.foreground[0][y + OFFSET] = new Block('hazard_stripes')
    })

    HORIZONTAL = HORIZONTAL.reverse()
    VERTICAL = VERTICAL.reverse()

    // Right door
    VERTICAL.forEach(y => {
        if (map_without_doors.foreground[map.width - 1][y].name != 'key_door_green') return
        map_without_doors.foreground[map.width - 1][y] = new Block('gravity_left')
        map_without_doors.foreground[map.width - 2][y] = new Block('gravity_left')
        map_without_doors.foreground[map.width - 3][y] = new Block('gravity_left')
        map_without_doors.foreground[map.width - 4][y] = new Block('gravity_left')
        map_without_doors.foreground[0][y + OFFSET] = new Block('hazard_stripes')
    })

    // Top Door
    HORIZONTAL.forEach(x => {
        if (map_without_doors.foreground[x][1].name != 'key_door_green') return
        map_without_doors.foreground[x][0] = new Block('gravity_down')
        map_without_doors.foreground[x][1] = new Block('gravity_down')
        map_without_doors.foreground[x][2] = new Block('gravity_down')
        map_without_doors.foreground[x][3] = new Block('gravity_down')
        map_without_doors.foreground[x - OFFSET][0] = new Block('hazard_stripes')
    })
}

function construct_map() {
    const map_no_border = get_map()
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

export function open_door() {
    // TODO CrowdControlFlip
    return Promise.all([22, 26, 28, 29]
        .map(x => client.block(TOP_LEFT.x + x, TOP_LEFT.y + map.height - 2, 1, CrowdControlFlip ? 'gravity_left' : 'gravity_right')))
}

export async function create_win_zone() {
    // TODO CrowdControlFlip
    // Close Map Door
    await client.world?.paste(TOP_LEFT.x, TOP_LEFT.y, map, { animation: Animation.RANDOM, write_empty: true })
    // Create Win Zone
    await client.block(TOP_LEFT.x + 26, TOP_LEFT.y + map.height - 2, 1, 'crown')
    await client.block(TOP_LEFT.x + 28, TOP_LEFT.y + map.height - 2, 1, 0)
    return client.block(TOP_LEFT.x + 29, TOP_LEFT.y + map.height - 2, 1, 'hazard_stripes')
}

export function set_spawn() {
    // TODO CrowdControlFlip
    return client.block(TOP_LEFT.x + 28, TOP_LEFT.y + map.height - 2, 1, 'spawn_point')
}

export function remove_spawn() {
    // TODO CrowdControlFlip
    return client.block(TOP_LEFT.x + 28, TOP_LEFT.y + map.height - 2, 1, 0)
}

export function close_door() {
    // TODO CrowdControlFlip
    return client.block(TOP_LEFT.x + 22, TOP_LEFT.y + map.height - 2, 1, 'hazard_stripes')
}

export async function build_map() {
    const data = fs.readFileSync(path.join(MAPS_PATH, CrowdControlFlip ? 'filled-reverse.yaml' : 'filled.yaml')).toString()
    const structure = Structure.fromString(data)
    map.paste(0, 0, structure)
    map_without_doors.paste(0, 0, structure)
    const meta = construct_map()
    await client.world?.paste(TOP_LEFT.x, TOP_LEFT.y, map_without_doors, { animation: Animation.RANDOM, write_empty: true })
    return meta
}

export function clear_map() {
    // Uncomment to clear all map
    // const data = fs.readFileSync(path.join(MAPS_PATH, 'empty.yaml')).toString()
    // map.paste(0, 0, Structure.fromString(data))

    // This will keep the first arrow line in tact
    const data_cleared = fs.readFileSync(path.join(MAPS_PATH, 'empty.yaml')).toString()
    const data_filled = fs.readFileSync(path.join(MAPS_PATH, CrowdControlFlip ? 'filled-reverse.yaml' : 'filled.yaml')).toString()
    let cleared = Structure.fromString(data_cleared)
    let filled = Structure.fromString(data_filled)
    cleared = cleared.copy(0, 1, cleared.width - 1, cleared.height - 1)
    map.paste(0, 0, filled)
    map.paste(0, 1, cleared)

    return client.world?.paste(TOP_LEFT.x, TOP_LEFT.y, map, { animation: Animation.RANDOM, write_empty: true })
}

export async function flip_direction() {
    CrowdControlFlip = !CrowdControlFlip
    return Promise.all([...Array(6).keys()].map(i => i + 23)
        .map(x => client.block(TOP_LEFT.x + x, TOP_LEFT.y + map.height - 2, 1, CrowdControlFlip ? 'gravity_left' : 'gravity_right')))
}

export function module(client: Client) {
    client.on('cmd:queue', ([player, _, name]) => {
        if (!name)
            return player.pm('Queue: ' + (QUEUE.length > 0 ? QUEUE.map(p => p[1]).join(', ') : '---'))
        if (!is_bot_admin(player))
            return
        const result = find_map(name)
        if (!result)
            return player.pm('Couldn\'t find that map.')
        QUEUE.push(result)
        return player.pm('Added to Queue: ' + result[1])
    })

    client.onCommand('save', is_bot_admin, async ([player, _, x, y]) => {
        if (!client.world) return

        const PREFIX = 'map'
        const SUFFIX = '.yaml'

        const int = fs.readdirSync(MAPS_PATH)
            .filter(p => p.startsWith(PREFIX))
            .map(p => p.substring(PREFIX.length, p.length - SUFFIX.length))
            .map(p => parseInt(p, 10))
            .filter(Number.isSafeInteger)
            .reduce((p, c) => Math.max(p, c), 0) + 1

        const structure = client.world.copy(TOP_LEFT.x + 1, TOP_LEFT.y + 1, TOP_LEFT.x + map.width - 2, TOP_LEFT.y + map.height - 3)

        structure.meta = {
            creator: player.username,
            name: 'World Name',
            difficulty: 'easy'
        }

        const FILE_NAME = PREFIX + int.toString().padStart(2, '0') + SUFFIX
        writeFileSync(path.join(MAPS_PATH, FILE_NAME), structure.toString())
        return 'Saved as ' + FILE_NAME
    })

    client.onCommand('*save-frame', is_bot_admin, async ([player, _, x, y]) => {
        if (!client.world) return

        const PREFIX = 'frame'
        const SUFFIX = '.yaml'

        const int = fs.readdirSync(MAPS_PATH)
            .filter(p => p.startsWith(PREFIX))
            .map(p => p.substring(PREFIX.length, p.length - SUFFIX.length))
            .map(p => parseInt(p, 10))
            .filter(Number.isSafeInteger)
            .reduce((p, c) => Math.max(p, c), 0) + 1

        const structure = client.world.copy(TOP_LEFT.x, TOP_LEFT.y, TOP_LEFT.x + map.width - 1, TOP_LEFT.y + map.height - 1)

        writeFileSync(path.join(MAPS_PATH, PREFIX + int.toString().padStart(2, '0') + SUFFIX), structure.toString())
    })

    client.onCommand('*open', is_bot_admin, ([p, _, name]) => {
        return open_door()
    })

    client.onCommand('*create-platform', is_bot_admin, ([p, _, name]) => {
        return create_win_zone()
    })

    client.on('cmd:*close', ([p, _, name]) => {
        if (!is_bot_admin(p)) return
        return close_door()
    })

    client.on('cmd:*build', async ([p, _, name]) => {
        if (!is_bot_admin(p)) return
        const result = find_map(name)
        if (result) QUEUE.unshift(result)
        const meta = await build_map()
        client.say(`"${meta.name}" by ${meta.creator}`)
    })

    client.on('cmd:*build-frame', async ([p, _, name]) => {
        if (!is_bot_admin(p)) return
        const data = fs.readFileSync(path.join(MAPS_PATH, CrowdControlFlip ? 'filled-reverse.yaml' : 'filled.yaml')).toString()
        const structure = Structure.fromString(data)
        map.paste(0, 0, structure)
        await client.world?.paste(TOP_LEFT.x, TOP_LEFT.y, map, { animation: Animation.RANDOM, write_empty: true })
    })

    client.on('cmd:*flip', ([p, _, name]) => {
        if (!is_bot_admin(p)) return
        return flip_direction()
    })

    client.on('cmd:*clear', ([p, _, name]) => {
        if (!is_bot_admin(p)) return
        return clear_map()
    })

    return client
}
