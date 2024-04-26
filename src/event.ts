
import PocketBase from 'pocketbase'
import WebSocket from 'ws'
import { EventEmitter } from 'events'

// import { addEntity } from 'bitecs'

import { read7BitInt, deserialise } from './math.js'
import { HeaderTypes, MessageType, SpecialBlockData, API_ACCOUNT_LINK, API_ROOM_LINK } from './data/consts.js'
import { Magic, Bit7, String, Int32, Boolean } from './types.js'
import { BlockMappings } from './data/mappings.js'
import World from './world.js'
import Block, { WorldPosition } from './types/block.js'
import Player from './types/player.js'
import { FIFO, RANDOM } from './types/animation.js'
import { RoomTypes } from './data/room_types.js'

export default class Client extends EventEmitter {
    public raw: EventEmitter

    private pocketbase: PocketBase
    private socket: WebSocket | null
    private debug: boolean

    public world: World | undefined
    public cmdPrefix: string[]
    public players: Map<number, Player>

    constructor(args: { token?: string, user?: string, pass?: string, flags?: {}, debug?: boolean }) {
        super()

        this.raw = new EventEmitter()
        this.pocketbase = new PocketBase(`https://${API_ACCOUNT_LINK}`)
        this.socket = null
        this.world = undefined
        this.cmdPrefix = ['.', '!']
        this.players = new Map()

        if (args.token) {
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
        process.on('SIGINT', this.disconnect)
    }

    /**
     * Connect client to server
     */
    public async connect(world_id: string, room_type: string) {
        if (world_id == undefined) throw new Error('`world_id` was not provided in `Client.connect()`')
        if (!RoomTypes.includes(room_type)) throw new Error(`\`room_type\` expected to be one of ${RoomTypes}, got \`${room_type}\``)

        const { token } = await this.pocketbase.send(`/api/joinkey/${room_type}/${world_id}`, {})

        try {
            this.socket = new WebSocket(`wss://${API_ROOM_LINK}/room/${token}`)
            this.socket.binaryType = 'arraybuffer'
        } catch (e) {
            throw new Error('Socket failed to connect.')
        }

        // (tmpfix) find a better type coercion
        this.socket.on('message', (event) => this.internal_socket_message(Buffer.from(event as any)))
        this.socket.on('error', (err) => this.emit('error', [err]))
        this.socket.on('close', (code, reason) => this.emit('close', [code, reason]))

        this.raw.on('init', this.internal_player_init)
        this.raw.on('playerJoined', this.internal_player_join)
        this.raw.on('playerLeft', this.internal_player_leave)
        this.raw.on('chatMessage', this.internal_player_chat)
        this.raw.on('playerMoved', this.internal_player_move)
        this.raw.on('playerFace', this.internal_player_face)
        this.raw.on('playerGodMode', this.internal_player_godmode)
        this.raw.on('playerModMode', this.internal_player_modmode)
        this.raw.on('crownTouched', this.internal_player_crown)
        this.raw.on('playerStatsChanged', this.internal_player_stat_change)
        this.raw.on('placeBlock', this.internal_player_block)
        this.raw.on('worldCleared', this.internal_world_clear)
        this.raw.on('worldReloaded', this.internal_world_reload)
    }

    private async internal_socket_message(buffer: Buffer) {
        if (buffer[0] == 0x3F) { // 63
            return await this.send(Magic(0x3F))
        }

        if (buffer[0] == 0x6B) { // 107
            if (this.debug && buffer[1] != MessageType['playerMoved']) console.debug('Received', buffer)

            let [event_id, offset] = read7BitInt(buffer, 1)
            const event_name = Object.entries(MessageType).find((k) => k[1] == event_id)?.[0]
            const data = deserialise(buffer, offset)

            if (event_name == undefined) {
                console.warn((`Unknown event type ${event_id}. API may be out of date. Deserialised: ${data}`))
                return
            }

            return this.raw.emit(event_name, data)
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
        this.pocketbase?.authStore.clear()
        this.socket?.close()
    }

    //
    //
    // Internal Events
    //
    //

    // private async internal_player_init(some: any) {
    private async internal_player_init([id, cuid, username, face, isAdmin, x, y, can_edit, can_god, title, plays, owner, global_switch_states, width, height, buffer]: any[]) {
        await this.init()

        this.world = new World(width, height)
        this.world.init(buffer)

        const self = new Player({
            client: this,
            id,
            cuid,
            username,
            face,
            isAdmin,
            x: x / 16,
            y: y / 16,
        })

        this.players.set(id, self)
        this.emit('start', [self])
    }

    private async internal_player_join([id, cuid, username, face, isAdmin, x, y, god_mode, mod_mode, has_crown]: any[]) {
        const player = new Player({
            client: this,
            id,
            cuid,
            username,
            face,
            isAdmin,
            x: x / 16,
            y: y / 16,
            god_mode,
            mod_mode,
            has_crown
        })

        this.players.set(id, player)
        this.emit('player:join', [player])
    }

    private async internal_player_leave([id]: [number]) {
        const player = await this.wait_for(() => this.players.get(id))
        this.emit('player:leave', [player])
        this.players.delete(id)
    }

    private async internal_player_chat([id, message]: [number, string]) {
        const player = await this.wait_for(() => this.players.get(id))
        const prefix = this.cmdPrefix.find(v => message.startsWith(v))

        if (prefix == undefined) {
            this.emit('chat', [player, message])
            return
        }

        const cmd = message.substring(prefix.length).toLowerCase()
        const arg_regex = /"[^"]+"|'[^']+'|\w+/gi // TODO add escape char \
        const args: any[] = [player]
        for (const match of cmd.matchAll(arg_regex)) {
            args.push(match[0])
        }
        this.emit(`cmd:${args[1]}`, args)
    }

    private async internal_player_move([id, x, y, speed_x, speed_y, mod_x, mod_y, horizontal, vertical, space_down, space_just_down, tick_id]: any[]) {
        const player = await this.wait_for(() => this.players.get(id))

        player.x = x / 16
        player.y = y / 16

        // TODO
        // this.emit('player:move', [player])
    }

    private async internal_player_face([id, face]: [number, number]) {
        const player = await this.wait_for(() => this.players.get(id))
        const old_face = player.face
        player.face = face
        this.emit('player:face', [player, old_face, face])
    }

    private async internal_player_godmode([id, god_mode]: [number, boolean]) {
        const player = await this.wait_for(() => this.players.get(id))
        const old_mode = player.god_mode
        player.god_mode = god_mode
        this.emit('player:god', [player]) // TODO
    }

    private async internal_player_modmode([id, mod_mode]: [number, boolean]) {
        let player = await this.wait_for(() => this.players.get(id))
        player.mod_mode = mod_mode
        // TODO emit
    }

    private async internal_player_crown([id]: [number]) {
        const player = await this.wait_for(() => this.players.get(id))
        const players = await this.wait_for(() => this.players)
        const old_crown = Array.from(players.values()).find(p => p.has_crown)
        players.forEach((p) => p.has_crown = p.id == id)
        this.emit('player:crown', [player, old_crown])
    }

    private async internal_player_stat_change([id, gold_coins, blue_coins, death_count]: number[]) {
        const player = await this.wait_for(() => this.players.get(id))

        const old_coins = player.coins
        const old_blue_coins = player.blue_coins
        const old_death_count = player.deaths

        player.coins = gold_coins
        player.blue_coins = blue_coins
        player.deaths = death_count

        if (old_coins != gold_coins) this.emit('player:coin', [player, old_coins, gold_coins])
        if (old_blue_coins != blue_coins) this.emit('player:blue_coin', [player, old_blue_coins, blue_coins])
        if (old_death_count != death_count) this.emit('player:death', [player, old_death_count, death_count])
    }

    private async internal_player_block([x, y, layer, id, ...args]: any[]) {
        const world = await this.wait_for(() => this.world)
        const [position, block] = world.place(x, y, layer, id, args)
        this.emit('world:block', [position, block])
    }

    private async internal_world_clear() {
        const world = await this.wait_for(() => this.world)
        world.clear(true)
        this.emit('world:clear', [])
    }

    private async internal_world_reload() {
        if (this.debug) console.debug('World Reload not yet implemented.')
        // TODO
    }

    //
    //
    // Communication
    //
    //

    public send(...args: Buffer[]): Promise<any | undefined> {
        if (this.debug && Buffer.concat(args)[0] != 0x3f) console.debug('Sending', Buffer.concat(args))

        return new Promise((res, rej) => {
            if (!this.socket) return true
            const buffer = Buffer.concat(args)
            this.socket.send(buffer, {}, (err: any) => {
                if (err) return rej(err)
                res(true)
            })
        })
    }

    /**
     * Respond to the init protocol
     */
    private async init() {
        await this.send(Magic(0x6B), Bit7(MessageType['init']))
    }

    public async say(content: string) {
        await this.send(Magic(0x6B), Bit7(MessageType['chatMessage']), String(content))
    }

    public async block(x: number, y: number, layer: number, id: number | string | Block) {
        if (typeof id == 'string') {
            id = BlockMappings[id]
        }

        if (typeof id == 'number') {
            await this.send(Magic(0x6B), Bit7(MessageType['placeBlock']), Int32(x), Int32(y), Int32(layer), Int32(id))
            return
        }

        if (id instanceof Block) {
            const block: Block = id
            const buffer: Buffer[] = [Magic(0x6B), Bit7(MessageType['placeBlock']), Int32(x), Int32(y), Int32(layer), Int32(block.id)]
            const arg_types: HeaderTypes[] = SpecialBlockData[block.name] || []

            for (let i = 0; i < arg_types.length; i++) {
                switch (arg_types[i]) {
                    // TODO other types
                    case HeaderTypes.Int32:
                        buffer.push(Int32(block.data[i]))
                        break
                }
            }

            await this.send(Buffer.concat(buffer))
        }
    }

    public async god(value: boolean, mod_mode: boolean) {
        await this.send(Magic(0x6B), Bit7(MessageType[mod_mode ? 'playerModMode' : 'playerGodMode']), Boolean(value))
    }

    public async face(value: number) {
        await this.send(Magic(0x6B), Bit7(MessageType['playerFace']), Int32(value))
    }

    public async move(x: number, y: number) {
        // TODO
    }

    // TODO add types for animation header
    public async fill(xt: number, yt: number, world: World, args: { animation: (b: any) => any }) {
        this.world = await this.wait_for(() => this.world)
        const to_be_placed: [WorldPosition, Block][] = []

        for (let x = 0; x < world.width; x++)
            for (let y = 0; y < world.height; y++) {
                if (!world.foreground[x][y].isSameAs(this.world.foreground[xt + x][yt + y])) {
                    to_be_placed.push([[xt + x, yt + y, 1], world.blockAt(x, y, 1)])
                }
                if (!world.background[x][y].isSameAs(this.world.background[xt + x][yt + y])) {
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
