
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
import SystemMessageModule from './modules/system-command.js'
import WorldManagerModule from './modules/world-manager.js'
import StartModule from "./modules/start.js"
import { GamePlayerModule, BasePlayerModule } from "./modules/player-manager.js"

import BlockScheduler from './scheduler/scheduler-block.js'
import { BlockMappings } from './data/mappings.js'
import { PlayerArray, GamePlayerArray } from './types/player-ds.js'

/**
 * @class Client
 */
export default class Client extends EventEmitter<LibraryEvents> {
    #isConnected = false
    #pocketbase: PocketBase
    #socket: WebSocket | null

    #command: EventEmitter<{[keys: string]: [[Player, ...string[]]]}> = new EventEmitter()
    #command_permissions: [string, (p: Player) => boolean][] = []

    public readonly raw: EventEmitter<RawGameEvents> = new EventEmitter()
    public readonly system: EventEmitter<SystemMessageEvents> = new EventEmitter()

    public readonly block_scheduler: BlockScheduler
    
    public self: SelfPlayer | null = null
    public world: World | null = null
    
    public chatPrefix: string | undefined
    public cmdPrefix: string[] = ['!', '.']

    readonly #players: GamePlayerArray<true>
    readonly #globalPlayers: PlayerArray<PlayerBase, true>

    /**
     * Create a new Client instance, by logging in with a token.
     * @param {string} token The token which is used to sign into pocketbase.
     * @example This is a standart way of creating a new Client instance
     * ```ts
     * import 'dotenv/config'
     * const client = new Client({ token: process.env.TOKEN as string })
     * ```
     */
    constructor(args: { token: string });

    /**
     * Create a new Client instance, by logging in with a username and a password.
     * @param {string} user Username
     * @param {string} pass Password
     * @example
     * ```ts
     * import 'dotenv/config'
     * const client = new Client({ user: 'user@example.com', pass: 'PixieWalkie' })
     * ```
     */
    constructor(args: { user: string, pass: string });

