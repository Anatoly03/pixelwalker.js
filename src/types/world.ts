
import stream from "stream"
import YAML from 'yaml'
import Block, { WorldPosition } from "./block.js"
import { HeaderTypes, SpecialBlockData } from "../data/consts.js"
import { BlockMappings, BlockMappingsReverse } from '../data/mappings.js'
import { get2dArray, read7BitInt } from "../math.js"
import Structure from "./structure.js"
import Client from "../index.js"

/**
 * A World is an offline-saved chunk of two dimensional
 * block-data. Worlds can be used to manipulate map fragments
 * like a pixel raster.
 */
export default class World extends Structure {
    private client: Client

    public title: string
    public owner: string
    public plays: number

    constructor(args: { width: number, height: number, client: Client, title: string, owner: string, plays: number }) {
        super(args.width, args.height)
        this.client = args.client
        this.title = args.title
        this.owner = args.owner
        this.plays = args.plays
    }

    public static fromString(data: string): Structure {
        const structure = Structure.fromString(data)
        // TODO add world stuff
        return structure
    }
}
