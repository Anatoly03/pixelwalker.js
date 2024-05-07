
export { default, default as Client } from './client.js'
export { default as World } from './types/world.js'
export { default as Structure } from './types/structure.js'
export { default as Block, WorldPosition } from "./types/block.js"
export { default as Player } from './types/player.js'
export * as Animation from './types/animation.js'
export * as Type from './types.js'
export { MessageType } from './data/consts.js'
export { BlockMappings, BlockMappingsReverse } from './data/mappings.js'
export { SolidBlocks, Decorations } from './data/block_properties.js'
export { RoomTypes } from './data/room_types.js'

export const Modules = {
    Debug: (await import ('./modules/debug.js')).default
}
