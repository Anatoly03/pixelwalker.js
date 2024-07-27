import Client from "pocketbase";
import Structure, { MapIdentifier } from "./structure";

export type WorldMeta = {
    title: string
    owner: string
    plays: number
}

export class World<T extends MapIdentifier> extends Structure<T & WorldMeta> {
    protected client: Client

    constructor(args: { width: number, height: number, client: Client, title: string, owner: string, plays: number }) {
        super(args.width, args.height)
        this.client = args.client
        this.meta.title = 'Untiled World'
        this.meta.owner = 'USERNAME'
        this.meta.plays = 0
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

//     override async paste(xt: number, yt: number, fragment: Structure, args: { animation?: (b: any) => any, ms?: number, write_empty?: boolean } = { write_empty: true }): Promise<any> {
//         const promises: Promise<boolean>[] = []
//         const to_be_placed: [WorldPosition, Block][] = []

//         for (let x = 0; x < fragment.width; x++)
//             for (let y = 0; y < fragment.height; y++) {
//                 // TODO check constraints, else continue

//                 const blockAtLayer = ((i: 0|1) => fragment.blockAt(x, y, i) || new Block('empty'))

//                 if (!blockAtLayer(1).isSameAs(this.foreground[xt + x]?.[yt + y])) {
//                     if (!((blockAtLayer(1).name == 'empty') && !args.write_empty))
//                         to_be_placed.push([[xt + x, yt + y, 1], fragment.blockAt(x, y, 1)])
//                 }

//                 if (!blockAtLayer(0).isSameAs(this.background[xt + x]?.[yt + y])) {
//                     if (!((blockAtLayer(0).name == 'empty') && !args.write_empty))
//                         to_be_placed.push([[xt + x, yt + y, 0], fragment.blockAt(x, y, 0)])
//                 }
//             }

//         const generator = (args.animation || FIFO)(to_be_placed)

//         while (to_be_placed.length > 0) {
//             const yielded = generator.next()
//             const [[x, y, layer], block]: any = yielded.value

//             const promise = this.put_block(x, y, layer, block)
//             promise.catch(v => {
//                 throw new Error(v)
//             })
//             promises.push(promise)

//             if (args.ms) await this.client.wait(args.ms)
//         }

//         return Promise.all(promises)
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
