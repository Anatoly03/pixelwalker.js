
export default class World {
    constructor(width, height) {
        this.width = width
        this.height = height

        this.foreground = World.get2dArray(width, height)
        this.background = World.get2dArray(width, height)
    }

    static get2dArray(width, height) {
        const arr = new Array(width)
        for (let i = 0; i < width; i++) {
            arr[i] = new Array(height)
        }
    }

    /**
     * Initialise the world with values
     * @param {Buffer} buffer 
     */
    init(buffer) {
        for (let x = 0; x < this.width; x++)
            for (let y = 0; y < this.height; y++) {
                // TODO
            }
        console.log(buffer)
    }

    /**
     * @param {*} buffer 
     */
    place(x, y, layer, id) {
        // TODO
    }
}