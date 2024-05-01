
import PocketBase from 'pocketbase'
import WebSocket from 'ws'
import { EventEmitter } from 'events'

import { read7BitInt, deserialise } from './math.js'
import { HeaderTypes, MessageType, SpecialBlockData, API_ACCOUNT_LINK, API_ROOM_LINK, LibraryEvents, RawGameEvents } from './data/consts.js'
import { Magic, Bit7, String, Int32, Boolean, Double, Byte } from './types.js'
import { BlockMappings } from './data/mappings.js'
import World from './types/world.js'
import Block, { WorldPosition } from './types/block.js'
import Player from './types/player.js'
import { FIFO, RANDOM } from './types/animation.js'
import { RoomTypes } from './data/room_types.js'
import init_events from './events.js'

export default class Client extends EventEmitter<LibraryEvents> {
    public readonly raw: EventEmitter<RawGameEvents> = new EventEmitter()

    public connected = false

    private pocketbase: PocketBase | null
    private socket: WebSocket | null
    private debug: boolean

    public self: Player | null
    public world: World | undefined
    public cmdPrefix: string[]

    public readonly players: Map<number, Player> = new Map()

    private move_tick: number = 0
    private intervals: NodeJS.Timeout[] = []
    public block_queue: Map<`${number}.${number}.${0|1}`, Block> = new Map()

    constructor(args: { token?: string, user?: string, pass?: string, flags?: {}, debug?: boolean }) {
        super()

        this.pocketbase = null
        this.socket = null
        this.self = null
        this.world = undefined
        this.cmdPrefix = ['.', '!']

        if (args.token) {
            this.pocketbase = new PocketBase(`https://${API_ACCOUNT_LINK}`)
            if (typeof args.token != 'string') throw new Error('Token should be of type string')
            this.pocketbase.authStore.save(args.token, { verified: true })
            if (!this.pocketbase.authStore.isValid) throw new Error('Invalid Token')
        }

        if (args.user && args.pass) {
            throw new Error('Authentication with user and password not supported yet.')
        }

        if (args.flags) {
            // TODO ability to enable parts of the api
            // - 'serialize' = serialize the world and keep track of changes
            // - 'simulate' = do not simulate player movements and track pseudo events: coins collected
            // - ...
        }

        this.debug = args.debug || false

        // On process interrupt, gracefully disconnect.
        // DO NOT merge this into one function, otherwise it does not work.
        process.on('SIGINT', (signal) => this.disconnect())
    }

    /**
     * Connect client to server
     */
    public async connect(world_id: string, room_type?: string) {
        if (world_id == undefined) throw new Error('`world_id` was not provided in `Client.connect()`')
        if (room_type && !RoomTypes.includes(room_type)) throw new Error(`\`room_type\` expected to be one of ${RoomTypes}, got \`${room_type}\``)
        if (!room_type) room_type = RoomTypes[0]
        if (this.pocketbase == null) throw new Error('Can\'t connect to a world without having pocketbase data.')

        const { token } = await this.pocketbase.send(`/api/joinkey/${room_type}/${world_id}`, {})

        try {
            this.socket = new WebSocket(`wss://${API_ROOM_LINK}/room/${token}`)
            this.socket.binaryType = 'arraybuffer'
        } catch (e) {
            throw new Error('Socket failed to connect.')
        }

        this.socket.on('message', (event) => this.receive_message(Buffer.from(event as any)))
        this.socket.on('error', (err) => this.emit('error', [err]))
        this.socket.on('close', (code, buffer) => this.emit('close', [code, buffer]))

        this.connected = true

        this.intervals.push(setInterval(() => this.fill_block_loop(), 25))
        // this.fill_block_loop()

        init_events(this)
    }

    /**
     * This function is called when a message is received
     * from the server.
     */
    private async receive_message(buffer: Buffer) {
        if (buffer[0] == 0x3F) { // 63
            return await this.send(Magic(0x3F))
        }

        if (buffer[0] == 0x6B) { // 107
            let [event_id, offset] = read7BitInt(buffer, 1)
            const event_name = Object.entries(MessageType).find((k) => k[1] == event_id)?.[0] as keyof RawGameEvents
            const data = deserialise(buffer, offset)

            if (this.debug && buffer[1] != MessageType['playerMoved']) console.debug('Receive', event_name, data)

            if (event_name == undefined) {
                console.warn((`Unknown event type ${event_id}. API may be out of date. Deserialised: ${data}`))
                return
            }

            return this.raw.emit(event_name, data as any)
        }

        this.emit('error', [new Error(`Unknown header byte received: got ${buffer[0]}, expected 63 or 107.`)])
    }

    /**
     * This function is called by the internal block event loop
     * to automatically schedule block placement.
     */
    private async fill_block_loop() {
        let i, entry
        // console.log(this.block_queue)

        const entries = this.block_queue.entries()

        for (i = 0, entry = entries.next(); i < 400 && !entry.done; i++) {
            const [pos, block] = entry.value
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

            await this.send(Buffer.concat(buffer))

            entry = entries.next()
        }

        // setTimeout(this.fill_block_loop.bind(this), Math.max(2 * i, 50))
    }

