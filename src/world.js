
import { read7BitInt } from './math.js'

export default class World {
    constructor(width, height) {
        this.width = width
        this.height = height

        /**
         * @type {Block[][]}
         */
        this.foreground = World.get2dArray(width, height)

        /**
         * @type {Block[][]}
         */
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
        World.mappings = World.mappings || map
        /**
         * @type {{[keys: number]: string}}
         */
        World.reverseMapping = World.reverseMapping || Object.fromEntries(Object.entries(map).map(a => a.reverse()))
    }

    /**
     * Initialise the world with values
     * @param {Buffer} buffer 
     */
    clear() {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                const atBorder = x == 0 || y == 0 || x == this.width - 1 || y == this.height - 1

                this.foreground[x][y] = r ? new Block(World.mappings['basic_gray']) : new Block(0),
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

        console.log(buffer.length, offset)
    }

    /**
     * Serialize a layer
     * @param {*} layer 
     * @param {Buffer} buffer 
     */
    deserializeLayer(layer, buffer, offset) {
        for (let x = 0; x < this.width; x++)
            for (let y = 0; y < this.height; y++) {
                let [block, o] = this.deserializeBlock(buffer, offset)
                layer[x][y] = block
                offset = o
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
    deserializeBlock(buffer, offset) {
        const id = buffer.readInt32LE(offset)
        const block = new Block(id)
        
        offset += 4

        switch (World.reverseMapping[id]) {
            case 'empty':
                return [new Block(0), offset]

            case 'coin_gate':
            case 'blue_coin_gate':
            case 'coin_door':
            case 'blue_coin_door':
                block.amount = buffer.readInt32LE(offset)
                return [block, offset + 4]

            case 'portal':
                block.rotation = buffer.readInt32LE(offset)
                block.portal_id = buffer.readInt32LE(offset + 4) 
                block.target_id = buffer.readInt32LE(offset + 8)
                return [block, offset + 12]

            case 'spikes':
                block.rotation = buffer.readInt32LE(offset)
                return [block, offset + 4]

            default:
                return [block, offset]
        }

        // return [block, offset]
    }

    /**
     * @param {number} x 
     * @param {number} y 
     * @param {0 | 1} l 
     * @param {number} id 
     */
    place(x, y, l, id) {
        const layer = l == 1 ? this.foreground : this.background
        layer[x][y] = new Block(id)
    }

    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @param {0 | 1} l 
     * @returns 
     */
    blockAt(x, y, l) {
        const layer = l == 1 ? this.foreground : this.background
        return layer[x][y]
    }

    /**
     * @param {number} x1 
     * @param {number} y1 
     * @param {number} x2 
     * @param {number} y2 
     * @returns {World}
     */
    copy(x1, y1, x2, y2) {
        if (x2 < x1) {let tmp = x2; x2 = x1; x1 = tmp }
        if (y2 < y1) {let tmp = y2; y2 = y1; y1 = tmp }

        const world = new World(x2 - x1 + 1, y2 - y1 + 1)

        for (let x = x1; x <= x2; x++)
            for (let y = y1; y <= y2; y++) {
                world.background[x - x1][y - y1] = this.background[x][y]
                world.foreground[x - x1][y - y1] = this.foreground[x][y]
            }

        return world
    }
}

export class Block {
    constructor(id) {
        this.id = id
    }

    get name() {
        return World.reverseMapping[this.id]
    }
}