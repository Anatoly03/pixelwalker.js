
import Client, { Animation, Block, Structure } from '../../../dist/index.js'
import client from './line.js'
import fs, { writeFileSync } from 'node:fs'
import path from 'node:path'

export const width = 50
export const height = 37

const empty_map = new Structure(200, 50)
const map = new Structure(200, 50)

const TOP_LEFT = { x: parseInt(process.env.TLX || '0'), y: parseInt(process.env.TLY || '0') }
const HORIZONTAL_BORDER = 30
const VERTICAL_BORDER = 10

let FRAME = new Block('beveled_magenta')

const QUEUE: [string, Structure][] = []
const TILES_PATH = process.env.MAPS_PATH || 'maps'
const JOINT = { x: 0, y: 0 }
const LEFT_JOINT = { x: 0, y: 0 }

export let PLATFORM_SIZE = 40
export let SIZE = 0
export let SPEED = 200

export function create_empty_arena() {
    map.clear(true)
    empty_map.clear(true)

    const PORTAL_MATRIX = () => [...Array(6).keys()]
        .map((x, i) => [...Array(map.height - 3).keys()].map(i => i + 1))

    const SPIKES = [...Array(map.width - 2).keys()]
        .map(i => i + 1)
        .map(x => {
            map.foreground[x][map.height - 2] = new Block('spikes')
            empty_map.foreground[x][map.height - 2] = new Block('spikes')
        })

    const LEFT = PORTAL_MATRIX().forEach((a, x) => a.forEach(y => {
        const portal_left = new Block('portal_invisible')
        portal_left.data = [2, 1000 - (x) * (map.height - 1) - y, 200]
        map.foreground[x + HORIZONTAL_BORDER - 2][y] = portal_left
        empty_map.foreground[x + HORIZONTAL_BORDER - 2][y] = portal_left
    }))

    const RIGHT = PORTAL_MATRIX().forEach((a, x) => a.forEach(y => {
        const portal_right = new Block('portal_invisible')
        portal_right.data = [2, 201, 1000 - (x) * (map.height - 1) - y]
        map.foreground[x + map.width - HORIZONTAL_BORDER - 2][y] = portal_right
        empty_map.foreground[x + map.width - HORIZONTAL_BORDER - 2][y] = portal_right
    }))

    return client.fill(TOP_LEFT.x, TOP_LEFT.y, map)
}

export function build_platform(LENGTH: number) {
    const y = Math.floor(map.height / 2)

    const POSITIONS = [...Array(LENGTH).keys()]
        .map(x => x + Math.floor((map.width - LENGTH) / 2))

    JOINT.x = POSITIONS[POSITIONS.length - 1]
    JOINT.y = y
    LEFT_JOINT.x = POSITIONS[0]
    SIZE = LENGTH
    PLATFORM_SIZE = LENGTH

    return Promise.all(POSITIONS.map(async (x) => {await client.block(TOP_LEFT.x + x, TOP_LEFT.y + y, 1, FRAME); return [TOP_LEFT.x + x, TOP_LEFT.y + y - 1]}))
}

export function reset_queue() {
    while (QUEUE.length > 0) QUEUE.shift()
}

export function plan_to_queue() {
    const calculated_y_joint = QUEUE.map(([_, piece]) => piece.meta.right_y - piece.meta.left_y).reduce((p, c) => p += c, JOINT.y)

    for (let i = 0; i < 1000; i++) {
        const maps = fs.readdirSync(TILES_PATH)
        const random_piece = maps[Math.floor(Math.random() * maps.length)]
        const value = fs.readFileSync(`${TILES_PATH}/${random_piece}`).toString()
        let piece = Structure.fromString(value)
        if (calculated_y_joint - piece.meta.left_y + piece.height > map.height - VERTICAL_BORDER) continue
        if (calculated_y_joint - piece.meta.left_y < VERTICAL_BORDER) continue
        QUEUE.push([random_piece, piece])
        return
    }

    console.error(`After 1.000 iterations could not find proper piece: Y_JOINT = ${calculated_y_joint}`)
}

export async function advance_one_piece() {
    const [_, piece] = QUEUE.shift() || [undefined, undefined]
    if (!piece) return console.error('`advance_one_piece` was called on empty queue')

    for (let x = 0; x < piece.width; x++) {
        const line = piece.copy(x, 0, x, piece.height - 1)
        line.replace_all(new Block('basic_gray'), FRAME)

        if (JOINT.x + x < TOP_LEFT.x + map.width - 1)
            await client.fill(JOINT.x + x, TOP_LEFT.y + JOINT.y - piece.meta.left_y, line, { write_empty: false })

        if (JOINT.x + x > TOP_LEFT.x + map.width - HORIZONTAL_BORDER * 2) {
            await client.fill(JOINT.x + x + TOP_LEFT.x - map.width + HORIZONTAL_BORDER * 2, TOP_LEFT.y + JOINT.y - piece.meta.left_y, line, { write_empty: false })
        }

        SIZE += 1

        // TODO set to while

        if (SIZE > PLATFORM_SIZE) {
            let replace = empty_map.copy(LEFT_JOINT.x, 0, LEFT_JOINT.x, empty_map.height)

            if (LEFT_JOINT.x < TOP_LEFT.x + map.width - 1)
                client.fill(LEFT_JOINT.x, TOP_LEFT.y, replace)

            if (LEFT_JOINT.x > TOP_LEFT.x + map.width - HORIZONTAL_BORDER * 2) {
                const offset_x = LEFT_JOINT.x - map.width + HORIZONTAL_BORDER * 2
                replace = empty_map.copy(offset_x, 0, offset_x, empty_map.height)
                client.fill(offset_x, TOP_LEFT.y, replace)
            }

            // else if (left_x < corner.x + offset * 2) {
            //     const offset_x = left_x - corner.x + map.width - offset
            //     replace = create_line(offset_x)
            //     if (offset_x < corner.x + map.width - 1)
            //         client.fill(offset_x - 1, corner.y + 1, replace)
            // }

            LEFT_JOINT.x++
            SIZE --
        }

        await client.wait(SPEED)
    }

    JOINT.x += piece.width

    if (JOINT.x > TOP_LEFT.x + map.width) {
        JOINT.x -= map.width - 2 * HORIZONTAL_BORDER
        // joint.y ++
        // joint.x = corner.x + offset + platform_size
    }

    if (LEFT_JOINT.x > TOP_LEFT.x + map.width - 2) {
        LEFT_JOINT.x = TOP_LEFT.x + HORIZONTAL_BORDER * 2
    }

    JOINT.y += - piece.meta.left_y + piece.meta.right_y

    // if (speed > 100) speed -= 2
    // if (speed > 50) speed -= 2
}

export function module(client: Client) {
    client.on('cmd:*empty', ([player]) => {
        return create_empty_arena()
    })

    client.on('cmd:*build', ([player]) => {
        return build_platform(30)
    })

    client.on('cmd:*piece', async ([player, _, z]) => {
        if (!z) z = '1'
        let amount: number = parseInt(z)
        if (Number.isInteger(amount)) {
            for (let i = amount; i > 0; i--) {
                plan_to_queue()
                await advance_one_piece()
            }
        }
    })

    client.on('cmd:*procedure', async ([player]) => {
        await create_empty_arena()
        await build_platform(30)
    })

    return client
}
