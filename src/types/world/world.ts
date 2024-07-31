import Structure, { MapIdentifier } from "./structure";
import { WorldPosition } from "..";
import Block from "./block/block.js";
import Client from "../../client.js";
import { FIFO } from "../animation";
import { Bit7, Magic } from "../message-bytes";

export type WorldMeta = {
    title: string
    owner: string
    plays: number
}

export type WorldEvents = {
    WorldMetadata: [string],
    WorldCleared: [],
    WorldReloaded: [Buffer],
    WorldBlockPlaced: [number, Buffer, number, number, ...any[]],
    PlayerTouchBlock: [],
    GlobalSwitchChanged: [],
    GlobalSwitchReset: [],
}

export default class World<T extends MapIdentifier = {}> extends Structure<T & WorldMeta> {
    protected client: Client

    #keys: [number, number, number, number, number, number]
    #switches: Set<number>

    /**
     * @todo
     */
    private constructor(args: { width: number, height: number, client: Client, title: string, owner: string, plays: number }) {
        super(args.width, args.height)
        this.client = args.client

        this.meta.title = args.title
        this.meta.owner = args.owner
        this.meta.plays = args.plays

        this.#keys = [0, 0, 0, 0, 0, 0]
        this.#switches = new Set() // TODO
    }

    //
    //
    // Static Methods
    //
    //

    public static registerDynamicWorld(client: Client) {
        let respond: (w: World) => void
        const promise = new Promise<World>((res) => respond = res)

        /**
         * Initialize the self player in the array.
         */
        client.raw.once('PlayerInit', async ([id, cuid, username, face, isAdmin, x, y, name_color, can_edit, can_god, title, plays, owner, global_switch_states, width, height, buffer]) => {
            client.world = new World({ width, height, client, title, plays, owner }).init(buffer)
            respond(client.world)
        })

        /**
         * A block was placed in the world.
         */
        client.raw.on('WorldBlockPlaced', async ([id, coordinates, layer, bid, ...args]) => {
            const block = new Block(bid)
            block.data = args
            for (let idx = 0; idx < coordinates.length; idx += 4) {
                const x = coordinates[idx] | (coordinates[idx + 1] << 8);
                const y = coordinates[idx + 2] | (coordinates[idx + 3] << 8);
                client.world!.getLayer(layer).set({ x, y }, block)
            }
            // TODO client emit
        })

        /**
         * Update world metadata
         */ 
        client.raw.on('WorldMetadata', async ([title, plays, owner]) => {
            client.world!.meta.title = title
            client.world!.meta.owner = owner
            client.world!.meta.plays = plays
        })

        /**
         * The world was cleared
         */
        client.raw.on('WorldCleared', async () => {
            client.world!.clear(true)
            // TODO emit?
        })

        /**
         * Reload world with new buffer.
         */
        client.raw.on('WorldReloaded', async ([buffer]) => {
            client.world!.init(buffer)
        })

        return promise
    }

    //
    //
    // Event Code
    //
    //

    /**
     * @ignore
     */
    public on<K extends keyof WorldEvents>(event: K, callback: (...args: WorldEvents[K]) => void): this {
        throw new Error('Not Implemented') // TODO add event emitter
        return this
    }

    /**
     * @ignore
     */
    public once<K extends keyof WorldEvents>(event: K, callback: (...args: WorldEvents[K]) => void): this {
        throw new Error('Not Implemented') // TODO add event emitter
        return this
    }

    /**
     * @ignore
     */
    public emit<K extends keyof WorldEvents>(event: K, ...args: WorldEvents[K]): this {
        throw new Error('Not Implemented') // TODO trigger event emitter
        return this
    }

    //
    //
    // Getters
    //
    //

    public get key_red(): boolean {
        throw new Error('Not Implemented') // TODO check key states
    }

    //
    //
    // Methods
    //
    //

    public override async paste(xt: number, yt: number, fragment: Structure, args: { animation?: (b: any) => any, ms?: number, write_empty?: boolean } = { write_empty: true }) {
        const promises: Promise<boolean>[] = []
        const to_be_placed: [WorldPosition, Block][] = []

        for (let x = 0; x < fragment.width; x++) {
            if (x + xt < 0 && x + xt >= this.width) continue
            for (let y = 0; y < fragment.height; y++) {
                if (y + yt < 0 || y + yt >= this.height) continue
                for (let layer: any = 0; layer < Structure.LAYER_COUNT; layer++) {
                    const block = fragment.blockAt({ x, y, layer }) ?? Block.empty
                    // if (block.name == 'empty' && !args.write_empty) continue
                    to_be_placed.push([{ x: x + xt, y: y + yt, layer }, block])
                }
            }
        }

        const generator = (args.animation || FIFO)(to_be_placed)

        while (to_be_placed.length > 0) {
            const yielded = generator.next()
            const [position, block]: any = yielded.value
            const promise = this.place(position, block)
            promise.catch(v => { throw new Error(v) })
            promises.push(promise)

            if (args.ms) await this.client.wait(args.ms)
        }

        return Promise.all(promises)
    }

    /**
     * Replace all blocks of type A with blocks B
     */
    public override replace_all(block: Block, new_block: Block) {
        return Promise.all(this.list(block.name).map(position => this.place(position, new_block)))
    }

    /**
     * Place a block
     */
    public override place(position: WorldPosition, block: Block) {
        if (this.blockAt(position).isSameAs(block)) return Promise.resolve(true)
        return this.client.block_scheduler.add(`${position.x}.${position.y}.${position.layer}`, block)
    }

    public switchState(id: number): boolean {
        return this.#switches.has(id)
    }
}


// /**
//  * A World is an offline-saved chunk of two dimensional
//  * block-data. Worlds can be used to manipulate map fragments
//  * like a pixel raster.
//  */
// export default class World extends Structure {
//     private client: Client

//     public title: string
//     public owner: string
//     public plays: number

//     constructor(args: { width: number, height: number, client: Client, title: string, owner: string, plays: number }) {
//         super(args.width, args.height)
//         this.client = args.client
//         this.title = args.title
//         this.owner = args.owner
//         this.plays = args.plays
//     }


//     public put_block(x: number, y: number, layer: 0 | 1, block: Block): Promise<boolean> {
//         if (this?.[layer == 1 ? 'foreground' : 'background']?.[x]?.[y]?.isSameAs(block))
//             return Promise.resolve(true)
//         return this.client.block_scheduler.add(`${x}.${y}.${layer}`, block)
//     }

//     public static fromString(data: string): Structure {
//         const structure = Structure.fromString(data)
//         // TODO add world stuff
//         return structure
//     }
// }
