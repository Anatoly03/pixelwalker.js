
import PocketBase from 'pocketbase'
import WebSocket from 'ws'
import { EventEmitter } from 'events'

// import { addEntity } from 'bitecs'

import { read7BitInt, deserialise } from './math'
import { MessageType } from './consts'
import { Magic, Bit7, String, Int32, Boolean } from './types'
export { init_mappings, BlockMappings, BlockMappingsReverse } from './mappings'
import World from './world'
import Block from './block'
import Player from './player'
import { init_mappings } from './mappings'

const API_ACCOUNT_LINK = 'lgso0g8.116.202.52.27.sslip.io'
const API_ROOM_LINK = 'po4swc4.116.202.52.27.sslip.io'

export default class Client extends EventEmitter {

    private pocketbase: PocketBase
    private socket: WebSocket | null
    public world: World | null
    public cmdPrefix: string[]
    public players: Map<number, Player>

    constructor(args) {
        super()

        this.pocketbase = new PocketBase(`https://${API_ACCOUNT_LINK}`)
        this.socket = null
        this.world = null
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

        // On process interrupt, gracefully disconnect.
        process.on('SIGINT', this.disconnect)
    }

    /**
     * Connect client to server
     */
    public async connect(world_id: string, room_type: string) {
        const { token } = await this.pocketbase.send(`/api/joinkey/${room_type}/${world_id}`, {})
        this.socket = new WebSocket(`wss://${API_ROOM_LINK}/room/${token}`)
        this.socket.binaryType = 'arraybuffer'

        // Initialise block map
        await init_mappings()

        this.socket.on('message', (event) => {
            const buffer = Buffer.from(event)

            if (buffer[0] == 0x3F) { // 63
                return this.send(Magic(0x3F))
            }

            if (buffer[0] == 0x6B) { // 107
                return this.accept_event(buffer.subarray(1))
            }

            this.emit('error', [new Error(`Unknown header byte received: got ${buffer[0]}, expected 63 or 107.`)])
        })

        this.socket.on('error', (err) => {
            this.emit('error', [err])
        })

        this.socket.on('close', (code, reason) => {
            this.emit('close', [code, reason])
        })

        this.on('init', this.internal_player_init)
        this.on('playerJoined', this.internal_player_join)
        this.on('playerLeft', this.internal_player_leave)
        this.on('chatMessage', this.internal_player_chat)
        this.on('playerMoved', this.internal_player_move)
        this.on('playerFace', this.internal_player_face)
        this.on('playerGodMode', this.internal_player_godmode)
        this.on('playerModMode', this.internal_player_modmode)
        this.on('crownTouched', this.internal_player_crown)
        this.on('placeBlock', this.internal_player_block)
        this.on('worldCleared', this.internal_world_clear)
    }

    private accept_event(buffer: Buffer) {
        let [event_id, offset] = read7BitInt(buffer, 0)
        const event_name = Object.entries(MessageType).find((k) => k[1] == event_id)?.[0]
        if (event_name == undefined)
            throw new Error('Unknown event type for incoming buffer ' + buffer)
        const data = deserialise(buffer, offset)
        this.emit(event_name, data)
    }

    /**
     * Wait in the local thread
     */
    public async wait(condition: number | (() => any)) {
        if (condition == undefined)
            condition = 2

        if (typeof condition == 'number')
            return new Promise(res => setTimeout(res, condition))
        else if (typeof condition == 'function') {
            const binder = (res) => {
                let x = condition()
                if (x) res(x)
                else binder.bind(res)
            }

            return new Promise(res => binder(res))
        }
    }

    /**
     * Disconnect client from server
     */
    public disconnect() {
        this.pocketbase.authStore.clear()
        this.socket?.close()
    }

    //
    // Internal Events
    //

    private async internal_player_init([id, cuid, username, face, isAdmin, x, y, can_edit, can_god, title, plays, owner, width, height, buffer]) {
        await this.init()
        await this.wait(() => this.block_mappings)

        this.world = new World(width, height)
        this.world.setMappings(this.block_mappings)
        this.world.init(buffer)

        this.players.set(id, {
            id, cuid, username, face, isAdmin, x: x / 16, y: y / 16, god_mode: false, mod_mode: false, has_crown: false
        })

        this.emit('start', [id])
    }