    constructor(args: { token?: string, user?: string, pass?: string }) {
        super()

        this.#pocketbase = new PocketBase(`https://${API_ACCOUNT_LINK}`)
        this.#socket = null

        this.#players = new GamePlayerArray<true>()
        this.#globalPlayers = new PlayerArray<PlayerBase, true>()

        if (args.token) {
            if (typeof args.token != 'string') throw new Error('Token should be of type string')
            this.#pocketbase.authStore.save(args.token, { verified: true })
            if (!this.#pocketbase.authStore.isValid) throw new Error('Invalid Token')
        } else if (args.user && args.pass) {
            if (typeof args.user != 'string' || typeof args.pass != 'string') throw new Error('Username and password should be of type string')
            this.#pocketbase.collection('users').authWithPassword(args.user, args.pass)
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
     * Connect client instance to a room with default room type. 
     * @param {string} world_id The identifier of the room to connect to.
     * @example
     * ```ts
     * const client = new Client({ token })
     * client.connect('r450e0e380a815a') // Connect to the room: https://pixelwalker.net/world/r450e0e380a815a
     * ```
     */
    public connect(world_id: string): Promise<this>

    /**
     * Connect client instance to a room of a particular room type.
     * @param {string} world_id The identifier of the room to connect to.
     * @param {string} room_type The room type of the world. Is always [one of the following](https://game.pixelwalker.net/listroomtypes1)
     */
    public connect(world_id: string, room_type: typeof RoomTypes[0]): Promise<this>

    public async connect(world_id: string, room_type?: typeof RoomTypes[0]): Promise<this> {
        if (world_id == undefined) throw new Error('`world_id` was not provided in `Client.connect()`')
        if (room_type && !RoomTypes.includes(room_type)) throw new Error(`\`room_type\` expected to be one of ${RoomTypes}, got \`${room_type}\``)
        if (!room_type) room_type = RoomTypes[0]
        if (this.#pocketbase == null) throw new Error('Can\'t connect to a world without having pocketbase data.')

        const { token } = await this.#pocketbase.send(`/api/joinkey/${room_type}/${world_id}`, {})

        try {
            this.#socket = new WebSocket(`wss://${API_ROOM_LINK}/room/${token}`)
            this.#socket.binaryType = 'arraybuffer'
        } catch (e) {
            throw new Error('Socket failed to connect.')
        }

        this.#socket.on('message', (event) => this.receive_message(Buffer.from(event as WithImplicitCoercion<ArrayBuffer>)))
        this.#socket.on('error', (err) => { this.emit('error', [err]); this.disconnect() })
        this.#socket.on('close', (code, buffer) => { this.emit('close', [code, buffer.toString('ascii')]); this.disconnect() })

        this.#isConnected = true

        this.block_scheduler.start()
        
        this.include(BotCommandModule(this.#command))
        this.include(ChatModule)
        this.include(SystemMessageModule)
        this.include(WorldManagerModule)
        
        this.include(StartModule(this.#players))
        this.include(GamePlayerModule(this.#players))
        this.include(BasePlayerModule(this.#globalPlayers))

        return this
    }

    /**
     * This function is called when a message is received from the server.
     * @param {Buffer} buffer The bytes that are received.
     * @returns {boolean} Returns true if the bytes were successfully processed, `false` otherwise.
     */
    private receive_message(buffer: Buffer): boolean {
        if (buffer[0] == 0x3F) { // 63
            this.send(Magic(0x3F))
            return true
        }

        if (buffer[0] == 0x6B) { // 107
            let [event_id, offset] = read7BitInt(buffer, 1)
            const event_name = Object.entries(MessageType).find((k) => k[1] == event_id)?.[0] as keyof RawGameEvents
            const data = deserialise(buffer, offset)

            if (event_name == undefined) {
                console.warn((`Unknown event type ${event_id}. API may be out of date. Deserialised: ${data}`))
                return false
            }

            this.raw.emit('*', [event_name, ...data])

            return this.raw.emit(event_name, data as any)
        }

        this.emit('error', [new Error(`Unknown header byte received: got ${buffer[0]}, expected 63 or 107.`)])

        return false
    }

    /**
     * Wait in the local thread for a numeric value of miliseconds.
     * The numeric magic constant 5 is chosen as an estimate 
     */
    public wait(condition?: number): Promise<void> {
        return new Promise(res => setTimeout(res, condition || 5))
    }

    /**
     * Connection state of the client. Returns true, if the client is currently holding an active connection.
     * @example
     * ```ts
     * const client = new Client({ token })
     * console.log('Before Connection:', client.connected) // false
     * await client.connect(world_id)
     * console.log('After Connection:', client.connected) // true
     * ```
     */
    public get connected(): boolean {
        return this.#isConnected == true
    }

    /**
     * @example
     * ```ts
     * const client = new Client({ token })
     * await client.connect(world_id)
     * client.disconnect()
     * ```
     */
    public disconnect() {
        this.#isConnected = false
        this.block_scheduler.stop(true)
        this.#pocketbase?.authStore.clear()
        this.#socket?.close()
    }

    /**
     * @todo
     */
    get players(): GamePlayerArray<false> {
        return this.#players.immut() as GamePlayerArray<false>
    }

    /**
     * @todo
     */
    get globalPlayers(): PlayerArray<PlayerBase, false> {
        return this.#globalPlayers.immut()
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
     * @example
     * ```ts
     * import { MessageType, Type } from "pixelwalker.js"
     * const { Bit7, Magic, Boolean, Int32, Double, String } = Type
     * 
     * client.send(Magic(0x6B), Bit7(MessageType['chatMessage']), String('Hello, World!'))
     * client.send(Magic(0x6B), Bit7(MessageType['playerGodMode']), Boolean(true))
     * ```
     */
    public send(...args: Buffer[]): Promise<any | undefined> {
        if (!this.connected) return Promise.reject("Client not connected, but `send` was called.")
        return new Promise((res, rej) => {
            if (!this.#socket) throw new Error('Socket not existing.')
            if (this.#socket.readyState != this.#socket.OPEN) throw new Error('Socket not connected.')
            const buffer = Buffer.concat(args)
            this.#socket.send(buffer, {}, (err: any) => {
                if (err) return rej(err)
                res(true)
            })
        })
    }

    /**
     * Register a command with permission checking. If the command returns a string value it is privately messaged to the person who executed the command.
     * @example
     * ```ts
     * client.onCommand('god_all', p => p.isAdmin, ([player, _, state]) => {
     *     let s = state == 'true'
     *     let l = client.players.forEach(q => q.god(s)).length
     *     return s ? `${s ? 'Gave to' : 'Took from'} ${n} players god mode.`
     * })
     * ```
     */
    public onCommand(cmd: string, permission_check: (player: Player) => boolean, callback: (args: [Player, ...string[]]) => (Promise<any> | any)): this

    /**
     * Register a (global use) command. If the command returns a string value it is privately messaged to the person who executed the command.
     * @example
     * ```ts
     * client.onCommand('edit', ([player, _, state]) => {
     *     let s = state == 'true'
     *     player.edit(s)
     * })
     * ```
     */
    public onCommand(cmd: string, callback: (args: [Player, ...string[]]) => (Promise<any> | any)): this;

    public onCommand(cmd: string, cb1: ((p: Player) => boolean) | ((args: [Player, ...string[]]) => (Promise<any> | any)), cb2?: (args: [Player, ...string[]]) => (Promise<any> | any)): this {
        if (cb2 == undefined)
            return this.onCommand(cmd, () => true, cb1 as ((args: [Player, ...string[]]) => (Promise<any> | any)))

        this.#command_permissions.push([cmd, cb1 as (player: Player) => boolean])

        this.#command.on(cmd, async (args: [Player, ...string[]]) => {
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
            const list = this.#command_permissions
                .filter(([pl, cb]) => cb(player))
                .map(([p]) => this.cmdPrefix[0] + p)
                .filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates: https://stackoverflow.com/a/14438954/16002144
                .join(' ')
            return list.length > 0 ? list : undefined
        })
        return this
    }

    setChatPrefix(prefix: string) {
        this.chatPrefix = prefix
        return this
    }

    registerCommandPrefix(allowed: string[]) {
        this.cmdPrefix = allowed
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

    public say(content: string): void;
    public say(preamble: string, content: string): void;
    public say(preamble: string, content?: string) {
        if (content == undefined)
            return this.say(this.chatPrefix || '', preamble)
        return this.self?.say(preamble, content)
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
