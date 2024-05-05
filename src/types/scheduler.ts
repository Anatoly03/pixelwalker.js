
import Client from "../client.js"
import { MessageType, HeaderTypes, SpecialBlockData } from "../data/consts.js"
import { Magic, Bit7, Int32, Byte, Boolean } from "../types.js"
import Block, { WorldPosition } from "./block.js"

class SchedulerEntry<T> {
    public priority: number
    public timeSince: number
    public value: T

    constructor(value: T) {
        this.priority = 0
        this.timeSince = Date.now()
        this.value = value
    }
}

export default class Scheduler {
    private client: Client
    public running = false

    public static BLOCKS_PER_QUEUE_TICK = 400
    public static BLOCK_TICK = 25
    public static BLOCK_PING_FREQUENCY = 300

    public block_queue_running = false
    public block_queue: Map<`${number}.${number}.${0|1}`, SchedulerEntry<Block>>

    constructor(client: Client) {
        this.client = client
        this.block_queue = new Map()
    }

    public start() {
        this.running = true
    }

    /**
     * This function is called by the internal block event loop
     * to automatically schedule block placement.
     */
    private async fill_block_loop() {
        if (!this.running) return

        if (!this.block_queue || this.block_queue.size == 0) {
            this.block_queue_running = false
            return
        }

        this.block_queue_running = true

        const entries = Array.from(this.block_queue.entries())
            .sort((a, b) => a[1].priority - b[1].priority) // sort by priority
            .filter((_, i) => i < Scheduler.BLOCKS_PER_QUEUE_TICK) // only take first N elements
            .filter((v) => (Date.now() - v[1].timeSince) < Scheduler.BLOCK_PING_FREQUENCY || v[1].priority == 0) // first time ping or re-ping

        // console.log(this.block_queue.size)

        for (const entry of entries) {
        // for (let placed = 0, entry = entries.next(); placed < Scheduler.BLOCKS_PER_QUEUE_TICK && !entry.done; placed++, entry = entries.next()) {
            const [pos, {value, priority, timeSince}]: [string, SchedulerEntry<Block>] = entry //.value
            const [x, y, layer] = pos.split('.').map(v => parseInt(v))

            const buffer: Buffer[] = [Magic(0x6B), Bit7(MessageType['placeBlock']), Int32(x), Int32(y), Int32(layer), Int32(value.id)]
            const arg_types: HeaderTypes[] = SpecialBlockData[value.name] || []

            for (let i = 0; i < arg_types.length; i++) {
                switch (arg_types[i]) {
                    case HeaderTypes.Byte:
                        buffer.push(Byte(value.data[i]))
                    // TODO other types
                    case HeaderTypes.Int32:
                        buffer.push(Int32(value.data[i]))
                        break
                    // TODO other types
                    case HeaderTypes.Boolean:
                        buffer.push(Boolean(value.data[i]))
                        break
                }
            }

            // console.log(pos, block)

            this.client.send(Buffer.concat(buffer))

            entry[1].priority++
        }

        setTimeout(this.fill_block_loop.bind(this), Scheduler.BLOCK_TICK)
    }

    /**
     * Place a block to the scheduler
     */
    public block([x, y, layer]: WorldPosition, block: Block) {
        if (!this.client.connected) return Promise.reject("Client not connected!")

        const key: `${number}.${number}.${0|1}` = `${x}.${y}.${layer}`

        const promise = (res: (v: any) => void, rej: (v: any) => void) => {
            if (!this.client.connected) return rej("Client not connected")
            if (!this.block_queue.get(key)) return res(true)
            // console.log(this.block_queue)
            setTimeout(() => promise(res, rej), 5)
        }

        this.block_queue.set(key, new SchedulerEntry(block))
        if (!this.block_queue_running) this.fill_block_loop()
        return new Promise(promise)
    }

    /**
     * Disconnect the intervals
     */
    public stop() {
        this.block_queue.clear()
        this.running = false
    }
}