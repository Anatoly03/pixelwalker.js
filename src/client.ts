
import PocketBase from 'pocketbase'
import WebSocket from 'ws'
import { EventEmitter } from 'events'

import RoomTypes from './data/room_types.js'

import { read7BitInt, deserialise } from './math.js'
import { API_ACCOUNT_LINK, API_ROOM_LINK, LibraryEvents, SystemMessageEvents, RawGameEvents } from './data/consts.js'
import { Bit7, Magic, String } from './types/message-bytes.js'
import Block, { BlockIdentifier } from './types/block.js'
import Player, { PlayerBase, SelfPlayer } from './types/player.js'

import World from './types/world.js'
import Structure from './types/structure.js'

import BotCommandModule from './modules/bot-command.js'
import ChatModule from './modules/chat.js'
import SystemMessageModule from './modules/system-command.js'
import WorldManagerModule from './modules/world-manager.js'
import StartModule from "./modules/start.js"
import { GamePlayerModule } from "./modules/player-manager.js"

import BlockScheduler from './scheduler/scheduler-block.js'
import { BlockMappings } from './data/mappings.js'
import { PlayerArray, GamePlayerArray } from './types/player-ds.js'
import { PublicProfile } from './types/player.profile.js'
import { MessageTypes } from './data/message_types.js'

/**
 * @example Snake Tail
 * ```ts
 * import Client from 'pixelwalker.js'
 * const client = new Client({ token })
 * 
 * client.on('start', () => client.say('🤖 Connected!'))
 * 
 * const blocks = ['glass_red', 'glass_orange', 'glass_yellow', 'glass_green', 'glass_cyan', 'glass_blue', 'glass_purple', 'glass_magenta', 0]
 * 
 * client.on('player:block', async ([player, pos, block]) => {
 *     if (block.name == 'empty') return
 *     if (!blocks.includes(block.name)) return
 * 
 *     await client.wait(250)
 *     client.block(pos[0], pos[1], pos[2], blocks[blocks.indexOf(block.name) + 1])
 * })
 * 
 * client.connect(world_id)
 * ```
 */
export default class Client extends EventEmitter<LibraryEvents> {
    /**
     * Get an array of message types sequenced integer → message name
     * 
     * @example
     * 
     * ```ts
     * import Client from 'pixelwalker.js'
     * 
     * console.log(Client.MessageTypes); 
     * ```
     * 
     * Which will print out the following in version
     * ```json
     * ["PlayerInit","UpdateRights","WorldMetadata","WorldCleared","WorldReloaded","WorldBlockPlaced","ChatMessage","OldChatMessages","SystemMessage","PlayerJoined","PlayerLeft","PlayerMoved","PlayerTeleported","PlayerFace","PlayerGodMode","PlayerModMode","PlayerRespawn","PlayerReset","PlayerTouchBlock","PlayerTouchPlayer","PlayerEffect","PlayerRemoveEffect","PlayerResetEffects","PlayerTeam","PlayerCounters","PlayerLocalSwitchChanged","PlayerLocalSwitchReset","GlobalSwitchChanged","GlobalSwitchReset","PlayerPrivateMessage"]
     * ```
     */
    static MessageTypes: typeof MessageTypes = MessageTypes;

    /**
     * Get the id for the message. This can then be used with `Magic` to send the proper event header.
     * 
     * @example
     * 
     * ```ts
     * import Client from 'pixelwalker.js'
     * 
     * client.send(Client.MessageId('PlayerInit'));
     * ```
     */
    static MessageId<Index extends number, MessageType extends (typeof MessageTypes)[Index]>(messageName: MessageType): Index {
        return this.MessageTypes.findIndex(m => m === messageName)! as Index;
    }

    /**
     * 
     */

    /**
     * Connection State Marker
     */
    #isConnected = false

    /**
     * PocketBase API
     */
    #pocketbase: PocketBase

    /**
     * Client's API Connection target
     */
    #linkApiAccount = API_ACCOUNT_LINK

    /**
     * Client's Room Connection Target
     */
    #linkApiRoom = API_ROOM_LINK

    /**
     * Socket that connects with the game
     */
    #socket: WebSocket | null

    /**
     * All registered commands.
     */
    #command: EventEmitter<{ [keys: string]: [[Player, ...string[]]] }> = new EventEmitter()

    /**
     * All registered command permissions
     */
    #command_permissions: [string, (p: Player) => boolean][] = []

