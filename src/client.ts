
import PocketBase from 'pocketbase'
import WebSocket from 'ws'
import { EventEmitter } from 'events'

import RoomTypes from './data/room_types.js'

import { read7BitInt, deserialise } from './math.js'
import { MessageType, API_ACCOUNT_LINK, API_ROOM_LINK, LibraryEvents, RawGameEvents, SystemMessageEvents } from './data/consts.js'
import { Magic } from './types.js'
import Block, { BlockIdentifier } from './types/block.js'
import Player, { PlayerBase, SelfPlayer } from './types/player.js'

import World from './types/world.js'
import Structure from './types/structure.js'

import BotCommandModule from './modules/bot-command.js'
import ChatModule from './modules/chat.js'
import PlayerManagerModule from './modules/player-manager.js'
import InitModule from './modules/start.js'
import SystemMessageModule from './modules/system-command.js'
import WorldManagerModule from './modules/world-manager.js'

import BlockScheduler from './scheduler/scheduler-block.js'
import { BlockMappings } from './data/mappings.js'

export default class Client extends EventEmitter<LibraryEvents> {
    private isConnected = false

    private pocketbase: PocketBase

    private readonly command: EventEmitter<{[keys: string]: [[Player, ...string[]]]}> = new EventEmitter()
    private command_permissions: [string, (p: Player) => boolean][] = []

    public readonly raw: EventEmitter<RawGameEvents> = new EventEmitter()
    public readonly system: EventEmitter<SystemMessageEvents> = new EventEmitter()

    public block_scheduler: BlockScheduler
    
    private socket: WebSocket | null
    public self: SelfPlayer | null
    public world: World | null
    
    public chatPrefix: string
    public cmdPrefix: string[]

    public readonly players: Map<number, Player> = new Map()
    public readonly globalPlayers: Map<string, PlayerBase> = new Map()

    constructor(args: { token?: string });
    constructor(args: { user?: string, pass?: string });
    constructor(args: { token?: string, user?: string, pass?: string }) {
        super()

        this.pocketbase = new PocketBase(`https://${API_ACCOUNT_LINK}`)
        this.socket = null
        this.self = null
        this.world = null

        this.chatPrefix = ''
        this.cmdPrefix = ['.', '!']

        if (args.token) {
            if (typeof args.token != 'string') throw new Error('Token should be of type string')
            this.pocketbase.authStore.save(args.token, { verified: true })
            if (!this.pocketbase.authStore.isValid) throw new Error('Invalid Token')
        } else if (args.user && args.pass) {
            if (typeof args.user != 'string' || typeof args.pass != 'string') throw new Error('Username and password should be of type string')
            this.pocketbase.collection('users').authWithPassword(args.user, args.pass)
        } else {
            throw new Error('Invalid attempt to connect with pocketbase client.')
        }

        this.block_scheduler = new BlockScheduler(this)

        // On process interrupt, gracefully disconnect.
        // DO NOT merge this into one function, otherwise it does not work.
        process.on('SIGINT', (signal) => this.disconnect())
        // Print unhandled promises after termination
        process.on("unhandledRejection", (error) => console.error(error));
    }

