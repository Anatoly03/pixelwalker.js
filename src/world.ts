
import Block from "./block"
import { BlockMappings, BlockMappingsReverse } from './mappings'

function get2dArray(width, height) {
    const arr = new Array(width)
    for (let i = 0; i < width; i++) {
        arr[i] = new Array(height)
    }
    return arr
}

export default class World {
    public width: number
    public height: number
    public foreground: Block[][]
    public background: Block[][]

    constructor(width, height) {
        this.width = width
        this.height = height
        this.foreground = get2dArray(width, height)
        this.background = get2dArray(width, height)
    }

    clear(border: boolean) {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                const atBorder = border && (x == 0 || y == 0 || x == this.width - 1 || y == this.height - 1)

                this.foreground[x][y] = atBorder ? new Block(World.mappings['basic_gray']) : new Block(0),
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

        switch (BlockMappingsReverse[id]) {
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

    place(x: number, y: number, l: 0 | 1, id: number, args: any) {
        const layer = l == 1 ? this.foreground : this.background
        const block = layer[x][y] = new Block(id)

        switch (BlockMappingsReverse[id]) {
            case 'coin_gate':
            case 'blue_coin_gate':
            case 'coin_door':
            case 'blue_coin_door':
                block.amount = args[0]
                break

            case 'portal':
                block.rotation = args[0]
                block.portal_id = args[1]
                block.target_id = args[2]
                break

            case 'spikes':
                block.rotation = args[0]
                break
        }
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
}
