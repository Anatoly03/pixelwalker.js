import { BlockMappings } from "../data/mappings"
import Block from "./world/block"

/**
 * A data structure used to describe a coordinate within two
 * dimensional space.
 * 
 * @example
 * 
 * ```ts
 * let position: Point = player.pos
 * ```
 */
export type Point = { x: number, y: number }

/**
 * A data structure used to describe a block coordinate within
 * the map.
 */
export type WorldPosition = Point & { layer: 0 | 1 }

/**
 * A common type with which you can uniquely refer to a
 * block.
 * 
 * @example
 * 
 * ```ts
 * let block_name: BlockIdentifier = 'basic_blue'
 * ```
 */
export type BlockIdentifier = keyof typeof BlockMappings | Block | number | null