    /**
     * Connect client to server
     */
    public connect(world_id: string | undefined): Promise<Client>
    public connect(world_id: string | undefined, room_type: typeof RoomTypes[0]): Promise<Client>
    public async connect(world_id: string, room_type?: typeof RoomTypes[0]): Promise<Client> {
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

        this.socket.on('message', (event) => this.receive_message(Buffer.from(event as WithImplicitCoercion<ArrayBuffer>)))
        this.socket.on('error', (err) => { this.emit('error', [err]); this.disconnect() })
        this.socket.on('close', (code, buffer) => { this.emit('close', [code, buffer.toString('ascii')]); this.disconnect() })

        this.isConnected = true

        this.block_scheduler.start()
        
        this.include(BotCommandModule(this.command))
        this.include(ChatModule)
        this.include(PlayerManagerModule)
        this.include(InitModule)
        this.include(SystemMessageModule)
        this.include(WorldManagerModule)

        return this
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
     * Connection state of the client, value from readonly `isConnected`.
     */
    public get connected(): boolean {
        return this.isConnected == true
    }

    /**
     * Disconnect client from server
     */
    public disconnect() {
        this.isConnected = false
        this.block_scheduler.stop(true)
        this.pocketbase?.authStore.clear()
        this.socket?.close()
    }

    /**
     * Include Event handler from another client instance. This function
     * gets the event calls from `client` and a links them to `this`
     */
    public include<T>(callback: (c: Client) => Client & T): Client & T;
    public include<T>(module: { module: (c: Client) => Client & T }): Client & T;
    public include<T>(callback: ((c: Client) => Client & T) | { module: (c: Client) => Client & T }): Client & T {
        if (typeof callback == 'function')
            return callback(this) || this
        else
            return callback.module(this)
            // return this.include(() =>callback.module(this))
    }

    /**
     * Send raw bytes to server
     */
    public send(...args: Buffer[]): Promise<any | undefined> {
        if (!this.connected) return Promise.reject("Client not connected, but `send` was called.")
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

    /** Set a wrapped event listener for a command with a permission check and a callback. If callback returns string, privately message. */
    public onCommand(cmd: string, permission_check: (player: Player) => boolean, callback: (args: [Player, ...string[]]) => (Promise<any> | any)): Client;
    /** Set a wrapped event listener for a command and a callback. Permission check is automatically true. If a string is returned, it is privately delivered to the user. If callback returns string, privately message. */
    public onCommand(cmd: string, callback: (args: [Player, ...string[]]) => (Promise<any> | any)): Client;
    /** Command Management Wrapper */
    public onCommand(cmd: string, cb1: ((p: Player) => boolean) | ((args: [Player, ...string[]]) => (Promise<any> | any)), cb2?: (args: [Player, ...string[]]) => (Promise<any> | any)): Client {
        if (cb2 == undefined)
            return this.onCommand(cmd, () => true, cb1 as ((args: [Player, ...string[]]) => (Promise<any> | any)))

        this.command.on(cmd, async (args: [Player, ...string[]]) => {
            if (!(cb1 as ((p: Player) => boolean))(args[0])) return
            const output = await cb2(args)
            if (typeof output == 'string')
                args[0].pm(output)
        })

        return this
    }

    /** Set an event listener for a help command, that will navigate through all registered commands and display the ones you can use. */
    registerHelpCommand(cmd: string) {
        this.onCommand(cmd, () => true, ([player]) => {
            const list = this.command_permissions
                .filter(([pl, cb]) => cb(player))
                .map(([p]) => this.cmdPrefix[0] + p)
                .join(' ')
            return list
        })
        return this
    }

    // TODO
    public block(x: number, y: number, layer: 0 | 1, block: number | null | keyof typeof BlockMappings, ...args: any[]): Promise<boolean>
    public block(x: number, y: number, layer: 0 | 1, block: Block): Promise<boolean>
    public block(x: number, y: number, layer: 0 | 1, block: BlockIdentifier, ...args: any[]): Promise<boolean> {
        if (block == null) block = 0
        if (typeof block == 'string' || typeof block == 'number') {
            block = new Block(block)
            block.data.push(...args)
        } else if (!(block instanceof Block))
            return Promise.reject("Expected `Block` or block identifier, got unknown object.")

        return this.world?.put_block(x, y, layer, block) || Promise.reject('The `client.world` object was not loaded.')
    }

    public say(content: string) {
        return this.self?.say(this.chatPrefix + content)
    }

    public god(value: boolean, mod_mode: boolean) {
        return this.self?.[mod_mode ? 'set_mod' : 'set_god'](value)
    }

    public face(value: number) {
        return this.self?.set_face(value)
    }

    public move(x: number, y: number, xVel: number, yVel: number, xMod: number, yMod: number, horizontal: -1 | 0 | 1, vertical: -1 | 0 | 1, space_down: boolean, space_just_down: boolean) {
        return this.self?.move(x, y, xVel, yVel, xMod, yMod, horizontal, vertical, space_down, space_just_down)
    }

    public fill(xt: number, yt: number, fragment: Structure, args?: { animation?: (b: any) => any, ms?: number, write_empty?: boolean }) {
        return this.world?.paste(xt, yt, fragment, args)
    }
}
