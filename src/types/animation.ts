import Block, { WorldPosition } from "./block"

// export type AnimatorLambda = (to_be_placed: [WorldPosition, Block][]) => Generator<[WorldPosition, Block] | undefined, boolean, unknown>

export function* FIFO (to_be_placed: [WorldPosition, Block][]) {
    while (to_be_placed.length > 0) {
        yield to_be_placed.shift()
    }
    return true
}

export function* RANDOM (to_be_placed: [WorldPosition, Block][]) {
    while (to_be_placed.length > 0) {
        const index = Math.floor(to_be_placed.length * Math.random())
        const block = to_be_placed[index]
        to_be_placed.splice(index, 1)
        yield block
    }
    return true
}
