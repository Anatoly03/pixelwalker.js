import Client from "../client.js"
import { MessageType } from "../data/consts.js"
import { Bit7, Magic, Boolean, Int32, Double, String } from "../types.js"

/**
 * Player Base
 */
export class PlayerBase {
    public readonly cuid: string
    public readonly username: string
    public readonly isAdmin: boolean
    
    constructor(args: {
        cuid: string
        username: string
        isAdmin: boolean
    }) {
        this.cuid = args.cuid
        this.username = args.username
        this.isAdmin = args.isAdmin
    }
}

/**
 * Player in World
 */
export default class Player extends PlayerBase {
    protected readonly client: Client

    public readonly id: number
    public face: number
    public x: number
    public y: number
    public god_mode: boolean
    public mod_mode: boolean
    public has_crown: boolean

    public coins: number
    public blue_coins: number
    public deaths: number

    public horizontal: -1 | 0 | 1 | undefined
    public vertical: -1 | 0 | 1 | undefined
    public space_down: boolean | undefined
    public space_just_down: boolean | undefined

    constructor(args: {
        client: Client
        id: number
        cuid: string
        username: string
        face: number
        isAdmin: boolean
        x: number
        y: number
        god_mode?: boolean
        mod_mode?: boolean
        has_crown?: boolean
        coins?: number
        blue_coins?: number
        deaths?: number
    }) {
        super(args)

        this.client = args.client

        this.id = args.id
        this.face = args.face
        this.x = args.x
        this.y = args.y

        this.god_mode = args.god_mode || false
        this.mod_mode = args.mod_mode || false
        this.has_crown = args.has_crown || false

        this.coins = args.coins || 0
        this.blue_coins = args.blue_coins || 0
        this.deaths = args.deaths || 0
    }

    public equals(other: Player): boolean {
        return this.cuid == other.cuid
    }

    public async pm(content: string) {
        this.client.say(`/pm #${this.id} ${content}`)
        // this.client.say(`/pm ${this.username} ${content}`)
    }

    public async respond(content: string) {
        this.client.say(`${this.username}: ${content}`)
    }

    public async kick(reason: string) {
        this.client.say(`/kick #${this.id} ${reason}`)
        // this.client.say(`/kick ${this.username} ${reason}`)
    }

    public async edit(value: boolean) {
        this.client.say(`/${value ? 'giveedit' : 'takeedit'} #${this.id}`)
        // this.client.say(`/${value ? 'giveedit' : 'takeedit'} ${this.username}`)
    }

    public async god(value: boolean) {
        this.client.say(`/${value ? 'givegod' : 'takegod'} #${this.id}`)
        // this.client.say(`/${value ? 'givegod' : 'takegod'} ${this.username}`)
    }

    public async crown(value: boolean) {
        this.client.say(`/${value ? 'givecrown' : 'takecrown'} #${this.id}`)
    }

    public async teleport(x: number, y:number): Promise<void>;
    public async teleport(p: Player): Promise<void>;
    public async teleport(x: number | Player, y?: number) {
        if (typeof x == 'number' && typeof y == 'number')
            this.client.say(`/tp #${this.id} ${x} ${y}`)
        else if (x instanceof Player)
            this.client.say(`/tp #${this.id} #${x.id}`)
    }

    public async reset() {
        this.client.say(`/resetplayer #${this.id}`)
    }
}

/**
 * Self Player
 */
export class SelfPlayer extends Player {
    private move_tick = 0

    public say(content: string) {
        return this.client.send(Magic(0x6B), Bit7(MessageType['chatMessage']), String(content))
    }

    public set_god(value: boolean) {
        return this.client.send(Magic(0x6B), Bit7(MessageType['playerGodMode']), Boolean(value))
    }

    public set_mod(value: boolean) {
        return this.client.send(Magic(0x6B), Bit7(MessageType['playerModMode']), Boolean(value))
    }

    public set_face(value: number) {
        return this.client.send(Magic(0x6B), Bit7(MessageType['playerFace']), Int32(value))
    }

    public move(x: number, y: number, xVel: number, yVel: number, xMod: number, yMod: number, horizontal: -1 | 0 | 1, vertical: -1 | 0 | 1, space_down: boolean, space_just_down: boolean) {
        return this.client.send(
            Magic(0x6B), Bit7(MessageType['playerMoved']),
            Double(x), Double(y),
            Double(xVel), Double(yVel),
            Double(xMod), Double(yMod),
            Int32(horizontal), Int32(vertical),
            Boolean(space_down), Boolean(space_just_down),
            Int32(this.move_tick++)
        )
    }
}