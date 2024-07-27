import { WorldPosition } from './types/world/block.js'

export { default, default as Client } from './client.js'
export { default as World } from './types/world.js'
export { default as Structure } from './types/structure.js'
export { default as Block, WorldPosition, BlockIdentifier } from "./types/world/block.js"
export { default as Player } from './types/player/player.js'
export { SelfPlayer } from './types/player/self.js'
export { PlayerBase } from './types/player/base.js'
export { PlayerArray, GamePlayerArray } from './types/player-ds.js'
export * as BitType from './types/message-bytes.js'
export { BlockMappings, BlockMappingsReverse } from './data/mappings.js'
export { SolidBlocks, Decorations, Property, BlockProperties } from './data/block_properties.js'
export { RoomTypes } from './data/room_types.js'
export { default as PlayerStorage } from './modules/player-storage.js'

/**
 * @namespace
 * 
 * The Animation namespace is a collection of predefined common use map filling animations.
 * An Animation is a generator function, that yields over an array of block data the appropriate placement order.
 * 
 * @type {(blocks: [WorldPosition, Block][]) => Generator<[WorldPosition, Block] | undefined, boolean, unknown>}
 * 
 * @example Random Placement Animation
 * 
 * ```ts
 * function* RANDOM (to_be_placed: [WorldPosition, Block][]) {
 *     while (to_be_placed.length > 0) {
 *         const index = Math.floor(to_be_placed.length * Math.random())
 *         const block = to_be_placed[index]
 *         to_be_placed.splice(index, 1)
 *         yield block
 *     }
 *     return true
 * }
 * ```
 */
export * as Animation from './types/animation.js'

/**
 * @namespace
 */
export const Modules = {
    Debug: (await import ('./modules/debug.js')).default,
    PlayerKeyManager: (await import ('./modules/player-keys-manager.js')).default,
    BanModule: (await import('./modules/bans.js')).default,
    StorageModule: (await import('./modules/player-storage.js')).default
}

/**
 * @ignore
 */
export const Util = {
    GameRound: (await import ('./util/game-round.js')).GameRound,
    Breakpoint: (await import ('./util/breakpoint.js')).Breakpoint
}