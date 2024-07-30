import Block from "./world/block/block.js"
import { WorldPosition } from "./index.js"

// export type AnimationType = (to_be_placed: [WorldPosition, Block][]) => Generator<[WorldPosition, Block] | undefined, boolean, unknown>

/**
 * First in first out (default order)
 */
export function* FIFO (to_be_placed: [WorldPosition, Block][]) {
    while (to_be_placed.length > 0) {
        yield to_be_placed.shift()
    }
    return true
}

/**
 * From left to right, top to bottom
 */
export function* L2RT2B (to_be_placed: [WorldPosition, Block][]) {
    to_be_placed = to_be_placed.sort((a, b) => (a[0].x - b[0].x) + 10000 * (a[0].y - b[0].y))
    while (to_be_placed.length > 0) {
        yield to_be_placed.shift()
    }
    return true
}

/**
 * Place blocks in random order
 */
export function* RANDOM (to_be_placed: [WorldPosition, Block][]) {
    while (to_be_placed.length > 0) {
        const index = Math.floor(to_be_placed.length * Math.random())
        const block = to_be_placed[index]
        to_be_placed.splice(index, 1)
        yield block
    }
    return true
}
