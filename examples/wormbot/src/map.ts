
import Client, { Animation, Block, Structure } from '../../../dist/index.js'
import client from './worm.js'
import fs, { writeFileSync } from 'node:fs'
import path from 'node:path'

import { is_bot_admin } from './worm.js'

export const width = 47
export const height = 33

export const TOP_LEFT = { x: parseInt(process.env.TLX || '0'), y: parseInt(process.env.TLY || '0') }
const QUEUE: [string, string][] = []
const RECENT_MAPS: string[] = []
const MAPS_PATH = process.env.MAPS_PATH || 'maps'

const map = new Structure(width, height)

function get_map(): Structure {
    let maps = fs.readdirSync(MAPS_PATH),
        map_path: string

    if (QUEUE.length > 0)
        map_path = QUEUE.shift()?.[0] as string
    else {
        if (maps.length > 3) maps = maps.filter(p => !RECENT_MAPS.includes(p))
        map_path = maps[Math.floor(maps.length * Math.random())]
    }

    RECENT_MAPS.push(map_path)
    if (RECENT_MAPS.length >= maps.length / 2) RECENT_MAPS.shift()

    return Structure.fromString(
        fs.readFileSync(path.join(MAPS_PATH, map_path))
            .toString('ascii'))
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

export async function build_map() {
    const structure = get_map()
    map.paste(0, 0, structure)
    await client.world?.paste(TOP_LEFT.x, TOP_LEFT.y, map, { animation: Animation.RANDOM, write_empty: true })
    return structure.meta
}

export function module(client: Client) {
    client.onCommand('queue', ([player, _, name]) => {
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

        const structure = client.world.copy(TOP_LEFT.x, TOP_LEFT.y, TOP_LEFT.x + map.width - 1, TOP_LEFT.y + map.height - 1)

        structure.meta = {
            creator: player.username,
            name: 'World Name'
        }

        const FILE_NAME = PREFIX + int.toString().padStart(2, '0') + SUFFIX
        writeFileSync(path.join(MAPS_PATH, FILE_NAME), structure.toString())
        return 'Saved as ' + FILE_NAME
    })

    client.onCommand('*build', is_bot_admin, async ([p, _, name]) => {
        const result = find_map(name || '')
        if (result) QUEUE.unshift(result)
        const meta = await build_map()
        client.say(`"${meta.name}" by ${meta.creator}`)
    })

    return client
}
