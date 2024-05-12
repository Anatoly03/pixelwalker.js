import { EventEmitter } from "events"
import Client from "../client"

class SchedulerEntry<V> {
    value: V
    priority: number
    timeSince: number

    constructor(v: V, priority: number = 0) {
        this.value = v
        this.priority = priority
        this.timeSince = performance.now()
    }
}

export default abstract class BaseScheduler<K extends string, V> {
// export default abstract class BaseScheduler<K extends string, V> extends EventEmitter<{[_ in K]: any[]}> {
    protected readonly client: Client
    protected queue: Map<K, SchedulerEntry<V>> = new Map()
    private tickets: Map<K, { res: (v: boolean) => void, rej: (v: any) => void }> = new Map()
    public running = false

    private lastTimeBusy = 0
    private busy = false
    private loopInterval: NodeJS.Timeout

    public LOOP_FREQUENCY = 100
    public ELEMENTS_PER_TICK = 200
    public INBETWEEN_DELAY = 5
    public RETRY_FREQUENCY = 400

    constructor(client: Client) {
        // super()
        this.client = client
        clearTimeout(this.loopInterval = setTimeout(() => { }, 1000))
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
        // console.debug('Scheduler no longer busy!')
        return this.busy = false
    }

    protected abstract try_send(k: K, e: V): Promise<void>;

    private async try_run_loop(): Promise<any> {
        clearTimeout(this.loopInterval)
        // console.log(`Trying to run: ${(performance.now() - this.lastTimeBusy) / 1000}s unbusy, looping in ${Math.max(this.LOOP_FREQUENCY - (performance.now() - this.lastTimeBusy), 0)}`)
        return this.loopInterval = setTimeout(this.loop.bind(this), Math.max(this.LOOP_FREQUENCY - (performance.now() - this.lastTimeBusy), 0))
    }

    /**
     * Selector Algorithm to get entries.
     */
    private getEntries() {
        // TODO create an object for priority to avoid sorting every time
        // const entries: [K, SchedulerEntry<V>][] = []
        // for (const [key, entry] of this.queue.entries()) {}
        
        const time = performance.now()
        const entries = Array.from(this.queue.entries())
            .filter(v => (time - v[1].timeSince) > this.RETRY_FREQUENCY || v[1].priority == 0) // Wait Time exceeds or first time placing block
            .sort((a, b) => b[1].priority - a[1].priority) // Sort by priority
            // .filter((_, i) => i < this.ELEMENTS_PER_TICK) // Only take first N elements
        
        return entries.slice(0, this.ELEMENTS_PER_TICK)
    }

    private async loop() {
        if (!this.client.connected) return this.stop()
        if (!this.running) return false
        if (!this.queue) return this.unbusy()
        if (this.queue.size == 0) return this.unbusy()

        if (performance.now() - this.lastTimeBusy < this.LOOP_FREQUENCY) {
            return this.try_run_loop()
        }

        // console.log('Entering loop...')

        // console.log(this.queue.size)

        const entries = this.getEntries()

        // if (entries.length == 0) 
        //     return this.try_run_loop()

        this.lastTimeBusy = performance.now()

        // console.log('Loop', this.queue.size, 'Scheduled', entries.length)

        for (const entry of entries) {
            await this.try_send(entry[0], entry[1].value)
            entry[1].priority++ // Increment priority for the case, the block will not get sent.
            if (this.INBETWEEN_DELAY != 0) await this.client.wait(this.INBETWEEN_DELAY)
        }

        // console.log('Leaving loop!')

        return this.try_run_loop()
    }

    public add(k: K, el: V, priority?: number): Promise<boolean> {
        if (!this.client.connected || !this.running) return Promise.resolve(this.stop())

        if (this.queue.get(k) != null) {
            this.remove(k)
        }

        this.queue.set(k, new SchedulerEntry(el, priority))

        const promise = (res: (v: boolean) => void, rej: (v: any) => void) => {
            if (!this.client.connected || !this.running) return res(false)
            if (!this.has(k)) return res(true)

            const res_wrapper = (v: boolean) => {
                if (this.queue.size == 0) this.unbusy()
                res(v)
            }

            this.tickets.set(k, { res: res_wrapper, rej })
            // this.once(k, (() => res_wrapper(true)) as any)
        }

        if (!this.busy) {
            // console.debug('Scheduler now busy.')
            this.busy = true
            this.try_run_loop()
        }

        return new Promise(promise)
    }


    public has(k: K) {
        return this.queue.has(k)
    }

    public remove(k: K): boolean {
        this.queue.delete(k)
        // this.emit(k, [])
        this.tickets.get(k)?.res(true)
        this.tickets.delete(k)
        if (this.queue.size == 0) return this.unbusy()
        return this.busy
    }

}
