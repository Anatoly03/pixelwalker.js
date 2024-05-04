
import Client from "../client.js"
import { MessageType, HeaderTypes, SpecialBlockData } from "../data/consts.js"
import { Magic, Bit7, Int32, Byte, Boolean } from "../types.js"
import Block, { WorldPosition } from "./block.js"

type SchedulerEntry = [Block, number, number]

export default class Scheduler {
    public running = false

    public BLOCKS_PER_QUEUE_TICK = 100
    public BLOCK_TICK = 5
    public PING_EVERY_MS = 200

    private client: Client
    private intervals: NodeJS.Timeout[] = []
    public block_queue: Map<`${number}.${number}.${0|1}`, SchedulerEntry>

    constructor(client: Client) {
        this.client = client
        this.intervals = []
        this.block_queue = new Map()
    }

    public start() {
        this.intervals.push(setInterval(() => this.fill_block_loop(), this.BLOCK_TICK))
        this.running = true
    }

    /**
     * This function is called by the internal block event loop
     * to automatically schedule block placement.
     */
    private async fill_block_loop() {
        if (this.block_queue.size == 0) return

        const time = Date.now()

        const entries = Array.from(this.block_queue.entries())
            .sort((a, b) => a[1][2] - b[1][2]) // Sort by priority
            .filter((_, i) => i < this.BLOCKS_PER_QUEUE_TICK) // Only take first N elements
            .filter(v => (time - v[1][1]) > this.PING_EVERY_MS || v[1][2] == 0) // Wait Time exceeds or first time placing block

        if (entries.length == 0) return

        for (const entry of entries) {
            const [pos, [block, wait_time, priority]] = entry
            const [x, y, layer] = pos.split('.').map(v => parseInt(v))

            const buffer: Buffer[] = [Magic(0x6B), Bit7(MessageType['placeBlock']), Int32(x), Int32(y), Int32(layer), Int32(block.id)]
            const arg_types: HeaderTypes[] = SpecialBlockData[block.name] || []

            for (let i = 0; i < arg_types.length; i++) {
                switch (arg_types[i]) {
                    case HeaderTypes.Byte:
                        buffer.push(Byte(block.data[i]))
                    // TODO other types
                    case HeaderTypes.Int32:
                        buffer.push(Int32(block.data[i]))
                        break
                    // TODO other types
                    case HeaderTypes.Boolean:
                        buffer.push(Boolean(block.data[i]))
                        break
                }
            }

            entry[1][2]++

            this.client.send(Buffer.concat(buffer))
        }

        // let entry = entries.next()

        // console.log(this.block_queue.size)

        // for (let placed = 0, entry = entries.next(); placed < BLOCKS_PER_QUEUE_TICK && !entry.done; placed++, entry = entries.next()) {
        //     const [pos, [block, wait_time, priority]]: [string, SchedulerEntry] = entry.value
        //     const [x, y, layer] = pos.split('.').map(v => parseInt(v))

        //     const buffer: Buffer[] = [Magic(0x6B), Bit7(MessageType['placeBlock']), Int32(x), Int32(y), Int32(layer), Int32(block.id)]
        //     const arg_types: HeaderTypes[] = SpecialBlockData[block.name] || []

        //     for (let i = 0; i < arg_types.length; i++) {
        //         switch (arg_types[i]) {
        //             case HeaderTypes.Byte:
        //                 buffer.push(Byte(block.data[i]))
        //             // TODO other types
        //             case HeaderTypes.Int32:
        //                 buffer.push(Int32(block.data[i]))
        //                 break
        //             // TODO other types
        //             case HeaderTypes.Boolean:
        //                 buffer.push(Boolean(block.data[i]))
        //                 break
        //         }
        //     }

        //     // console.log(pos, block)

        //     this.client.send(Buffer.concat(buffer))
        // }
    }

    /**
     * Place a block to the scheduler
     */
    public block([x, y, layer]: WorldPosition, block: Block) {
        if (!this.client.connected) return Promise.reject(`Client not connected! For Block: ${block.name}`)

        const key: `${number}.${number}.${0|1}` = `${x}.${y}.${layer}`
        this.block_queue.set(key, [block, Date.now(), 0])

        const promise = (res: (v: any) => void, rej: (v: any) => void) => {
            if (!this.client.connected) return rej("Client not connected")
            if (!this.block_queue.get(key)) return res(true)
            // console.log(this.block_queue)
            setTimeout(() => promise(res, rej), 5)
        }

        return new Promise(promise)
    }

    /**
     * Disconnect the intervals
     */
    public stop() {
        this.intervals.forEach(i => clearInterval(i))
        this.block_queue.clear()
        this.running = false
    }
}