    /**
     * @todo @ignore { [keys: (typeof MessageTypes)[number] | '*']: (string | number | boolean | Uint8Array)[] }
     */
    public readonly raw: EventEmitter<RawGameEvents> = new EventEmitter()

    /**
     * @ignore @todo
     */
    public readonly system: EventEmitter<SystemMessageEvents> = new EventEmitter()

    /**
     * @ignore
     */
    public readonly block_scheduler: BlockScheduler

    /**
     * If the client is connected, stores a reference to the player instance, which the client controls.
     */
    public self: SelfPlayer | undefined

    /**
     * @todo
     */
    public world: World | undefined

    /**
     * @ignore Command prefici which the bot respond to
     */
    public cmdPrefix: string[] = ['!', '.']

    /**
     * @ignore Stores the chat prefix which the bot uses to append to messages.
     */
    public chatPrefix: string | undefined

    /**
     * @todo
     */
    readonly #players: GamePlayerArray<true>

    /**
     * @todo
     */
    readonly #profiles: PlayerArray<PublicProfile, true>

    /**
     * Create a new Client instance, by logging in with a token.
     * @param {{token:string}} args The object holding the token which is used to sign into pocketbase.
     * @example
     * This is a standart way of creating a new Client instance
     * ```ts
     * import 'dotenv/config'
     * const client = new Client({ token: process.env.TOKEN as string })
     * ```
     */
    constructor(args: { token: string });

    /**
     * Create a new Client instance, by logging in with data defined in the 
     * @param {NodeJS.ProcessEnv} args The constant `process.env`
     * @example
     * This is a standart way of creating a new Client instance
     * ```ts
     * import 'dotenv/config'
     * const client = new Client(process.env)
     * ```
     */
    constructor(args: NodeJS.ProcessEnv);

    /**
     * Create a new Client instance, by logging in with a username and a password.
     * @param {{user:string, pass:string}} args The object holding the username and password which are used to sign into pocketbase.
     * @example
     * ```ts
     * import 'dotenv/config'
     * const client = new Client({ user: 'user@example.com', pass: 'PixieWalkie' })
     * ```
     */
    constructor(args: { user: string, pass: string });

