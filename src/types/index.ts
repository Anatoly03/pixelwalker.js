
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
