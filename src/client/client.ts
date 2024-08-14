
import PocketBase from 'pocketbase'
import { EventEmitter } from 'events'

import RoomTypes from '../data/room_types.js'

import { API_ACCOUNT_LINK, API_ROOM_LINK, LibraryEvents, RawGameEvents } from '../data/consts.js'
import { Bit7, Magic, String } from '../types/message-bytes.js'
import Block from '../types/world/block/block.js'

import Player from '../types/player/player.js'
import PlayerEventArray from '../types/player/events.js'

import World from '../types/world/world.js'
import Structure from '../types/world/structure.js'

import BotCommandModule from '../modules/bot-command.js'
import ChatModule from '../modules/chat.js'
// import SystemMessageModule from './modules/system-command.js'

import BlockScheduler from '../scheduler/scheduler-block.js'
import { BlockMappings, BlockMappingsReverse } from '../types/world/block/mappings.js'
import { PlayerArray, GamePlayerArray } from '../types/list/player.js'
import { PublicProfile } from '../types/player/profile.js'
import PaletteFix from '../types/world/block/palette_fix.js'
import SelfPlayer, { MoveArgs } from '../types/player/self.js'
import { BlockIdentifier, LayerId, Point } from '../types/index.js'
import Connection from './connection.js'

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
     * The list of all current block names (referred to as palette)
     * and their respective block id's.
     */
    static BlockMappings = BlockMappings

    /**
     * The list of all block id's and their respective palette.
     */
    static BlockMappingsReverse = BlockMappingsReverse

    /**
     * This stores a map of palette fixes for minor changes in
     * the format where old palette names are keys and their new names
     * are stores as a value. PixelWalker tends to name package names
     * in the format [package name] [block name], so `coin` was renamed
     * to `coin_gold` in v1.0.10 alpha. This function is primarily used
     * to fix palette names in the Structure file and to maintain old
     * code, which uses older naming styles.
     * 
     * @example 
     * 
     * Here is an example pattern with which you can convert any, even
     * out of date block names to a usable block id.
     * 
     * ```ts
     * function blockId(block_name: string): number {
     *     return Client.BlockMappings[Client.PaletteFix[block_name as keyof typeof Client.PaletteFix] ?? block_name];
     * }
     * ```
     * 
     * @ignore This is ignored because it's simply too large.
     */
    static PaletteFix = PaletteFix

    /**
     * PocketBase API
     */
    #pocketbase!: PocketBase

    /**
     * Game Connection
     */
    #connection!: Connection<boolean>

    /**
     * Client's API Connection target
     */
    #runningDevServer = false
    #linkApiRoom = API_ROOM_LINK

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
    // public readonly system: EventEmitter<SystemMessageEvents> = new EventEmitter()

    /**
     * @ignore
     */
    public readonly block_scheduler: BlockScheduler

    /**
     * If the client is connected, stores a reference to the player instance, which the client controls.
     */
    public self?: SelfPlayer

    /**
     * @todo
     */
    readonly #world = World.registerDynamicWorld(this)

    /**
     * @ignore Command prefici which the bot respond to
     */
    public cmdPrefix: string[] = ['!', '.']

    /**
     * Stores the chat prefix which the bot uses to append to messages.
     */
    #chatPrefix: string | undefined = undefined

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
     * const client = Client.new({ token: process.env.TOKEN as string })
     * ```
     */
    static async new(args: { token: string }): Promise<Client>;

    /**
     * Create a new Client instance, by logging in with data defined in the 
     * @param {NodeJS.ProcessEnv} args The constant `process.env`
     * @example
     * This is a standart way of creating a new Client instance
     * ```ts
     * import 'dotenv/config'
     * const client = Client.new(process.env)
     * ```
     */
    static new(args: NodeJS.ProcessEnv): Promise<Client>;

    /**
     * Create a new Client instance, by logging in with a username and a password.
     * @param {{user:string, pass:string}} args The object holding the username and password which are used to sign into pocketbase.
     * @example
     * ```ts
     * import 'dotenv/config'
     * const client = Client.new({ user: 'user@example.com', pass: 'PixieWalkie' })
     * ```
     */
    static new(args: { user: string, pass: string }): Promise<Client>;

    static async new(args: NodeJS.ProcessEnv | { token?: string, user?: string, pass?: string }): Promise<Client> {
        const client = new Client()
        client.#pocketbase = new PocketBase(`https://${API_ACCOUNT_LINK}`)
        client.#connection = new Connection<false>(client)

        if (args.token) {
            if (typeof args.token != 'string') throw new Error('Token should be of type string')
            client.#pocketbase.authStore.save(args.token, { verified: true })
            if (!client.#pocketbase.authStore.isValid) throw new Error('Invalid Token')
        } else if (args.user && args.pass) {
            if (typeof args.user != 'string' || typeof args.pass != 'string') throw new Error('Username and password should be of type string')
            await client.#pocketbase.collection('users').authWithPassword(args.user, args.pass)
        } else {
            throw new Error('Invalid attempt to connect with pocketbase client.')
        }

        return client
    }

    /**
     * Create a new Client instance that connects with the dev server. The
     * dev server is running on localhosts at ports 8090 (API Server) and
     * 5148 (Game Server)
     */
    static async dev(args: NodeJS.ProcessEnv | { token?: string, user?: string, pass?: string }): Promise<Client> {
        const client = new Client()

        client.#runningDevServer = true
        client.#linkApiRoom = 'localhost:5148'
        client.#pocketbase = new PocketBase(`http://127.0.0.1:8090`) // not secure
        client.#connection = new Connection<false>(client, true)

        if (args.token) {
            if (typeof args.token != 'string') throw new Error('Token should be of type string')
            client.#pocketbase.authStore.save(args.token, { verified: true })
            if (!client.#pocketbase.authStore.isValid) throw new Error('Invalid Token')
        } else if (args.user && args.pass) {
            if (typeof args.user != 'string' || typeof args.pass != 'string') throw new Error('Username and password should be of type string')
            await client.#pocketbase.collection('users').authWithPassword(args.user, args.pass)
        } else {
            throw new Error('Invalid attempt to connect with pocketbase client.')
        }

        return client
    }

    /**
     * Use the structure `Client.new` instead of `new Client()`. The reason
     * for this change is to allow login with username and password, which
     * requires the constructor to be asynchronous.
     */
    private constructor() {
        super()

        this.#players = PlayerEventArray(this)
        this.#profiles = new PlayerArray<PublicProfile, true>()

        this.block_scheduler = new BlockScheduler(this)

        this.include(BotCommandModule(this.#command))
        this.include(ChatModule)

        // On process interrupt, gracefully disconnect.
        // DO NOT merge this into one function, otherwise it does not work.
        process.on('SIGINT', (signal) => this.disconnect())
    }

    //
    //
    // Getters
    //
    //

    /**
     * Retrieve the connection layer. It connects with an event
     * listener which can be used to intercept incoming and outgoing
     * messages.
     * 
     * ```ts
     * client.connection().on('Receive', buffer => console.log(buffer))
     * ```
     * 
     * @/event Send The client is trying to send a packet to the server.
     * @/event Receive The server has sent the client a packet.
     * @/event Error An error occured during the communication.
     * @/event Close The socket was closed.
     */
    public connection(): Connection<boolean> {
        return this.#connection
    }

    //
    //
    // Methods
    //
    //

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

    public async connect(world_id: string, room_type: typeof RoomTypes[0] = RoomTypes[0]): Promise<this> {
        if (world_id == undefined) throw new Error('`world_id` was not provided in `Client.connect()`')
        if (!this.#runningDevServer && room_type && !RoomTypes.includes(room_type)) throw new Error(`\`room_type\` expected to be one of ${RoomTypes}, got \`${room_type}\``)
        if (this.#runningDevServer && room_type != 'pixelwalker_dev') throw new Error(`\`room_type\` expected to be \`pixelwalker_dev\` since you are running on the development server`)
        if (this.#pocketbase == null) throw new Error('Can\'t connect to a world without having pocketbase data.')

        await this.#connection.start(world_id, room_type)

        // this.world = await worldPromise

        this.block_scheduler.start()

        return this
    }

    /**
     * 
     */
    public pocketbase() {
        return this.#pocketbase
    }

    /**
     * Returns the promise awaiting till the world gets loaded. 
     * 
     * ```ts
     * client.on('save', async () => {
     *     const world = await client.world()
     * })
     * ```
     */
    public world(): Promise<World> {
        return this.#world
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
    public connected(): boolean {
        return this.#connection?.connected() ?? false
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
        this.#connection?.disconnect()
        this.block_scheduler.stop(true)
        this.#pocketbase?.authStore.clear()
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
    public send(...args: Buffer[]): void {
        if (!this.connected()) return
        this.#connection.emit('Send', ...args)
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
        this.#chatPrefix = prefix
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
    public block(x: number, y: number, layer: LayerId, block: BlockIdentifier, ...args: any[]): Promise<boolean>

    public block(x: number, y: number, layer: LayerId, block: Block): Promise<boolean>

    public async block(x: number, y: number, layer: LayerId, block: BlockIdentifier, ...args: any[]): Promise<boolean> {
        if (block == null) block = 0
        if (typeof block == 'string' || typeof block == 'number') {
            block = new Block(block)
            block.data.push(...args)
        } else if (!(block instanceof Block))
            return Promise.reject("Expected `Block` or block identifier, got unknown object.")
        
        const world = await this.world()
        return world.place({ x, y, layer }, block) || Promise.reject('The `client.world` object was not loaded.')
    }

    /**
     * @param {string} content Write to chat
     */
    public say(content: string) {
        const isPrivateMessage = content.startsWith('/pm')

        if (content.startsWith('/') && !isPrivateMessage) {
            return this.send(Magic(0x6B), Bit7(Connection.MessageId('ChatMessage')), String(content))
        }

        let privateMessageHeader = /^\/pm\s+([\w\d]+|\#\d+)\s+(.+)$/i.exec(content)
        let preamble = ''

        if (isPrivateMessage) {
            preamble += `/pm ${privateMessageHeader![1]} `
            content = privateMessageHeader![2] // Note that we cut the header from the content
        }

        if (this.#chatPrefix) {
            preamble += `${this.#chatPrefix} `
        }

        // console.log(preamble + ':' + content)

        const MESSAGE_SIZE = 120;
        const CONTENT_ALLOWED_SIZE = MESSAGE_SIZE - preamble.length

        if (preamble.length > MESSAGE_SIZE)
            throw new Error('Chat preamble cannot be larger than message size.')

        for (let i = 0; i < content.length; i += CONTENT_ALLOWED_SIZE) {
            const chunk = content.substring(CONTENT_ALLOWED_SIZE * i, Math.min(CONTENT_ALLOWED_SIZE * (i + 1), content.length))
            // const separation_index = chunk.lastIndexOf(' ') // TODO regex
            if (chunk.trim().length == 0) break
            this.send(Magic(0x6B), Bit7(Connection.MessageId('ChatMessage')), String(preamble + chunk))
        }

        // TODO this should be scheduler response
        return Promise.resolve(true)
    }

    /**
     * Wrapper for `client.self` methods
     */
    public god(value: boolean) {
        return this.self!.forceGod(value)
    }

    /**
     * Wrapper for `client.self.face()` method
     */
    public face(value: number) {
        return this.self!.setFace(value)
    }

    /**
     * Wrapper for `client.self.move()` method
     */
    public move(args: Partial<MoveArgs> & Point) {
        return this.self!.move(args)
    }

    /**
     * @todo
     */
    public async fill(xt: number, yt: number, fragment: Structure, args?: { animation?: (b: any) => any, ms?: number, write_empty?: boolean }) {
        const world = await this.world()
        return world.paste(xt, yt, fragment, args)
    }
}
