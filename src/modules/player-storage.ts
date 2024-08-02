import Client from '../client.js'
import { PlayerBase } from '../types/index.js'
import { PlayerArray } from '../types/list/player.js'

import fs from 'node:fs'
import YAML from 'yaml'
import util from 'util'

const wrapperTag: symbol = Symbol('playerWrapper')

type Wrapper<P> = P & { [wrapperTag: symbol]: P }
type PlayerArrayFields<P extends PlayerBase> = { [k in keyof PlayerArray<P, true>]: any }

export default class PlayerStorage<P extends PlayerBase, K extends PlayerBase = P> implements PlayerArrayFields<P> {
    #PT: new(p: K) => P
    #wrapValues: Wrapper<P>[]
    #rawValues: P[]

    public readonly path
    
    constructor(path: string, ClassT: new(p: K) => P, default_array: P[] = []) {
        this.path = path
        this.#PT = ClassT
        this.#wrapValues = []
        this.#rawValues = []

        if (fs.existsSync(this.path)) {
            this.load()
        } else {
            this.push(...default_array)
        }
    }

    public module(client: Client): Client {
        return client
    }

    public load() {
        // console.log('load')
        this.#rawValues = YAML.parse(fs.readFileSync(this.path).toString('ascii')) as P[]
        this.#wrapValues = this.#rawValues.map(p => this.get_wrapper(p))
    }

