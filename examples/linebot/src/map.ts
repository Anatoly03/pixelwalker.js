import Client, { Animation, Block, Structure, BlockProperties, Property } from '../../../dist/index.js'
import { BlockIdentifier } from '../../../dist/types/block.js'
import { is_bot_admin } from './admin.js'
import client from './line.js'
import fs, { writeFileSync } from 'node:fs'
import path from 'node:path'

export const WIDTH = 200
export const HEIGHT = 50

const empty_map = new Structure(WIDTH, HEIGHT)
const map = new Structure(WIDTH, HEIGHT)

export const TOP_LEFT = { x: parseInt(process.env.TLX || '0'), y: parseInt(process.env.TLY || '0') }
export const HORIZONTAL_BORDER = 30
export const VERTICAL_BORDER = 13
export const ABSOLUTE_VERTICAL_BORDER = 7

let FRAME = new Block('beveled_magenta')

export const JOINT = { x: 0, y: 0 }
export const LEFT_JOINT = { x: 0, y: 0 }
const QUEUE: [string, Structure][] = []
const TILES_PATH = process.env.MAPS_PATH || 'maps'
let CURRENT_TILE: Structure | undefined
let PIECE_X: number | undefined

export let PLATFORM_SIZE = 40
export let SIZE = 0
export let SPEED = 300

export function create_empty_arena(): Promise<any>;
export function create_empty_arena(platform_length: number): Promise<number[][]>
export async function create_empty_arena(PLATFORM_LENGTH?: number) {
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

    if (PLATFORM_LENGTH == undefined)
        return client.fill(TOP_LEFT.x, TOP_LEFT.y, map)

    const y = Math.floor(map.height / 2)

    const POSITIONS = [...Array(PLATFORM_LENGTH).keys()]
        .map(x => x + Math.floor((map.width - PLATFORM_LENGTH) / 2))

    JOINT.x = POSITIONS[POSITIONS.length - 1]
    JOINT.y = y
    LEFT_JOINT.x = POSITIONS[0]
    SIZE = PLATFORM_LENGTH
    PLATFORM_SIZE = PLATFORM_LENGTH

    POSITIONS.forEach(x => map.foreground[x][y] = FRAME)

    await client.fill(TOP_LEFT.x, TOP_LEFT.y, map)

    return POSITIONS.map(x => [TOP_LEFT.x + x, TOP_LEFT.y + y - 1])
}

// export function build_platform(LENGTH: number) {
//     const y = Math.floor(map.height / 2)

//     const POSITIONS = [...Array(LENGTH).keys()]
//         .map(x => x + Math.floor((map.width - LENGTH) / 2))

//     JOINT.x = POSITIONS[POSITIONS.length - 1]
//     JOINT.y = y
//     LEFT_JOINT.x = POSITIONS[0]
//     SIZE = LENGTH
//     PLATFORM_SIZE = LENGTH

//     return Promise.all(POSITIONS.map(async (x) => {await client.block(TOP_LEFT.x + x, TOP_LEFT.y + y, 1, FRAME); return [TOP_LEFT.x + x, TOP_LEFT.y + y - 1]}))
// }

export function reset_everything() {
    QUEUE.splice(0, QUEUE.length) // Reset queue
    CURRENT_TILE = undefined
    PIECE_X = undefined
}

export function plan_to_queue() {
    const calculated_y_joint = QUEUE.map(([_, piece]) => piece.meta.right_y - piece.meta.left_y).reduce((p, c) => p += c, JOINT.y)
    const maps = fs.readdirSync(TILES_PATH)
    let random = Math.floor(Math.random() * maps.length)
    let piece

    for (let i = 0; i <= maps.length; i++) {
        random = (random + 1) % maps.length // Advance through maps till a proper one is found.

        const random_piece = maps[random]
        const value = fs.readFileSync(path.join(TILES_PATH, random_piece)).toString()
        piece = Structure.fromString(value)
        const piece_direction = piece.meta.right_y - piece.meta.left_y

        // Absolute no go
        if (calculated_y_joint - piece.meta.left_y + piece.height >= map.height - ABSOLUTE_VERTICAL_BORDER) continue
        if (calculated_y_joint - piece.meta.left_y <= 1 + ABSOLUTE_VERTICAL_BORDER) continue

        // Unwanted
        if (i < 20 && calculated_y_joint - piece.meta.left_y + piece.height > map.height - VERTICAL_BORDER && piece_direction >= 0) continue
        if (i < 20 && calculated_y_joint - piece.meta.left_y < VERTICAL_BORDER && piece_direction <= 0) continue

        return QUEUE.push([random_piece, piece])
    }

    console.warn(`Problems finding proper piece: JOINT Y = ${JOINT.y}, MAP HEIGHT = ${map.height}, CALCULATED DELTA JOINT Y = ${calculated_y_joint}, PIECE LEFT = ${piece.meta.left_y}, PIECE HEIGHT = ${piece.height}, QUEUE LENGTH = ${QUEUE.length}`)
    console.error(`After ${maps.length} iterations could not find proper piece: Y_JOINT = ${calculated_y_joint}`)
    return -1
}

