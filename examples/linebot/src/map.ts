import Client, { Animation, Block, Structure, BlockProperties, Property } from '../../../dist/index.js'
import { BlockIdentifier } from '../../../dist/types/index.js'
import { client, is_bot_admin } from './line.js'
import fs, { writeFileSync } from 'node:fs'
import path from 'node:path'

export const WIDTH = 200
export const HEIGHT = 50

type LineMeta = { left_y: number, right_y: number, frequency: number }
const snapshots: { [keys: string]: Structure<LineMeta> } = {}
const empty_map = new Structure(WIDTH, HEIGHT)
const map = new Structure(WIDTH, HEIGHT)

export const TOP_LEFT = { x: parseInt(process.env.TLX || '0'), y: parseInt(process.env.TLY || '0') }
export const HORIZONTAL_BORDER = 30
export const VERTICAL_BORDER = 13
export const ABSOLUTE_VERTICAL_BORDER = 7

let FRAME = new Block('beveled_magenta')
let DISPLAY_TILE: string | undefined

export const JOINT = { x: 0, y: 0 }
export const LEFT_JOINT = { x: 0, y: 0 }
export const QUEUE: [string, Structure<LineMeta>][] = []
const TILES_PATH = process.env.MAPS_PATH || 'maps'
let CURRENT_TILE: Structure<LineMeta> | undefined
let PIECE_X: number | undefined

export let PLATFORM_SIZE = 40
export let SIZE = 0
export let SPEED = 300

function create_snapshot(): number {
    const files = fs.readdirSync(TILES_PATH)

    for (const file of files) {
        const value = fs.readFileSync(path.join(TILES_PATH, file)).toString()
        const structure = Structure.fromString(value) as Structure<LineMeta>
        snapshots[file] = structure
    }

    return files.length
}

create_snapshot()

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
            map.foreground[x][map.height - 2] = new Block('hazard_spikes_down')
            empty_map.foreground[x][map.height - 2] = new Block('hazard_spikes_down')
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

function get_random_weight_piece() {
    const pieces = Object.keys(snapshots)
        .map<[string, number]>(k => [k, snapshots[k].meta.frequency])
        .sort(([_, a], [__, b]) => b - a)
    const total = pieces.reduce((c, [_, w]) => c + w, 0)
    let random = Math.random() * total
    let index = 0
    const piece = pieces.find(([_, w], i) => ++index && ((random -= w) < 0)) as [string, number]
    return [piece, index] as [[string, number], number]
}

