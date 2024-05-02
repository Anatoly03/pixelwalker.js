
import stream from "stream"
import YAML from 'yaml'
import Block, { WorldPosition } from "./block.js"
import { HeaderTypes, SpecialBlockData } from "../data/consts.js"
import { BlockMappings, BlockMappingsReverse } from '../data/mappings.js'
import { get2dArray, read7BitInt } from "../math.js"
import Structure from "./structure.js"

/**
 * A World is an offline-saved chunk of two dimensional
 * block-data. Worlds can be used to manipulate map fragments
 * like a pixel raster.
 */
export default class World extends Structure {
    public static fromString(data: string): World {
        const structure = Structure.fromString(data)
        // TODO add world stuff
        return structure
    }
}
