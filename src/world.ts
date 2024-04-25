
import stream from "stream"
import Block from "./block.js"
import { HeaderTypes, SpecialBlockData } from "./consts.js"
import { BlockMappings, BlockMappingsReverse } from './mappings.js'
import { get2dArray } from "./math.js"

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

    constructor(width: number, height: number) {
        this.width = width
        this.height = height
        this.foreground = get2dArray(width, height)
        this.background = get2dArray(width, height)
    }

    clear(border: boolean) {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                const atBorder = border && (x == 0 || y == 0 || x == this.width - 1 || y == this.height - 1)

                this.foreground[x][y] = atBorder ? new Block(BlockMappings['basic_gray']) : new Block(0),
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
            switch(type) {
                case HeaderTypes.Int32:
                    block.data.push(buffer.readInt32LE(offset))
                    offset += 4
                    break
            }
        }

        return [block, offset]
    }

    place(x: number, y: number, l: 0 | 1, id: number, args: any) {
        const layer = l == 1 ? this.foreground : this.background
        const block = layer[x][y] = new Block(id)

        if (SpecialBlockData[block.name])
            block.data = args
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

    /**
     * Write world data into a stream
     */
    public writeStringTo(writer: stream.Writable, args?: {[keys: string]: any}) {
        const mapping = ['empty']

        for (const key in (args || {})) {
            writer.write(`${key.toLowerCase()} = `)
        }

        writer.write(`write-version: 0\n`)
        writer.write(`width: ${this.width}\n`)
        writer.write(`height: ${this.height}\n`)
        
        let FOREGROUND = '', BACKGROUND = ''

        for (let x = 0; x < this.width; x++)
            for (let y = 0; y < this.height; y++) {
                const block = this.foreground[x][y]

                if (!mapping.includes(block.name))
                    mapping.push(block.name)

                FOREGROUND += mapping.indexOf(block.name).toString(36).toLocaleUpperCase()
                if (block.data.length > 0)
                    FOREGROUND += block.data.toString()
                FOREGROUND += ' '
            }

        for (let x = 0; x < this.width; x++)
            for (let y = 0; y < this.height; y++) {
                const block = this.background[x][y]

                if (!mapping.includes(block.name))
                    mapping.push(block.name)

                BACKGROUND += mapping.indexOf(block.name).toString(36).toLocaleUpperCase()
                if (block.data.length > 0)
                    BACKGROUND += block.data.toString()
                BACKGROUND += ' '
            }

        writer.write(`mapping: ${mapping}\n`)
        writer.write('layers:\n')
        writer.write(' - foreground: ' + FOREGROUND + '\n')
        writer.write(' - background: ' + BACKGROUND + '\n')

        writer.end()
    }
}