    public save() {
        // console.log('save')
        fs.writeFileSync(this.path, YAML.stringify(this.#rawValues))
    }

    private get_wrapper(entry: P): Wrapper<P> {
        const that = this

        const wrap: any = {
            [util.inspect.custom]: () => `StorageWrapper[${this.#PT.name}, cuid='${entry.cuid}']`,
            [wrapperTag]: entry
        }

        for (const key in entry) {
            const value = entry[key]

            // Is a primitive type 
            if ((typeof value !== 'object' && typeof value !== 'function') || value === null) {
                Object.defineProperty(wrap, key, {
                    get: () => {
                        // console.log('wrap getter')
                        that.load()
                        const p = this.#rawValues.find(k => k.cuid == entry.cuid)
                        if (!p) return null
                        return p[key]
                    },
                    set: (value: any) => {
                        // console.log(`Set was called on player ${entry.username} with key ${key}`)
                        that.load()
                        const p = this.#rawValues.find(k => k.cuid == entry.cuid)
                        if (!p) return
                        p[key] = value
                        that.save()
                    }
                })
            }

            // If, is object
            // TODO should it be deep keys wrapping?
        }

        return wrap as Wrapper<P>
    }

    //
    // Custom Implementation
    //
    
    public none<P extends PlayerBase>() {
        return new PlayerArray([] as P[], false)
    }

    public is_mut(): true {
        return true
    }

    get length(): number {
        return this.#rawValues.length
    }

    public map<Z>(callback: (p: P) => Z): Z[] {
        this.load()
        return this.#rawValues.map(callback)
    }

    public forEach(callback: (p: P) => void) {
        this.load()
        this.#wrapValues.forEach(callback)
        return this
    }

    public join(separator: string = ', ', startWith: string = '', endWith: string = ''): string {
        this.load()
        for (let i = 0; i < this.length; i++)
            startWith += (i == 0 ? '' : separator) + this.#rawValues[i].username
        return startWith + endWith
    }

    public every(callback: (p: P) => boolean) {
        this.load()
        return this.#rawValues.every(callback)
    }

    public filter(predicate: (value: P, index: number) => boolean) {
        this.load()
        const playerArray = new PlayerArray<Wrapper<P>, true>([], true)
        for (let i = 0; i < this.length; i++) {
            if (predicate(this.#rawValues[i], i))
                playerArray.push(this.#wrapValues[i])
        }
        return playerArray.immut()
    }

    /**
     * Find the first player that matches the predicate.
     */
    public find(callback: (p: P) => boolean): P | undefined {
        this.load()
        for (let i = 0; i < this.length; i++) {
            if (callback(this.#rawValues[i]))
                return this.#wrapValues[i]
        }
    }

    /**
     * Determines wether a player object is in the array or not.
     */
    public includes(searchElement: P) {
        this.load()
        for (let i = 0; i < this.length; i++) {
            if (this.#rawValues[i].cuid == searchElement.cuid)
                return this.#wrapValues[i]
        }
    }

    /**
     * Accumulates a result over all player entries and returns.
     */
    public reduce<Z>(callback: (previousValue: Z, currentValue: P, currentIndex: number, array: P[]) => Z, initialValue: Z): Z {
        this.load()
        return this.#rawValues.reduce<Z>(callback, initialValue)
    }

    /**
     * Accumulates a result over all player entries and returns, starting from the right.
     */
    public reduceRight<Z>(callback: (previousValue: Z, currentValue: P, currentIndex: number, array: P[]) => Z, initialValue: Z): Z {
        this.load()
        return this.#rawValues.reduceRight<Z>(callback, initialValue)
    }

    /**
     * Reverse the order of entries in the player array.
     */
    public reverse() {
        this.load()
        this.#rawValues = this.#rawValues.reverse()
        this.#wrapValues = this.#wrapValues.reverse()
        return this
    }

    /**
     * Determines whether the specified callback function returns true for any element of an array.
     */
    public some(callback: (p: P) => boolean) {
        this.load()
        return this.#rawValues.some(callback)
    }

    /**
     * Sort players with comparator lambda.
     */
    public sort(compareFn: ((a: P, b: P) => number) = ((player1, player2) => parseInt(player1.username, 36) - parseInt(player2.username, 36))) {
        this.load()
        const combination: [P, Wrapper<P>][] = this.#rawValues
            .map((v, i) => [v, this.#wrapValues[i]])
        combination.sort(([a, aw], [b, bw]) => compareFn(a, b))
        return new PlayerArray(combination.map(([a, wrap]) => wrap), true)
    }

    /**
     * Shuffle array
     */
    public shuffle() {
        return this.sort(() => Math.random() - 0.5)
    }

    /**
     * Sort by attribute or mapping of players
     */
    public sortBy<Z extends string | number | boolean>(callback: (p: P) => Z) {
        return this.sort((p1, p2) => {
            const m1 = callback(p1),
                m2 = callback(p2)

            if (Number.isInteger(m1))
                return m1 as number - (m2 as number)
            else if (m1 == true || m1 == false)
                return (m1 ? 2 : 1) - (m2 ? 2 : 1)
            return (m1 as string).localeCompare(m2 as string)
        })
    }

    /**
     * Returns an iterable over all players.
     */
    public values() {
        this.load()
        return this.#wrapValues.values()
    }

    [Symbol.iterator]() {
        this.load()
        let idx = 0, data = this.#wrapValues
        return {
            next: () => ({
                value: data[idx++],
                done: idx >= data.length
            })
        }
    }

    /**
     * Get the first element
     */
    public first() {
        this.load()
        if (this.#wrapValues.length == 0) return
        return this.#wrapValues[0]
    }

    /**
     * Get the last element
     */
    public last() {
        this.load()
        if (this.#wrapValues.length == 0) return
        return this.#wrapValues[this.length - 1]
    }

    /**
     * Get player by public cuid
     */
    public byCuid(cuid: string) {
        return this.find(p => p.cuid == cuid)
    }

    /**
     * Get player by username
     */
    public byUsername(username: string): P | undefined {
        return this.find(p => p.username == username)
    }

    public random() {
        this.load()
        if (this.length == 0) return
        return this.#wrapValues[Math.floor(this.length * Math.random())]
    }

    public push(...items: P[]) {
        this.load()
        this.#rawValues.push(...items)
        this.#wrapValues.push(...items.map(p => this.get_wrapper(p)))
        this.save()
        return this as unknown as PlayerArray<P, true>
    }

    public filter_mut(predicate: (value: P, index: number) => boolean) {
        this.load()
        const combination = this.#rawValues
            .map((v, i) => [v, this.#wrapValues[i]] as [P, Wrapper<P>])
            .filter(([a, aw], i) => predicate(a, i))
        this.#rawValues = combination.map(([a, _]) => a)
        this.#wrapValues = combination.map(([_, aw]) => aw)
        return this as this
    }

    public remove_all(predicate: (value: P, index: number) => boolean) {
        this.filter_mut((v, i) => !predicate(v, i))
        return this.filter(predicate)
    }

    /**
     * Return an immutable copy of the class.
     */
    public immut() {
        this.load()
        return new PlayerArray(this.#rawValues, false)
    }

    /**
     * Returns a string representation of the player array.
     */
    public toString(keys: (keyof P)[] = ['username', 'cuid']): string {
        this.load()
        const mapper = (player: P) => keys.map((k, i) => i == 0 ? player[k] : `[${player[k]}]`).join('')
        return '[' + this.map(mapper).join(', ') + ']'
    }

    // https://stackoverflow.com/a/40699119/16002144
    public [util.inspect.custom](): string {
        return this.toString()
    }

    get [Symbol.toStringTag]() {
        return 'PlayerArray'
    }

    /**
     * Returns a copy of the array data.
     */
    public toArray(): Wrapper<P>[] {
        this.load()
        return new Array(...this.#wrapValues)
    }    
}

