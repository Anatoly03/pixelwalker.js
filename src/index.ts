
export { default, default as Client } from './client.js'
export { default as World } from './types/world.js'
export { default as Structure } from './types/structure.js'
export { default as Block, WorldPosition, BlockIdentifier } from "./types/block.js"
export { default as Player, PlayerBase, SelfPlayer } from './types/player.js'
export { PlayerArray, GamePlayerArray } from './types/player-ds.js'
export * as Animation from './types/animation.js'
export * as Type from './types.js'
export { MessageType } from './data/consts.js'
export { BlockMappings, BlockMappingsReverse } from './data/mappings.js'
export { SolidBlocks, Decorations, Property, BlockProperties } from './data/block_properties.js'
export { RoomTypes } from './data/room_types.js'
export { default as PlayerStorage } from './modules/player-storage.js'

export const Modules = {
    Debug: (await import ('./modules/debug.js')).default,
    PlayerKeyManager: (await import ('./modules/player-keys-manager.js')).default,
    BanModule: (await import('./modules/bans.js')).default,
    StorageModule: (await import('./modules/player-storage.js')).default
}

export const Util = {
    GameRound: (await import ('./util/game-round.js')).GameRound,
    Breakpoint: (await import ('./util/breakpoint.js')).Breakpoint
}