    constructor(args: { token?: string, user?: string, pass?: string }) {
        super()

        this.#pocketbase = new PocketBase(`https://${this.#linkApiAccount}`)
        this.#socket = null

        this.#players = new GamePlayerArray<true>()
        this.#profiles = new PlayerArray<PublicProfile, true>()

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

        this.include(BotCommandModule(this.#command))
        this.include(ChatModule)
        this.include(SystemMessageModule)
        this.include(WorldManagerModule)

        this.include(StartModule(this.#players))
        this.include(GamePlayerModule(this.#players))

        // On process interrupt, gracefully disconnect.
        // DO NOT merge this into one function, otherwise it does not work.
        process.on('SIGINT', (signal) => this.disconnect())
        // Print unhandled promises after termination
        process.on("unhandledRejection", (error) => console.error(error));
    }

    /**
     * Set local connection target to a different game server. 
     */
    public deroute(API_SERVER = '127.0.0.1:8090/api', GAME_SERVER = 'localhost:5148') {
        this.#linkApiAccount = API_SERVER
        this.#linkApiRoom = GAME_SERVER
        return this
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
            this.#socket = new WebSocket(`wss://${this.#linkApiRoom}/room/${token}`)
            this.#socket.binaryType = 'arraybuffer'
        } catch (e) {
            throw new Error('Socket failed to connect.')
        }

        this.#socket.on('message', (event) => this.receive_message(Buffer.from(event as WithImplicitCoercion<ArrayBuffer>)))
        this.#socket.on('error', (err) => { this.emit('error', [err]); this.disconnect() })
        this.#socket.on('close', (code, buffer) => { this.emit('close', [code, buffer.toString('ascii')]); this.disconnect() })

        this.#isConnected = true

        this.block_scheduler.start()

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
            const event_name = MessageTypes[event_id] as keyof RawGameEvents
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
     * 
     */
    public pocketbase() {
        return this.#pocketbase
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
     * @todo @ignore
     * @example
     * ```ts
     * client.players
     *   .filter(p => !p.god)
     *   .teleport(0, 0)
     * ```
     */
    get players(): GamePlayerArray<false> {
        return this.#players.immut() as GamePlayerArray<false>
    }

    /**
     * @todo @ignore
     */
    get profiles(): PlayerArray<PublicProfile, false> {
        return this.#profiles.immut()
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
     * import { MessageTypes, Type } from "pixelwalker.js"
     * const { Bit7, Magic, Boolean, Int32, Double, String } = Type
     * 
     * client.send(Magic(0x6B), Bit7(MessageTypes['chatMessage']), String('Hello, World!'))
     * client.send(Magic(0x6B), Bit7(MessageTypes['playerGodMode']), Boolean(true))
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
     * Register a help command. Creates an event listener for a help command, that will navigate through all registered commands and display the ones you have permissions to use.
     * @param cmd The help command, defaults to `help`
     * @returns {(client: Client): Client} Factory for a help command module
     * @example Module `HelpCommand`
     * ```ts
     * const client = new Client({ token })
     * client.include(Client.HelpCommand('cmds'))
     * ```
     */
    public static HelpCommand(cmd: string = 'help') {
        return (client: Client) => {
            client.onCommand(cmd, () => true, ([player]) => {
                const list = client.#command_permissions
                    .filter(([pl, cb]) => cb(player))
                    .map(([p]) => client.cmdPrefix[0] + p)
                    .filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates: https://stackoverflow.com/a/14438954/16002144
                    .join(' ')
                return list.length > 0 ? list : undefined
            })
            return client
        }
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

    /**
     * Set a global prefix that will be always appended to your chat messages.
     * @param {string} prefix 
     * @returns {this}
     * @example
     * ```ts
     * client.setChatPrefix('[BOT]')
     * ```
     */
    setChatPrefix(prefix: string): this {
        this.chatPrefix = prefix
        return this
    }

    /**
     * Set global allowed commands prefici that the API will listen to.
     * @param {string} prefix 
     * @returns {this}
     * @example
     * ```ts
     * client.registerCommandPrefix(['!', '\\', '...', ',,,,', '@'])
     * ```
     */
    registerCommandPrefix(allowed: string[]): this {
        this.cmdPrefix = allowed
        return this
    }

    public wait_block_queue(): Promise<any> {
        return this.block_scheduler.wait_till_emptied()
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

    /**
     * @param {string} content Write to chat
     */
    public say(content: string) {
        if (content.startsWith('/')) {
            return this.send(Magic(0x6B), Bit7(Client.MessageId('ChatMessage')), String(content))
        }

        let preamble = this.chatPrefix ? (this.chatPrefix + ' ') : ''

        const MESSAGE_SIZE = 120
        const CONTENT_ALLOWED_SIZE = MESSAGE_SIZE - preamble.length - (preamble.length > 0 ? 1 : 0)

        if (preamble.length > MESSAGE_SIZE)
            throw new Error('Chat preamble is larger than message size.')

        for (let i = 0; i < content.length; i += CONTENT_ALLOWED_SIZE) {
            const chunk = content.substring(CONTENT_ALLOWED_SIZE * i, Math.min(CONTENT_ALLOWED_SIZE * (i + 1), content.length))
            const separation_index = chunk.lastIndexOf(' ') // TODO regex
            if (chunk.trim().length == 0) return
            console.log(`Chunk ${i}/${content.length}: '${chunk}'`)
            this.send(Magic(0x6B), Bit7(Client.MessageId('ChatMessage')), String(preamble + chunk))
        }
    }

    /**
     * Wrapper for `client.self` methods
     */
    public god(value: boolean, mod_mode: boolean) {
        return this.self?.[mod_mode ? 'set_mod' : 'set_god'](value)
    }

    /**
     * Wrapper for `client.self.face()` method
     */
    public face(value: number) {
        return this.self?.set_face(value)
    }

    /**
     * Wrapper for `client.self.move()` method
     */
    public move(x: number, y: number, xVel: number, yVel: number, xMod: number, yMod: number, horizontal: -1 | 0 | 1, vertical: -1 | 0 | 1, space_down: boolean, space_just_down: boolean) {
        return this.self?.move(x, y, xVel, yVel, xMod, yMod, horizontal, vertical, space_down, space_just_down)
    }

    /**
     * @todo
     */
    public fill(xt: number, yt: number, fragment: Structure, args?: { animation?: (b: any) => any, ms?: number, write_empty?: boolean }) {
        return this.world?.paste(xt, yt, fragment, args)
    }
}
