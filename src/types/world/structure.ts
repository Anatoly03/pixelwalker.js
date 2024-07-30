import YAML from 'yaml'
import Block from "./block/block"
import Player from "../player/player"
import Layer from "./layer"
import { WorldPosition } from ".."
import { BlockMappings } from './block/mappings'
import Client from '../../client'

export type MapIdentifier = { [keys: number | string]: number | string | boolean | null | undefined  }

/**
 * A World is an offline-saved chunk of two dimensional
 * block-data. Worlds can be used to manipulate map fragments
 * like a pixel raster.
 */
export default class Structure<Meta extends MapIdentifier = {}> {
    public meta!: Meta
    
    [layer: number]: readonly Layer[]
    #layers: Layer[] = []

    /**
     * The amount of layers the game has.
     */
    public static LAYER_COUNT = 2 as const

    /**
     * Initialize an empty structure of given dimensions
     */
    public static empty(width: number, height: number): Structure<{}> {
        const object = new Structure<{}>(width, height)
        object.clear(false)
        return object
    }

    /**
     * @param width 
     * @param height 
     */
    public static fromBuffer(width: number, height: number, buffer: Buffer) {
        return new Structure<{}>(width, height).init(buffer)
    }

    /**
     * @param data 
     * @returns 
     */
    public static fromString(data: string): Structure {
        const value = YAML.parse(data)
        const world = new Structure(value.width, value.height)

        world.meta = value.meta

        const palette: (keyof typeof BlockMappings)[] = value.palette.map((name: keyof typeof BlockMappings) => (Client.PaletteFix[name as keyof typeof Client.PaletteFix]) ?? name);
        const foreground: number[] = value.layers.foreground.split(' ').map((v: string) => parseInt(v, 36))
        const background: number[] = value.layers.background.split(' ').map((v: string) => parseInt(v, 36))
        const block_data: any[][] = value.layers.data

        let idx = 0
        let data_idx = 0

        for (let x = 0; x < world.width; x++)
            for (let y = 0; y < world.height; y++) {
                world.foreground.set({ x, y }, new Block(palette[foreground[idx++]]))

                if (world.foreground.get({ x, y }).data_count > 0)
                    world.foreground.get({ x, y }).data = block_data[data_idx++]
            }

        idx = 0

        for (let x = 0; x < world.width; x++)
            for (let y = 0; y < world.height; y++) {
                world.background.set({ x, y }, new Block(palette[background[idx++]]))

                if (world.background.get({ x, y }).data_count > 0)
                    world.background.get({ x, y }).data = block_data[data_idx++]
            }

        return world
    }

