import { Point } from ".."
import { HeaderTypes, SpecialBlockData } from "../../data/consts"
import { read7BitInt } from "../math"
import Block from "./block/block"

/**
 * A World is an offline-saved chunk of two dimensional
 * block-data. Worlds can be used to manipulate map fragments
 * like a pixel raster.
 */
export default class Layer {
    [x: number]: readonly Block[]
    #data: Block[][] = []

    /**
     * 
     */
    constructor(public readonly width: number, public readonly height: number) {
        this.clear()
        
        // Define getters for indexing the layer
        for (let x = 0; x < this.width; x++) {
            Object.defineProperty(this, x, { get: () => this.#data[x] })
        }
    }

    /**
     * Get block at specific coordinates.
     */
    public get(position: Point) {
        return this.#data[position.x][position.y]
    }

    /**
     * Set block at specific coordinates.
     */
    public set(position: Point, block: Block) {
        this.#data[position.x][position.y] = block
    }

    /**
     * Clear the layer.
     */
    public clear(): this {
        this.#data = []
        for (let x = 0; x < this.width; x++) {
            this.#data.push([])
            for (let y = 0; y < this.width; y++) {
                this.#data[x].push(Block.empty)
            }
        }
        return this
    }

    /**
     * Deserialize the layer from buffer
     */
    public deserializeFromBuffer(buffer: Buffer, offset: number): number {
        this.#data = []

        for (let x = 0; x < this.width; x++) {
            this.#data.push([])
            for (let y = 0; y < this.height; y++) {
                let [block, o] = Layer.deserializeBlock(buffer, offset)
                this.#data[x].push(block)
                offset = o
            }
        }

        return offset
    }

    public static deserializeBlock(buffer: Buffer, offset: number): [Block, number] {
        const id = buffer.readInt32LE(offset)
        const block = new Block(id)
        let length

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
}