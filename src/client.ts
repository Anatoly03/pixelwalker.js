
import PocketBase from 'pocketbase'
import WebSocket from 'ws'
import { EventEmitter } from 'events'

import { read7BitInt, deserialise } from './math.js'
import { HeaderTypes, MessageType, SpecialBlockData, API_ACCOUNT_LINK, API_ROOM_LINK, LibraryEvents, RawGameEvents } from './data/consts.js'
import { Magic, Bit7, String, Int32, Boolean, Double, Byte } from './types.js'
import { BlockMappings } from './data/mappings.js'
import World from './types/world.js'
import Block, { BlockIdentifier, WorldPosition } from './types/block.js'
import Player from './types/player.js'
import { FIFO, RANDOM } from './types/animation.js'
import { RoomTypes } from './data/room_types.js'
import init_events from './events.js'
import Scheduler from './types/scheduler.js'

export default class Client extends EventEmitter<LibraryEvents> {
    public connected = false

    public readonly raw: EventEmitter<RawGameEvents> = new EventEmitter()
    public scheduler: Scheduler = new Scheduler(this)

    private pocketbase: PocketBase | null
    private socket: WebSocket | null
    private debug: boolean

    public self: Player | null
    public world: World | undefined
    public cmdPrefix: string[]

    public readonly players: Map<number, Player> = new Map()

    private inclusions: Client[] = []

    private move_tick: number = 0


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

        // Print unhandled promises after termination
        process.on("unhandledRejection", (error) => {
            console.error(error); // This prints error with stack included (as for normal errors)
        });
    }

    /**
     * Connect client to server
     */
    public async connect(world_id: string, room_type?: typeof RoomTypes[0]) {
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
        this.socket.on('error', (err) => { this.emit('error', [err]); this.disconnect() })
        this.socket.on('close', (code, buffer) => { this.emit('close', [code, buffer.toString('ascii')]); this.disconnect() })

        this.connected = true

        this.ping_modules(client => client.socket = this.socket)

        this.scheduler.start()
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

            this.raw.emit('*', [event_name, ...data])

            return this.raw.emit(event_name, data as any)
        }

        this.emit('error', [new Error(`Unknown header byte received: got ${buffer[0]}, expected 63 or 107.`)])
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
        const promise = (res: (v: WaitType) => void, rej: (v: any) => void) => {
            let x: WaitType | undefined = condition()
            if (!this.connected) rej("Client not connected!")
            if (x) return res(x)
            // else binder.bind(res)
            setTimeout(() => promise(res, rej), 5)
        }

        return new Promise((res, rej) => promise(res, rej))
    }

    /**
     * Disconnect client from server
     */
    public disconnect() {
        if (this.debug) console.debug('Disconnect')
        this.connected = false
        this.scheduler.stop()
        this.pocketbase?.authStore.clear()
        this.socket?.close()
    }

    /**
     * Include Event handler from another client instance. This function
     * gets the event calls from `client` and a links them to `this`
     */
    public include(client: Client): Client {
        this.inclusions.push(client)

        client.scheduler = this.scheduler
        client.send = (...args) => this.send(...args)
        client.block = (...args) => this.block(...args)

        for (const event_name of client.eventNames()) {
            // https://stackoverflow.com/questions/49177088/nodejs-eventemitter-get-listeners-check-if-listener-is-of-type-on-or-once
            let functions: (() => void)[] = (client as any)._events[event_name]
            if (typeof functions == 'function') functions = [functions]

            for (const listener of functions) {
                if (listener.name.includes('onceWrapper'))
                    this.once(event_name, listener.bind(this))
                else
                    this.on(event_name, listener.bind(this))
            }
        }

        return this
    }

    public ping_modules(callback: (c: Client) => void) {
        this.inclusions.forEach(callback)
    }

    //
    //
    // Communication
    //
    //

    public send(...args: Buffer[]): Promise<any | undefined> {
        // if (this.debug && Buffer.concat(args)[0] != 0x3f) console.debug('Sending', Buffer.concat(args))

        return new Promise((res, rej) => {
            if (!this.socket) throw new Error('Socket not existing.')
            if (this.socket.readyState != this.socket.OPEN) throw new Error('Socket not connected.')
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

    public block(x: number, y: number, layer: 0 | 1, block: BlockIdentifier): Promise<boolean> {
        // if (!this.connected) return Promise.reject("Client not connected")
        if (typeof block == 'string' || typeof block == 'number') block = new Block(block)
        if (!(block instanceof Block)) return Promise.reject("Expected `Block` or block identifier, got unknown object.")
        if (!this.scheduler.running) { throw new Error('Scheduler is not defined.') }
        if (this.world?.[layer == 1 ? 'foreground' : 'background'][x][y]?.isSameAs(block)) return Promise.resolve(true)

        return this.scheduler.block([x, y, layer], block)
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

        const promises: Promise<boolean>[] = []
        // const promises_debug: Block[] = []

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

            const promise = this.block(x, y, layer, block)
            promise.catch(v => {
                throw new Error(v)
            })
            promises.push(promise)
            // promises_debug.push(block)
        }

        // for (let i = 0; i < promises.length; i++) {
        //     console.log(promises_debug[i], promises[i])
        // }

        return Promise.all(promises)
    }
}