/** Advance one "line" of a piece */
export async function advance_one_piece(): Promise<boolean> { 
    if (!CURRENT_TILE) {
        let _: any;
        [_, CURRENT_TILE] = QUEUE.shift() || [undefined, undefined]
        if (CURRENT_TILE == undefined)
            console.error('`advance_one_piece` was called on empty queue')
            return true
    }

    let piece = CURRENT_TILE,
        line: Structure,
        promises: Promise<any>[] = []

    if (PIECE_X == undefined) {
        PIECE_X = 0
    }

    line = piece.copy(PIECE_X, 0, PIECE_X, piece.height - 1)

    // for (let x = 0; x < piece.width; x++) {
    // const line = piece.copy(x, 0, x, piece.height - 1)
    line.replace_all(new Block('basic_gray'), FRAME)

    if (JOINT.x + PIECE_X < TOP_LEFT.x + map.width - 1)
        promises.push(client.fill(JOINT.x + PIECE_X, TOP_LEFT.y + JOINT.y - piece.meta.left_y, line, { write_empty: false }) || Promise.reject('`client.fill` returned undefined'))

    if (JOINT.x + PIECE_X > TOP_LEFT.x + map.width - HORIZONTAL_BORDER * 2) {
        promises.push(client.fill(JOINT.x + PIECE_X + TOP_LEFT.x - map.width + HORIZONTAL_BORDER * 2, TOP_LEFT.y + JOINT.y - piece.meta.left_y, line, { write_empty: false }) || Promise.reject('`client.fill` returned undefined'))
    }

    PIECE_X += 1
    SIZE += 1

    while (SIZE > PLATFORM_SIZE) {
        let replace = empty_map.copy(LEFT_JOINT.x, 0, LEFT_JOINT.x, empty_map.height)

        if (LEFT_JOINT.x < TOP_LEFT.x + map.width - 1)
            promises.push(client.fill(LEFT_JOINT.x, TOP_LEFT.y, replace) || Promise.reject('`client.fill` returned undefined'))

        if (LEFT_JOINT.x > TOP_LEFT.x + map.width - HORIZONTAL_BORDER * 2) {
            const offset_x = LEFT_JOINT.x - map.width + HORIZONTAL_BORDER * 2
            replace = empty_map.copy(offset_x, 0, offset_x, empty_map.height)
            promises.push(client.fill(offset_x, TOP_LEFT.y, replace) || Promise.reject('`client.fill` returned undefined'))
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
    await Promise.all(promises)
    // }

    if (PIECE_X >= piece.width) {
        PIECE_X = undefined
        CURRENT_TILE = undefined

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

        return true
    }

    // if (speed > 100) speed -= 2
    // if (speed > 50) speed -= 2

    return false
}

export function set_speed(x: number) {
    return SPEED = x
}

export function set_max_size(x: number) {
    return PLATFORM_SIZE = x
}

export function module(client: Client) {
    client.on('cmd:*empty', ([player]) => {
        return create_empty_arena()
    })

    client.on('cmd:*build', ([player]) => {
        return create_empty_arena(30)
    })

    client.on('cmd:queue', ([player, _, name]) => {
        if (!name)
            return //
        if (!is_bot_admin(player))
            return
        if (!fs.existsSync(path.join(TILES_PATH, name)))
            return

        const value = fs.readFileSync(path.join(TILES_PATH, name)).toString()
        const piece = Structure.fromString(value)
        QUEUE.push([name, piece])

        return player.pm('[BOT] Added to Queue.')
    })

    client.on('cmd:frame', ([p, _, k]) => {
        if (!is_bot_admin(p))
            return
        if (BlockProperties[k] == Property.Solid || k == 'boost_up')
            FRAME = new Block(k as BlockIdentifier)
    })
    
    // client.on('cmd:*build', ([player]) => {
    //     return build_platform(30)
    // })

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

    // client.on('cmd:*procedure', async ([player]) => {
    //     await create_empty_arena()
    //     await build_platform(30)
    // })

    return client
}
