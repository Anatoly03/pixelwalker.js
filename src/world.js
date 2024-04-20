
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
     * Initialise the world with values
     * @param {Buffer} buffer 
     */
    init(buffer) {
        this.deserializeLayer(this.background, buffer)
        this.deserializeLayer(this.foreground, buffer)
    }

    /**
     * Serialize a layer
     * @param {*} layer 
     * @param {*} buffer 
     */
    deserializeLayer(layer, buffer) {
        let offset = 0
        for (let x = 0; x < this.width; x++)
            for (let y = 0; y < this.height; y++) {
                [value, offset] = read7BitInt(buffer, offset)
                // TODO
            }
    }

    /**
     * @param {*} buffer 
     */
    place(x, y, layer, id) {
        // TODO
    }
}