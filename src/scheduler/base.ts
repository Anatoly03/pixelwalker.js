import GameConnection from "../game.connection.js";
import { sleep } from "../util/sleep.js";

const DEFAULT_PRIORITY = 10;

class Entry<V> {
    public priority: number = DEFAULT_PRIORITY;
    public timeSince: number = performance.now();
    public ignoreThisLoop = false;

    constructor(public value: V) {}
}

export default abstract class Scheduler<V> {
    /**
     * The running state of the scheduler.
     */
    #running = false;

    /**
     * The time control of the scheduler.
     */
    #timer: NodeJS.Timeout;

    /**
     * The last time the scheduler loop was active.
     */
    #lastTimeBusy = 0;

    /**
     * The busy state of the scheduler.
     */
    #busy = false;

    /**
     * The queue of tickets to be processed.
     */
    #queue = new Map<string, Entry<V>>();

    /**
     * The promises of the tickets.
     */
    #promises = new Map<string, Promise<void>>();

    /**
     * The promises of the tickets.
     */
    #promiseAnswers = new Map<string, [(v: boolean) => void, (v: any) => void]>();

    public LOOP_FREQUENCY = 100;
    public ELEMENTS_PER_TICK = 200;
    public INBETWEEN_DELAY = 5;
    public RETRY_FREQUENCY = 400;

    /**
     * Return if the scheduler is running or inactive.
     */
    public get isRunning() {
        return this.connection.connected() && this.#running;
    }

    /**
     * Return if the scheduler is busy or inactive.
     */
    public get isBusy() {
        return this.isRunning && this.#busy;
    }

    /**
     * Create a new schedular instance.
     */
    constructor(protected connection: GameConnection) {
        clearTimeout((this.#timer = setTimeout(() => {}, 1000)));
    }

    //
    //
    // METHODS
    //
    //

    /**
     * Start the scheduler and its' loop.
     */
    public start(): void {
        this.#running = true;
    }

    /**
     * Stop the scheduler and its' loop. Rejects all pending tickets.
     */
    public stop(): void {
        this.#running = false;
        this.#promiseAnswers.forEach(([, reject]) => reject("Scheduler was stopped."));
    }

    /**
     * Sets the loop to busy.
     */
    public busy(): void {
        this.#busy = true;
        this.tryLoop();
    }

    /**
     * Sets the loop to not busy.
     */
    public unbusy(): void {
        this.#busy = false;
    }

    /**
     * Send a ticket to the scheduler.
     */
    public send(value: V, priority?: number): Promise<void> {
        try {
            if (this.verify(value)) {
                return Promise.resolve();
            }
        } catch (e) {
            return Promise.reject(e);
        }

        const ticket = this.createKey(value);
        return this.add(ticket, value, priority);
    }

    /**
     * Create a key identifying a ticket.
     */
    protected abstract createKey(value: V): string;

    /**
     * Send a ticket to the scheduler.
     */
    protected abstract trySend(value: V): void;

    /**
     * Optionally create a verifier and accept tickets that are already
     * implemented.
     * 
     * @throws {Error} If the ticket is invalid, rejecting the promise.
     */
    protected verify(value: V): boolean {
        return false;
    }

    /**
     * Gets the queue of tickets to be processed.
     */
    private nextEntries() {
        const time = performance.now();

        return (
            Array.from(this.#queue.entries())
                /**
                 * Wait Time exceeds or first time placing block
                 */
                .filter((v) => time - v[1].timeSince > this.RETRY_FREQUENCY || v[1].priority == 0)
                /**
                 * Sort by priority
                 */
                .sort((a, b) => b[1].priority - a[1].priority)
                /**
                 * Only take first N elements
                 */
                .slice(0, this.ELEMENTS_PER_TICK)
        );
    }

    /**
     * Returns a list of all entries in the queue.
     */
    protected entries() {
        return Array.from(this.#queue.entries());
    }

    /**
     * Sets the timer to activate the main loop.
     */
    private tryLoop() {
        clearTimeout(this.#timer);
        const nextLoopTime = Math.max(this.LOOP_FREQUENCY - (performance.now() - this.#lastTimeBusy), 0);
        this.#timer = setTimeout(this.loop.bind(this), nextLoopTime);
    }

    /**
     * The main loop of the scheduler.
     */
    private async loop() {
        if (!this.isRunning) return this.stop();
        if (this.#queue.size == 0) return this.unbusy();
        if (performance.now() - this.#lastTimeBusy < this.LOOP_FREQUENCY) return this.tryLoop();

        // Set the busy time to the current time.
        this.#lastTimeBusy = performance.now();

        for (const [key, entry] of this.nextEntries()) {
            if (entry.ignoreThisLoop) {
                entry.ignoreThisLoop = false;
                continue;
            }

            this.trySend(entry.value);
            entry.priority += 1;

            await sleep(this.INBETWEEN_DELAY);
        }

        return this.tryLoop();
    }

    /**
     * Add a ticket to the queue.
     */
    protected add(key: string, value: V, priority: number = DEFAULT_PRIORITY) {
        if (!this.isRunning) return Promise.reject("Scheduler running state was set to false.");

        // If thekey already exists, store the old value.
        const [previousResolve, previousReject] = this.#promiseAnswers.get(key) ?? [undefined, undefined];

        // If the key already exists, update the value and reset the priority.
        const entry = new Entry(value);
        entry.priority = priority;

        this.#queue.set(key, entry);

        // Update the busy state of the scheduler.
        if (!this.#busy) this.busy();

        // Create the promise for the ticket and link it with the old promise.
        const promise = new Promise((res: (v: boolean) => void, rej: (v: any) => void) => {
            this.#promiseAnswers.set(key, [res, rej]);
        })
            .then(previousResolve)
            .catch(previousReject);

        // Link the promise internally.
        this.#promises.set(key, promise);

        return promise;
    }

    /**
     * @todo
     */
    protected map(key: string, cb: (value: V) => V) {
        throw new Error("Unimplemented!");
    }

    /**
     * Check if a ticket exists in the queue.
     */
    protected has(key: string) {
        return this.#queue.has(key);
    }

    /**
     * Remove a ticket from the queue, and reject the original promise.
     */
    protected reject(k: string) {
        this.#queue.delete(k);
        const answer = this.#promiseAnswers.get(k);

        if (answer) {
            const [previousResolve, previousReject] = this.#promiseAnswers.get(k)!;
            previousReject("Ticket was removed from the queue:\n" + new Error().stack);
        }

        if (this.#queue.size == 0) this.unbusy();
    }

    /**
     * Remove a ticket from the queue, and accept the original promise.
     */
    protected receive(k: string) {
        this.#queue.delete(k);
        const answer = this.#promiseAnswers.get(k);

        if (answer) {
            const [previousResolve, previousReject] = this.#promiseAnswers.get(k)!;
            previousResolve(true);
        }

        if (this.#queue.size == 0) this.unbusy();
    }

    /**
     * Await till the entire queue is empty.
     */
    public async awaitEmpty() {
        return Promise.all([...this.#promises.values()]);
    }
}
