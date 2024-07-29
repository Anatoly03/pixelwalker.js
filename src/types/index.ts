import { BlockMappings, BlockMappingsReverse } from "../data/mappings"
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
 * The currently allowed values for a layer.
 */
export type LayerId = 0 | 1

/**
 * A data structure used to describe a block coordinate within
 * the map.
 */
export type WorldPosition = Point & { layer: LayerId }

/**
 * A common type with which you can uniquely refer to a
 * block by it's numeric identifier
 * 
 * @example
 * 
 * ```ts
 * let block_id: BlockId = 0
 * ```
 */
export type BlockId = 0 | keyof typeof BlockMappingsReverse

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
export type BlockName = 'empty' | keyof typeof BlockMappings

/**
 * A common type with which you can uniquely refer to a
 * block either by its' identifiers or JavaScript structures.
 * 
 * @example
 * 
 * ```ts
 * let block_identifier: BlockIdentifier = 'basic_blue'
 * let block = new Block(block_identifier)
 * ```
 */
export type BlockIdentifier = BlockName | BlockId | Block

/**
 * The minimal required information stored to properly
 * correlate a player entry to an identity, consists of
 * unique connect user id `cuid` and a human readable
 * reference `username`.
 * 
 * @abstract
 * @param {string} username Case-insensitive string
 * @param {string} cuid Connect User Id
 */
export type PlayerBase = {
    username: Uppercase<string>,
    cuid: string
}