import { EventEmitter } from "events"
import Client from "../client"

class SchedulerEntry<V> {
    value: V
    priority: number
    timeSince: number

    constructor(v: V, priority: number = 0) {
        this.value = v
        this.priority = priority
        this.timeSince = Date.now()
    }
}

export default abstract class BaseScheduler<K extends string, V> extends EventEmitter<{[keys: string]: any[]}> {
    protected readonly client: Client
    protected queue: Map<K, SchedulerEntry<V>> = new Map()
    private tickets: Map<K, { res: (v: boolean) => void, rej: (v: any) => void }> = new Map()
    public running = false
    
    private lastTimeBusy = 0
    private busy = false

    public LOOP_FREQUENCY = 100
    public ELEMENTS_PER_TICK = 200
    public INBETWEEN_DELAY = 5
    public RETRY_FREQUENCY = 400

    constructor(client: Client) {
        super()
        this.client = client
    }

    public start() {
        return this.running = true
    }

    public stop() {
        this.unbusy()
        this.tickets.forEach(c => c.rej("Scheduler was stopped!"))
        return this.running = false
    }

    private unbusy() {
        return this.busy = false
    }

    protected abstract try_send(k: K, e: V): Promise<void>;

    private async loop() {
        if (!this.client.connected) return this.stop()
        if (!this.running) return false
        if (!this.queue) return this.unbusy()
        if (this.queue.size == 0) return this.unbusy()

        // console.log(this.queue.size)

        const time = Date.now()
        const entries = Array.from(this.queue.entries())
            .sort((a, b) => a[1].priority - b[1].priority) // Sort by priority
            .filter((_, i) => i < this.ELEMENTS_PER_TICK) // Only take first N elements
            .filter(v => (time - v[1].timeSince) > this.RETRY_FREQUENCY || v[1].priority == 0) // Wait Time exceeds or first time placing block

        if (entries.length == 0) {
            if (!this.busy) return
            if (Date.now() - this.lastTimeBusy < this.LOOP_FREQUENCY)
                setTimeout(this.loop.bind(this), this.LOOP_FREQUENCY)
            return
        }

        this.lastTimeBusy = Date.now()

        // console.log('Loop', this.queue.size, 'Scheduled', entries.length)

        for (const entry of entries) {
            await this.try_send(entry[0], entry[1].value)
            entry[1].priority++ // Increment priority for the case, the block will not get sent.
            if (this.INBETWEEN_DELAY != 0) await this.client.wait(this.INBETWEEN_DELAY)
        }

        setTimeout(this.loop.bind(this), this.LOOP_FREQUENCY)

        return true
    }

    public add(k: K, el: V, priority?: number): Promise<boolean> {
        if (!this.client.connected || !this.running) return Promise.resolve(this.stop())
        this.queue.set(k, new SchedulerEntry(el, priority))
        
        const promise = (res: (v: boolean) => void, rej: (v: any) => void) => {
            if (!this.client.connected || !this.running) return res(false)
            if (!this.has(k)) return res(true)
            // setTimeout(() => promise(res, rej), 5)
            this.tickets.set(k, { res, rej })
            this.once(k, (() => res(true)) as any)
        }
        
        if (!this.busy) {
            // console.debug('Scheduler now busy.')
            this.busy = true
            this.loop()
        }

        return new Promise(promise)
    }


    public has(k: K) {
        return this.queue.has(k)
    }

    public remove(k: K) {
        const b = this.queue.delete(k)
        this.tickets.get(k)?.res(true)
        this.tickets.delete(k)
        return b
    }

}