    /**
     * 
     */
    constructor(public width: number, public height: number) {
        this.meta = {} as any
        this.clear(false)

        // Define getters for indexing the layers
        for (let layer = 0; layer < Structure.LAYER_COUNT; layer++) {
            Object.defineProperty(this, layer, { get: () => this.#layers[layer] })
        }
    }

    //
    //
    // Methods
    //
    //


    /**
     * The foreground layer. In this layer all smiley collisions take place.
     */
    public get foreground() {
        return this.#layers[1]
    }

    /**
     * The background layer.
     */
    public get background() {
        return this.#layers[0]
    }

    /**
     * Set metadata. Metadata is anything that is covered by implementation
     * over the structure definition. For example it could be a custom object
     * that defines level difficulty or id
     */
    public setMeta<T extends MapIdentifier>(data: T): Structure<T> {
        this.meta = data as any
        return this as any
    }

    /**
     * @todo
     */
    public extendMeta<T extends MapIdentifier>(data: T): Structure<Meta & T> {
        this.meta = {...this.meta, ...data} as any
        return this as any
    }

    /**
     * 
     */

    /**
     * @param width 
     * @param height 
     */
    protected init(buffer: Buffer, width: number = this.width, height: number = this.height) {
        const deserializeLayer = (buffer: Buffer, offset: number) => {
            const layer = new Layer(width, height)
            this.#layers.push(layer)
            return layer.deserializeFromBuffer(buffer, offset)
        }

        let offset = 0
        offset = deserializeLayer(buffer, offset)
        offset = deserializeLayer(buffer, offset)

        if (buffer.length != offset) {
            console.warn(`Buffer Length for World Data and Offset do not match. (${buffer.length} != ${offset}). You may be loading a world with blocks that are not yet encoded in this API version.`)
        }

        return this
    }

    /**
     * @todo
     */
    public blockAt(position: WorldPosition): Block {
        return this.getLayer(position.layer).get(position)
    }

    /**
     * @todo
     */
    public place(position: WorldPosition, block: Block) {
        this.#layers[position.layer].set(position, block)
    }

    /**
     * Get a specific layer.
     */
    public getLayer(z: number): Layer {
        return this.#layers[z];
    }

    /**
     * Clear structure with or without border
     */
    public clear(border = false) {
        this.#layers = [...new Array(Structure.LAYER_COUNT).keys()].map(() => new Layer(this.width, this.height))

        if (border) {
            for (let x = 0; x < this.width; x++) {
                this.foreground.set({ x, y: 0 }, new Block(0))
                this.foreground.set({ x, y: this.height - 1 }, new Block(0))
            }

            for (let y = 0; y < this.height; y++) {
                this.foreground.set({ x: 0, y }, new Block(0))
                this.foreground.set({ x: this.width - 1, y }, new Block(0))
            }
        }
    }

    /**
     * Paste World chunk into this world
     * @param {args} options Options can be inherited by children classes who have more control over block placement control flow
     */
    public paste(xt: number, yt: number, data: Structure, options?: never) {
        for (let x = 0; x < data.width; x++)
            for (let y = 0; y < data.height; y++) {
                if (x + xt < 0 || y + yt < 0 || x + xt >= this.width || y + yt >= this.height)
                    continue
                for (let l =  0; l < this.#layers.length; l++)
                    this.#layers[l].set({ x: x + xt, y: y + yt}, data.#layers[l].get({ x, y }))
            }
    }

    /**
     * @todo
     */
    getWalkablePositionsFor(player: Player) {
        
    }
}


// /**
//  * A World is an offline-saved chunk of two dimensional
//  * block-data. Worlds can be used to manipulate map fragments
//  * like a pixel raster.
//  */
// export default class Structure {
//     public width: number
//     public height: number
//     public meta: { [keys: string]: any }
    
//     private layers: Block[][][]

//     /**
//      * Place block
//      */
//     public set(x: number, y: number, l: 0 | 1, id: number, args: any): [WorldPosition, Block] {
//         const layer = l == 1 ? this.foreground : this.background
    
//         if (!layer[x]) layer[x] = new Array(this.height)

//         const block = layer[x][y] = new Block(id)

//         if (SpecialBlockData[block.name])
//             block.data = args

//         return [[x, y, l], block]
//     }

//     public copy(x1: number, y1: number, x2: number, y2: number): Structure {
//         if (x2 < x1) { let tmp = x2; x2 = x1; x1 = tmp }
//         if (y2 < y1) { let tmp = y2; y2 = y1; y1 = tmp }

//         const world = new Structure(x2 - x1 + 1, y2 - y1 + 1)

//         for (let x = x1; x <= x2; x++)
//             for (let y = y1; y <= y2; y++) {
//                 if (x < 0 || y < 0 || x >= this.width || y >= this.height)
//                     continue
//                 world.background[x - x1][y - y1] = this.background[x][y]
//                 world.foreground[x - x1][y - y1] = this.foreground[x][y]
//             }

//         return world
//     }


//     //
//     //
//     // World Management
//     //
//     //

//     /**
//      * Replace all blocks of type A with blocks B
//      */
//     public replace_all(block: Block, new_block: Block) {
//         for (let x = 0; x < this.width; x++)
//             for (let y = 0; y < this.height; y++) {
//                 if (this.foreground[x][y].name == block.name)
//                     this.foreground[x][y] = new_block
//                 if (this.background[x][y].name == block.name)
//                     this.background[x][y] = new_block
//             }
//     }

//     public total(block: keyof typeof BlockMappings): number {
//         let value = 0
//         for (let x = 0; x < this.width; x++)
//             for (let y = 0; y < this.height; y++)
//                 if (this.foreground[x][y].name == block)
//                     value++
//         return value
//     }

//     public list(block: keyof typeof BlockMappings): WorldPosition[];
//     public list(block: (keyof typeof BlockMappings)[]): WorldPosition[];
//     public list(...block: (keyof typeof BlockMappings)[]): WorldPosition[];
//     public list(blocks: keyof typeof BlockMappings | (keyof typeof BlockMappings)[], ...args: (keyof typeof BlockMappings)[]): WorldPosition[] {
//         if (!Array.isArray(blocks)) return this.list([blocks, ...args])

//         let value: WorldPosition[] = []
//         for (let block of blocks) {
//             for (let x = 0; x < this.width; x++)
//                 for (let y = 0; y < this.height; y++) {
//                     if (this.foreground[x][y].name == block)
//                         value.push([x, y, 1])
//                     if (this.background[x][y].name == block)
//                         value.push([x, y, 0])
//                 }
//         }

//         return value
//     }

//     public get_walkable_positions(): WorldPosition[] {
//         let value: WorldPosition[] = []
//         for (let x = 0; x < this.width; x++)
//             for (let y = 0; y < this.height - 1; y++) {
//                 if ((this.foreground[x][y] == null || this.foreground[x][y].name == 'empty' || Decorations.includes(this.foreground[x][y].name as string)) && SolidBlocks.includes(this.foreground[x][y+1]?.name as string))
//                     value.push([x, y, 1])
//             }
//         return value
//     }

//     //
//     //
//     // Parsers
//     //
//     //

//     /**
//      * Write world data into a stream
//      */
//     // public toString(writer: stream.Writable): string ???
//     public toString(): string {
//         const data: any = {
//             'file-version': 0,
//             meta: this.meta,
//             width: this.width,
//             height: this.height,
//             palette: ['empty'],
//             layers: {
//                 foreground: '',
//                 background: '',
//                 data: [],
//             }
//         }

//         for (let x = 0; x < this.width; x++)
//             for (let y = 0; y < this.height; y++) {
//                 const block = this.foreground[x][y]

//                 if (!data.palette.includes(block.name))
//                     data.palette.push(block.name)

//                 const shortcut = data.palette.indexOf(block.name).toString(36).toLocaleUpperCase()

//                 data.layers.foreground += shortcut + ' '

//                 if (block.data.length > 0)
//                     data.layers.data.push(block.data)
//             }

//         for (let x = 0; x < this.width; x++)
//             for (let y = 0; y < this.height; y++) {
//                 const block = this.background[x][y]

//                 if (!data.palette.includes(block.name))
//                     data.palette.push(block.name)

//                 const shortcut = data.palette.indexOf(block.name).toString(36).toLocaleUpperCase()

//                 data.layers.background += shortcut + ' '

//                 if (block.data.length > 0)
//                     data.layers.data.push(block.data)
//             }

//         return YAML.stringify(data)
//     }

//     public static metaFromString(data: string): any {
//         const value = YAML.parse(data)
//         return value.meta || {}
//     }

// }
