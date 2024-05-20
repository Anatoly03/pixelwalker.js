
import Client, { Animation, Block, Structure } from '../../../dist/index.js'
import client from './line.js'
import fs, { writeFileSync } from 'node:fs'
import path from 'node:path'

export const width = 50
export const height = 37
const map = new Structure(200, 50)

const TOP_LEFT = { x: parseInt(process.env.TLX || '0'), y: parseInt(process.env.TLY || '0') }
const HORIZONTAL_BORDER = 30
const VERTICAL_BORDER = 10

const QUEUE: [string, string][] = []
const MAPS_PATH = process.env.MAPS_PATH || 'maps'

let CrowdControlFlip = false // Crowd Control Flip

function create_empty_arena() {
    map.clear(true)

    const PORTAL_MATRIX = () => [...Array(6).keys()]
        .map((x, i) => [...Array(map.height - 3).keys()].map(i => i + 1))

    const SPIKES = [...Array(map.width - 2).keys()]
        .map(i => i + 1)
        .map(x => map.foreground[x][map.height - 2] = new Block('spikes'))

    const LEFT = PORTAL_MATRIX().forEach((a, x) => a.forEach(y => {
        const portal_left = new Block('portal_invisible')
        portal_left.data = [2, 1000 - (x) * (map.height - 1) - y, 200]
        map.foreground[x + HORIZONTAL_BORDER - 2][y] = portal_left
    }))

    const RIGHT = PORTAL_MATRIX().forEach((a, x) => a.forEach(y => {
        const portal_right = new Block('portal_invisible')
        portal_right.data = [2, 201, 1000 - (x) * (map.height - 1) - y]
        map.foreground[x + map.width - HORIZONTAL_BORDER - 2][y] = portal_right
    }))

    return client.fill(TOP_LEFT.x, TOP_LEFT.y, map)
}

export function module(client: Client) {
    client.on('cmd:*empty-arena', ([player]) => {
        return create_empty_arena()
    })

    return client
}