    /**
     * Wait in the local thread for a numeric value of miliseconds.
     * The numeric magic constant 5 is chosen as an estimate 
     */
    public wait(condition?: number): Promise<void> {
        return new Promise(res => setTimeout(res, condition || 5))
    }

    /**
     * Busy-Wait in the local thread until the return value defined by
     * callback is non-undefined. This function forces to wait current
     * control flow till certain information is received.
     */
    public wait_for<WaitType>(condition: (() => WaitType | undefined)): Promise<WaitType> {
        const binder = (res: (v: WaitType) => void) => {
            let x: WaitType | undefined = condition()
            if (x) res(x)
            else binder.bind(res)
        }

        return new Promise(res => binder(res))
    }

    /**
     * Disconnect client from server
     */
    public disconnect() {
        if (this.debug) console.debug('Disconnect')
        this.intervals.forEach(i => clearInterval(i))
        this.pocketbase?.authStore.clear()
        this.socket?.close()
    }

    /**
     * Include Event handler from another client instance. This function
     * gets the event calls from `client` and a links them to `this`
     */
    public include(client: Client): Client {
        client.send = (...args) => this.send(...args)
        client.block_queue = this.block_queue

        for (const event_name of client.eventNames()) {
            // https://stackoverflow.com/questions/49177088/nodejs-eventemitter-get-listeners-check-if-listener-is-of-type-on-or-once
            let functions: (() => void)[] = (client as any)._events[event_name]
            if (typeof functions == 'function') functions = [functions]

            for (const listener of functions) {
                const is_once = listener.name.includes('onceWrapper')

                if (is_once)
                    this.once(event_name, listener.bind(this))
                else
                    this.on(event_name, listener.bind(this))
            }
        }
        return this
    }

    //
    //
    // Communication
    //
    //

    public send(...args: Buffer[]): Promise<any | undefined> {
        // if (this.debug && Buffer.concat(args)[0] != 0x3f) console.debug('Sending', Buffer.concat(args))

        return new Promise((res, rej) => {
            if (!this.socket) return rej(false)
            if (this.socket.readyState != this.socket.OPEN) return rej(false)
            const buffer = Buffer.concat(args)
            this.socket.send(buffer, {}, (err: any) => {
                if (err) return rej(err)
                res(true)
            })
        })
    }

    public say(content: string) {
        return this.send(Magic(0x6B), Bit7(MessageType['chatMessage']), String(content))
    }

    public async block(x: number, y: number, layer: 0 | 1, block: number | string | Block): Promise<true> {
        if (typeof block == 'string' || typeof block == 'number') block = new Block(block)
        if (!(block instanceof Block)) return Promise.resolve(true)

        this.block_queue.set(`${x}.${y}.${layer}`, block)

        const promise = (res: (v: any) => void, rej: (v: any) => void) => {
            if (!this.block_queue.get(`${x}.${y}.${layer}`)) {
                return res(true)
            }
            setTimeout(() => promise(res, rej), 5)
        }

        return new Promise(promise)
    }

    public god(value: boolean, mod_mode: boolean) {
        return this.send(Magic(0x6B), Bit7(MessageType[mod_mode ? 'playerModMode' : 'playerGodMode']), Boolean(value))
    }

    public face(value: number) {
        return this.send(Magic(0x6B), Bit7(MessageType['playerFace']), Int32(value))
    }

    public move(x: number, y: number, xVel: number, yVel: number, xMod: number, yMod: number, horizontal: -1 | 0 | 1, vertical: -1 | 0 | 1, space_down: boolean, space_just_down: boolean) {
        return this.send(
            Magic(0x6B), Bit7(MessageType['playerMoved']),
            Double(x), Double(y),
            Double(xVel), Double(yVel),
            Double(xMod), Double(yMod),
            Int32(horizontal), Int32(vertical),
            Boolean(space_down), Boolean(space_just_down),
            Int32(this.move_tick++)
        )
    }

    // TODO add types for animation header
    public async fill(xt: number, yt: number, world: World, args?: { animation?: (b: any) => any, write_empty?: boolean }) {
        if (!args) args = { write_empty: true }

        this.world = await this.wait_for(() => this.world)
        const to_be_placed: [WorldPosition, Block][] = []

        for (let x = 0; x < world.width; x++)
            for (let y = 0; y < world.height; y++) {
                if (!world.foreground[x][y] || !world.foreground[x][y].isSameAs(this.world.foreground[xt + x][yt + y])) {
                    if (!((world.blockAt(x, y, 1).name == 'empty') && !args.write_empty))
                        to_be_placed.push([[xt + x, yt + y, 1], world.blockAt(x, y, 1)])
                }
                if (!world.foreground[x][y] || !world.background[x][y].isSameAs(this.world.background[xt + x][yt + y])) {
                    if (!((world.blockAt(x, y, 0).name == 'empty') && !args.write_empty))
                        to_be_placed.push([[xt + x, yt + y, 0], world.blockAt(x, y, 0)])
                }
            }

        // TODO const generator = (args.animation || FIFO)(to_be_placed)
        const generator = RANDOM(to_be_placed)

        while (to_be_placed.length > 0) {
            const yielded = generator.next()
            const [[x, y, layer], block]: any = yielded.value
            await this.block(x, y, layer, block)
            await this.wait()
        }
    }
}
