
import { read7BitInt } from './math.js'

export default class World {
    constructor(width, height) {
        this.width = width
        this.height = height

        this.foreground = World.get2dArray(width, height)
        this.background = World.get2dArray(width, height)
    }

    /**
     * @param {number} width 
     * @param {number} height 
     * @returns {any[][]}
     */
    static get2dArray(width, height) {
        const arr = new Array(width)
        for (let i = 0; i < width; i++) {
            arr[i] = new Array(height)
        }
        return arr
    }

    /**
     * Set the block string to id mappings
     * @param {{[keys: string]: number}} map 
     */
    setMappings(map) {
        this.mappings = map
        /**
         * @type {{[keys: number]: string}}
         */
        this.reverseMapping = Object.fromEntries(Object.entries(map).map(a => a.reverse()))
        console.log(this.reverseMapping)
    }

    /**
     * Initialise the world with values
     * @param {Buffer} buffer 
     */
    clear() {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                const atBorder = x == 0 || y == 0 || x == this.width - 1 || y == this.height - 1

                this.foreground[x][y] = r ? new Block(this.mappings['basic_gray']) : new Block(0),
                this.background[x][y] = new Block(0)
            }
        }
    }

    /**
     * Initialise the world with values
     * @param {Buffer} buffer 
     */
    init(buffer) {
        let offset = 0
        offset = this.deserializeLayer(this.background, buffer, offset)
        offset = this.deserializeLayer(this.foreground, buffer, offset)
        console.log(offset, buffer.length)
    }

    /**
     * Serialize a layer
     * @param {*} layer 
     * @param {Buffer} buffer 
     */
    deserializeLayer(layer, buffer, offset) {
        let value, block

        console.log(buffer)

        for (let x = 0; x < this.width; x++)
            for (let y = 0; y < this.height; y++) {
                // [value, offset] = read7BitInt(buffer, offset)
                value = buffer.readInt32LE(offset)
                offset += 4

                if (x == 0 && y < 10) {
                    console.log(value)
                }

                [block, offset] = this.deserializeBlock(value, buffer, offset)
                // offset = o
            }

        return offset
    }

    /**
     * 
     * @param {number} id 
     * @param {Buffer} buffer 
     * @param {number} offset 
     * @returns 
     */
    deserializeBlock(id, buffer, offset) {
        const block = new Block(id)
        switch (this.reverseMapping[0]) {
            case 'coin_gate':
            case 'blue_coin_gate':
            case 'coin_door':
            case 'blue_coin_door':
                block.amount = buffer.readInt32LE(offset)
                return [block, offset + 4]

            case 'portal':
                block.v1 = buffer.readInt32LE(offset) // id?
                block.v2 = buffer.readInt32LE(offset + 4) // target?
                block.v3 = buffer.readInt32LE(offset + 8) // rotation?
                return [block, offset + 12]

            case 'spikes':
                block.rotation = buffer.readInt32LE(offset)
                return [block, offset + 4]

            default:
                return [block, offset]
        }
    }

    /**
     * @param {*} buffer 
     */
    place(x, y, layer, id) {
        // TODO
    }
}

class Block {
    constructor(id) {
        this.id = id
    }
}