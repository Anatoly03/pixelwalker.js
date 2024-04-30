
import stream from "stream"
import YAML from 'yaml'
import Block, { WorldPosition } from "./block.js"
import { HeaderTypes, SpecialBlockData } from "../data/consts.js"
import { BlockMappings, BlockMappingsReverse } from '../data/mappings.js'
import { get2dArray, read7BitInt } from "../math.js"

/**
 * A World is an offline-saved chunk of two dimensional
 * block-data. Worlds can be used to manipulate map fragments
 * like a pixel raster.
 */
export default class World {
    public width: number
    public height: number
    public foreground: Block[][]
    public background: Block[][]
    public meta: { [keys: string]: any }

    constructor(width: number, height: number) {
        this.width = width
        this.height = height
        this.foreground = get2dArray(width, height)
        this.background = get2dArray(width, height)
        this.meta = {}
        this.clear(false)
    }

    clear(border: boolean) {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                const atBorder = border && (x == 0 || y == 0 || x == this.width - 1 || y == this.height - 1)

                this.foreground[x][y] = atBorder ? new Block(BlockMappings['basic_gray']) : new Block(0)
                this.background[x][y] = new Block(0)
            }
        }
    }

    /**
     * Initialise the world with values
     */
    init(buffer: Buffer) {
        let offset = 0
        offset = this.deserializeLayer(this.background, buffer, offset)
        offset = this.deserializeLayer(this.foreground, buffer, offset)

        if (buffer.length != offset) {
            console.warn(`Buffer Length for World Data and Offset do not match. (${buffer.length} != ${offset}). You may be loading a world with blocks that are not yet encoded in this API version.`)
        }
    }

    /**
     * Serialize a layer
     */
    deserializeLayer(layer: Block[][], buffer: Buffer, offset: number): number {
        for (let x = 0; x < this.width; x++)
            for (let y = 0; y < this.height; y++) {
                let [block, o] = this.deserializeBlock(buffer, offset)
                layer[x][y] = block
                offset = o
            }

        return offset
    }

    deserializeBlock(buffer: Buffer, offset: number): [Block, number] {
        const id = buffer.readInt32LE(offset)
        const block = new Block(id)

        offset += 4

        if (block.name == 'empty') {
            return [block, offset]
        }

        const arg_types: HeaderTypes[] = SpecialBlockData[block.name] || []

        for (const type of arg_types) {
            switch (type) {
                case HeaderTypes.String:
                    [length, offset] = read7BitInt(buffer, offset)
                    block.data.push(buffer.subarray(offset, offset + length).toString('ascii'))
                    offset += length
                    break
                case HeaderTypes.Byte: // = Byte
                    block.data.push(buffer.readUInt8(offset++))
                    break
                case HeaderTypes.Int16: // = Int16 (short)
                    block.data.push(buffer.readInt16BE(offset))
                    offset += 2
                    break
                case HeaderTypes.Int32:
                    block.data.push(buffer.readInt32LE(offset))
                    offset += 4
                    break

                case HeaderTypes.Int64:
                    block.data.push(buffer.readBigInt64BE(offset))
                    offset += 8
                    break
                case HeaderTypes.Float:
                    block.data.push(buffer.readFloatBE(offset))
                    offset += 4
                    break
                case HeaderTypes.Double:
                    block.data.push(buffer.readDoubleBE(offset))
                    offset += 8
                    break
                case HeaderTypes.Boolean:
                    block.data.push(!!buffer.readUInt8(offset++)) // !! is truthy
                    break
                case HeaderTypes.ByteArray:
                    [length, offset] = read7BitInt(buffer, offset)
                    block.data.push(buffer.subarray(offset, offset + length))
                    offset += length
                    break
            }
        }

        return [block, offset]
    }

    place(x: number, y: number, l: 0 | 1, id: number, args: any): [WorldPosition, Block] {
        const layer = l == 1 ? this.foreground : this.background
        const block = layer[x][y] = new Block(id)

        if (SpecialBlockData[block.name])
            block.data = args

        return [[x, y, l], block]
    }

    blockAt(x: number, y: number, l: 0 | 1) {
        const layer = l == 1 ? this.foreground : this.background
        return layer[x][y]
    }

    copy(x1: number, y1: number, x2: number, y2: number): World {
        if (x2 < x1) { let tmp = x2; x2 = x1; x1 = tmp }
        if (y2 < y1) { let tmp = y2; y2 = y1; y1 = tmp }

        const world = new World(x2 - x1 + 1, y2 - y1 + 1)

        for (let x = x1; x <= x2; x++)
            for (let y = y1; y <= y2; y++) {
                world.background[x - x1][y - y1] = this.background[x][y]
                world.foreground[x - x1][y - y1] = this.foreground[x][y]
            }

        return world
    }

    /**
     * Paste World chunk into this world
     */
    paste(xt: number, yt: number, data: World) {
        for (let x = 0; x < data.width; x++)
            for (let y = 0; y < data.height; y++) {
                this.foreground[x + xt][y + yt] = data.foreground[x][y]
                this.background[x + xt][y + yt] = data.background[x][y]
            }
    }

    public replace_all(block: Block, new_block: Block) {
        for (let x = 0; x < this.width; x++)
            for (let y = 0; y < this.height; y++) {
                if (this.foreground[x][y].name == block.name)
                    this.foreground[x][y] = new_block
                if (this.background[x][y].name == block.name)
                    this.background[x][y] = new_block
            }
    }

    //
    //
    // Parsers
    //
    //

    /**
     * Write world data into a stream
     */
    public toString(writer: stream.Writable): string {
        const data: any = {
            'file-version': 0,
            meta: this.meta,
            width: this.width,
            height: this.height,
            palette: ['empty'],
            layers: {
                foreground: '',
                background: '',
                data: [],
            }
        }

        for (let x = 0; x < this.width; x++)
            for (let y = 0; y < this.height; y++) {
                const block = this.foreground[x][y]

                if (!data.palette.includes(block.name))
                    data.palette.push(block.name)

                const shortcut = data.palette.indexOf(block.name).toString(36).toLocaleUpperCase()

                data.layers.foreground += shortcut + ' '

                if (block.data.length > 0)
                    data.layers.data.push(block.data)
            }

        for (let x = 0; x < this.width; x++)
            for (let y = 0; y < this.height; y++) {
                const block = this.background[x][y]

                if (!data.palette.includes(block.name))
                    data.palette.push(block.name)

                const shortcut = data.palette.indexOf(block.name).toString(36).toLocaleUpperCase()

                data.layers.background += shortcut + ' '

                if (block.data.length > 0)
                    data.layers.data.push(block.data)
            }

        return YAML.stringify(data)
    }

    public static fromString(data: string): World {
        const value = YAML.parse(data)
        const world = new World(value.width, value.height)

        world.meta = value.meta

        const palette: string[] = value.palette
        const foreground: number[] = value.layers.foreground.split(' ').map((v: string) => parseInt(v, 36))
        const background: number[] = value.layers.background.split(' ').map((v: string) => parseInt(v, 36))
        const block_data: any[][] = value.layers.data

        let idx = 0
        let data_idx = 0

        for (let x = 0; x < world.width; x++)
            for (let y = 0; y < world.height; y++) {
                world.foreground[x][y] = new Block(palette[foreground[idx++]])

                if (world.foreground[x][y].data_count > 0)
                    world.foreground[x][y].data = block_data[data_idx++]
            }

        idx = 0

        for (let x = 0; x < world.width; x++)
            for (let y = 0; y < world.height; y++) {
                world.background[x][y] = new Block(palette[background[idx++]])

                if (world.background[x][y].data_count > 0)
                    world.background[x][y].data = block_data[data_idx++]
            }

        return world
    }

    //
    //
    // World Information
    //
    //

    public total(block: string): number {
        let value = 0
        for (let x = 0; x < this.width; x++)
            for (let y = 0; y < this.height; y++)
                if (this.foreground[x][y].name == block)
                    value++
        return value
    }

    public list(block: string): WorldPosition[] {
        let value: WorldPosition[] = []
        for (let x = 0; x < this.width; x++)
            for (let y = 0; y < this.height; y++) {
                if (this.foreground[x][y].name == block)
                    value.push([x, y, 1])
                if (this.background[x][y].name == block)
                    value.push([x, y, 0])
            }
        return value
    }
}