export function plan_to_queue() {
    const calculated_y_joint = QUEUE.map(([_, piece]) => piece.meta.right_y - piece.meta.left_y).reduce((p, c) => p += c, JOINT.y)

    const maps = Object
        .keys(snapshots)
        .sort((a, b) => snapshots[b].meta.frequency - snapshots[a].meta.frequency)

    // let random = Math.floor(Math.random() * maps.length)
    // let piece: Structure | undefined
    let [[piece_name, weight], random] = get_random_weight_piece()
    let piece = snapshots[piece_name]

    for (let i = 0; i <= maps.length; i++) {
        random = (random + 1) % maps.length // Advance through maps till a proper one is found.

        const random_piece = maps[random]
        // const value = fs.readFileSync(path.join(TILES_PATH, random_piece)).toString()
        // piece = Structure.fromString(value)
        piece = snapshots[random_piece]
        const piece_direction = piece.meta.right_y - piece.meta.left_y

        // process.stdout.write("Try: ")

        // Absolute no go
        if (calculated_y_joint - piece.meta.left_y + piece.height >= map.height - ABSOLUTE_VERTICAL_BORDER) continue
        if (calculated_y_joint - piece.meta.left_y <= 1 + ABSOLUTE_VERTICAL_BORDER) continue

        // Unwanted
        if (i < 20 && calculated_y_joint - piece.meta.left_y + piece.height > map.height - VERTICAL_BORDER && piece_direction >= 0) continue
        if (i < 20 && calculated_y_joint - piece.meta.left_y < VERTICAL_BORDER && piece_direction <= 0) continue

        // console.log(`I chose piece with weight ${piece.meta.frequency}`)

        return QUEUE.push([random_piece, piece])
    }

    if (!piece) throw new Error('Maps did not exists when planning to queue.')

    console.warn(`Problems finding proper piece: JOINT Y = ${JOINT.y}, MAP HEIGHT = ${map.height}, CALCULATED DELTA JOINT Y = ${calculated_y_joint}, PIECE LEFT = ${piece.meta.left_y}, PIECE HEIGHT = ${piece.height}, QUEUE LENGTH = ${QUEUE.length}`)
    console.error(`After ${maps.length} iterations could not find proper piece: Y_JOINT = ${calculated_y_joint}`)

    client.say(`I am stuck... Please notify bot admin, that no of ${maps.length} pieces can be placed.`)
    client.say(`At JointY=${JOINT.y}`)
    
    client.disconnect()
    
    throw new Error("Out of block space")
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
        line: Structure<LineMeta>,
        promises: Promise<any>[] = []

    if (PIECE_X == undefined) {
        PIECE_X = 0
    }

    line = piece.copy(PIECE_X, 0, PIECE_X, piece.height - 1).setMeta(CURRENT_TILE.meta)

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

    // console.log(SIZE, LEFT_JOINT.x, JOINT.x)

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
        SIZE--
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
    client.onCommand('reload', is_bot_admin, ([player]) => {
        return `Updated ${create_snapshot()} tiles.`
    })

    client.onCommand('*empty', is_bot_admin, ([player]) => {
        return create_empty_arena()
    })

    client.onCommand('*build', is_bot_admin, ([player]) => {
        return create_empty_arena(30)
    })

    client.onCommand('queue', is_bot_admin, ([player, _, name]) => {
        if (!name)
            return
        if (!Object.keys(snapshots).includes(name))
            create_snapshot()
        if (!fs.existsSync(path.join(TILES_PATH, name)))
            return

        // const value = fs.readFileSync(path.join(TILES_PATH, name)).toString()
        // const piece = Structure.fromString(value)
        const piece = snapshots[name]
        QUEUE.push([name, piece])

        return player.pm('[BOT] Queue Length: ' + QUEUE.length)
    })

    client.onCommand('frame', is_bot_admin, ([p, _, k]) => {
        if (BlockProperties[k] == Property.Solid || k == 'boost_up')
            FRAME = new Block(k as BlockIdentifier)
    })

    // client.on('cmd:*build', ([player]) => {
    //     return build_platform(30)
    // })

    client.onCommand('*piece', is_bot_admin, async ([player, _, z]) => {
        if (!z) z = '1'
        let amount: number = parseInt(z)
        if (Number.isInteger(amount)) {
            for (let i = amount; i > 0; i--) {
                plan_to_queue()
                await advance_one_piece()
            }
        }
    })

    client.onCommand('*display', is_bot_admin, async ([player, _, name]) => {
        const tile_names = fs.readdirSync(TILES_PATH).map(k => k.substring(0, k.length - 5))

        if (!name) {
            name = 'basic_down'
        }

        if (DISPLAY_TILE && name == 'next') {
            const new_index = (tile_names.findIndex(k => k == DISPLAY_TILE) + 1) % tile_names.length
            name = tile_names[new_index]
        }

        if (!tile_names.includes(name)) {
            return 'Could not find. Did you mean any of ' + tile_names.filter(k => k.includes(name)).join(' ')
        }

        if (name == 'all') {
            return fs.readdirSync(TILES_PATH).map(k => k.substring(0, k.length - 5)).join(' ')
        }

        DISPLAY_TILE = name
        name = name + '.yaml'

        // Do not use snapshot here

        if (!fs.existsSync(path.join(TILES_PATH, name))) {
            DISPLAY_TILE = undefined
            return 'Not Found'
        }

        const value = fs.readFileSync(path.join(TILES_PATH, name)).toString()
        const piece = Structure.fromString(value)
        const border_piece = new Structure(piece.width + 2, piece.height + 2)

        piece.replace_all(new Block('basic_gray'), FRAME)
        border_piece.clear(true)

        const offsetx = TOP_LEFT.x + Math.floor((map.width - border_piece.width) / 2)
        const offsety = TOP_LEFT.y + Math.floor((map.height - border_piece.height) / 2)

        border_piece.paste(1, 1, piece)

        await create_empty_arena()
        await client.fill(offsetx, offsety, border_piece)

        client.say('Tile: ' + DISPLAY_TILE)
    })

    client.onCommand('*tile', is_bot_admin, async ([player, _, key, value]) => {
        if (!DISPLAY_TILE)
            return 'Not displaying any tile.'

        if (!key || !value) {
            return client.say(JSON.stringify(snapshots[DISPLAY_TILE + '.yaml'].meta))
        }

        let v: string | number | boolean = value

        if (value == 'true') v = true
        else if (value == 'false') v = false
        else if (!Number.isNaN(parseInt(value))) v = parseInt(value)
        else v = value

        snapshots[DISPLAY_TILE + '.yaml'].meta[key] = v

        fs.writeFileSync(path.join(TILES_PATH, DISPLAY_TILE + '.yaml'), snapshots[DISPLAY_TILE + '.yaml'].toString())

        return 'Saved'
    })

    client.onCommand('save', is_bot_admin, async ([player, _, x1, y1, x2, y2]) => {
        // function listen(): Promise<[number, number]> {
        //     return new Promise((res, rej) => {
        //         const timeout = setTimeout(rej, 3600)

        //         client.on('player:block', ([pl, [x, y, _], block]) => {
        //             if (block.name !== 'checkpoint') return
        //             if (pl.id !== player.id) return
        //             clearTimeout(timeout)
        //             res([x, y])
        //         })
        //     })
        // }

        const world = await client.world()

        const struct = world.copy(parseInt(x1), parseInt(y1), parseInt(x2), parseInt(y2))

        struct.meta = {
            left_y: 0,
            right_y: 0,
            frequency: 100
        }

        fs.writeFileSync(TILES_PATH + '/save.yaml', struct.toString())

        // let C1: [number, number],
        //     C2: [number, number]
        
        // try {
        //     C1 = await listen()
        //     C2 = await listen()

        //     player.pm('Press Space to confirm')
        // } catch {
        //     return 'Timed out!'
        // }

        // console.log(C1, C2)
        return 'Saved'
    })

    client.onCommand('*gallery', is_bot_admin, async () => {
        const world = await client.world()

        const tiles = Object
            .values(snapshots)
            .map(piece => {
                const border_piece = new Structure<LineMeta>(piece.width + 2, piece.height + 2)

                piece.replace_all(new Block('basic_gray'), FRAME)
                border_piece.clear(false)
                border_piece.paste(1, 1, piece)

                return border_piece
            })
            .sort((a, b) => a.height - b.height)

        let joint: number[] = []
        let built: number[] = []

        for (let i = 0; i < world.width; i++) {
            joint.push(0)
            built.push(0)
        }

        for (const tile of tiles) {
            let rejoins = joint.map(() => 0)
            let iters = 0
            // let rejoins = joint.map((v, i) => built.reduce((a, b) => Math.min(a, b), client.world?.height || 200))
            // let rejoins = joint.map((v, i) => v - tile.height)
            let first = 0
            let escape = true

            while (escape) {
                first = 0

                for (let i = 0; i < rejoins.length; i++) {
                    // if (iters > 2) console.log(i, first, rejoins[i], built[i])
                    if (rejoins[i] < built[i])
                        first = i + 1
                    else if (i - first >= tile.width) {
                        escape = false
                        break
                    }
                }

                rejoins = rejoins.map(v => v + 1)

                // console.log(rejoins)

                if (iters++ > 400) {
                    // console.log(built)
                    throw new Error('The algorithm hath malfunctioned...')
                }
            }

            client.fill(first, rejoins[first], tile)
            
            built = built.map((v, i) => (i >= first && i < first + tile.width) ? (v + tile.height) : v)
            
            // console.log(first, rejoins[first])

            // joint = rejoins

            // console.log(joint, built)

            // joint = joint.map(v => (v >= first && v < first + tile.width) ? (v + tile.height) : v)
            // joint = rejoins.map(v => (v >= first && v < first + tile.width) ? (v + tile.height) : v)
        }
    })
    
    // client.on('cmd:*procedure', async ([player]) => {
    //     await create_empty_arena()
    //     await build_platform(30)
    // })

    return client
}