    private internal_player_join([id, cuid, username, face, isAdmin, x, y, god_mode, mod_mode, has_crown]) {
        this.players.set(id, {
            cuid, username, face, isAdmin, x: x / 16, y: y / 16, god_mode, mod_mode, has_crown
        })
    }

    private internal_player_leave([id]) {
        this.players.delete(id)
    }

    private internal_player_chat([id, message]: [number, string]) {
        const prefix = this.cmdPrefix.find(v => message.startsWith(v))
        if (prefix == undefined) return
        const cmd = message.substring(prefix.length).toLowerCase()
        const arg_regex = /"[^"]+"|'[^']+'|\w+/gi
        const args = [id]
        for (const match of cmd.matchAll(arg_regex)) {
            args.push(match[0])
        }
        this.emit(`cmd:${args[1]}`, args)
    }

    private async internal_player_move([id, x, y, speed_x, speed_y, mod_x, mod_y, horizontal, vertical, space_down, space_just_down, tick_id, coins, blue_coins]) {
        let player = await this.wait(() => this.players.get(id))

        // if (player.coins != undefined && player.coins != coins)
        //     this.emit('coinCollected', [id, coins])

        // if (player.blue_coins != undefined && player.blue_coins != blue_coins)
        //     this.emit('blueCoinCollected', [id, blue_coins])

        player.coins = coins
        player.blue_coins = blue_coins

        player.x = x / 16
        player.y = y / 16

        // TODO fix
    }

    private async internal_player_face([id, face]) {
        this.players.get(id).face = face
    }

    private async internal_player_godmode([id, god_mode]) {
        await this.wait(() => this.players.get(id))
        this.players.get(id).god_mode = god_mode
    }

    private async internal_player_modmode([id, mod_mode]) {
        await this.wait(() => this.players.get(id))
        this.players.get(id).mod_mode = mod_mode
    }

    private async internal_player_crown([id]) {
        await this.wait(() => this.players.get(id))
        this.players.forEach((p) => p.has_crown = p.id == id)
    }

    private async internal_player_block([x, y, layer, id, ...args]) {
        await this.wait(() => this.world)
        this.world.place(x, y, layer, id, args)
        // TODO handle
    }

    private async internal_world_clear() {
        await this.wait(() => this.world)
        this.world.clear(true)
    }

    //
    // Communication
    //

    public send(...args: Buffer[]): Promise<any | undefined> {
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
            await this.wait(() => this.block_mappings)
            id = this.block_mappings[id]
        }

        if (typeof id == 'number') {
            await this.send(Magic(0x6B), Bit7(MessageType['placeBlock']), Int32(x), Int32(y), Int32(layer), Int32(id))
            return
        }

        if (id instanceof Block) {
            /** @type {Block} */
            const block = id
            const bid = block.id

            switch (World.reverseMapping[bid]) {
                case 'coin_gate':
                case 'blue_coin_gate':
                case 'coin_door':
                case 'blue_coin_door':
                    await this.send(Magic(0x6B), Bit7(MessageType['placeBlock']), Int32(x), Int32(y), Int32(layer), Int32(bid), Int32(block.amount))
                    break

                case 'portal':
                    await this.send(Magic(0x6B), Bit7(MessageType['placeBlock']), Int32(x), Int32(y), Int32(layer), Int32(bid), Int32(block.rotation), Int32(block.portal_id), Int32(block.target_id))
                    break

                case 'spikes':
                    await this.send(Magic(0x6B), Bit7(MessageType['placeBlock']), Int32(x), Int32(y), Int32(layer), Int32(bid), Int32(block.rotation))
                    break

                default:
                    await this.send(Magic(0x6B), Bit7(MessageType['placeBlock']), Int32(x), Int32(y), Int32(layer), Int32(bid))
                    break
            }
        }
    }

    public async god(value: boolean, mod_mode: boolean) {
        await this.send(Magic(0x6B), Bit7(MessageType[mod_mode ? 'playerModMode' : 'playerGodMode']), Boolean(value))
    }

    public async face(value: number) {
        await this.send(Magic(0x6B), Bit7(MessageType['playerFace']), Int32(value))
    }

    public async fill(xt: number, yt: number, world: World, args: any) {
        for (let x = 0; x < world.width; x++)
            for (let y = 0; y < world.height; y++) {
                await this.block(xt + x, yt + y, 1, world.blockAt(x, y, 1))
                await this.block(xt + x, yt + y, 0, world.blockAt(x, y, 0))
                await this.wait(10)
            }
    }

}
