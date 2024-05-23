import Client from "../client.js"
import { MessageType } from "../data/consts.js"
import { Bit7, Magic, Boolean, Int32, Double, String } from "../types.js"
import util from 'util'

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

    public toString() {
        return this.username
    }

    // public [util.inspect.custom](): string {
    //     return `${this.constructor.name} {\n  cuid: '${this.cuid}',\n  username: '${this.username}',\n  ...\n}`
    // }
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
    public can_edit: boolean
    public can_god: boolean

    public has_crown: boolean

    public win: boolean
    public coins: number
    public blue_coins: number
    public deaths: number
    public checkpoint: [number, number] | null

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
        can_edit: boolean
        can_god: boolean
        win: boolean
        coins: number
        blue_coins: number
        deaths: number
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
        this.can_edit = args.can_edit
        this.can_god = args.can_god

        this.win = args.win
        this.coins = args.coins
        this.blue_coins = args.blue_coins
        this.deaths = args.deaths
        this.checkpoint = null
    }

    public equals(other: Player): boolean {
        return this.cuid == other.cuid
    }

    public async pm(content: string) {
        // TODO add chat prefix
        this.client.say(`/pm #${this.id}` + (this.client.chatPrefix ? ' ' + this.client.chatPrefix : ''), content)
    }

    public async respond(content: string) {
        // TODO add chat prefix
        this.client.say(`${this.username}:` + (this.client.chatPrefix ? ' ' + this.client.chatPrefix : ''), content)
    }

    public async kick(reason: string = "Tsk Tsk Tsk") {
        this.client.say(`/kick #${this.id} ${reason}`, '')
    }

    public async edit(value: boolean) {
        this.client.say(`/${value ? 'giveedit' : 'takeedit'} #${this.id}`, '')
    }

    public async god(value: boolean) {
        this.client.say(`/${value ? 'givegod' : 'takegod'} #${this.id}`, '')
    }

    public async crown(value: boolean) {
        this.client.say(`/${value ? 'givecrown' : 'takecrown'} #${this.id}`, '')
    }

    public async teleport(x: number, y:number): Promise<void>;
    public async teleport(p: Player): Promise<void>;
    public async teleport(x: number | Player, y?: number) {
        if (typeof x == 'number' && typeof y == 'number')
            this.client.say(`/tp #${this.id} ${x} ${y}`, '')
        else if (x instanceof Player)
            this.client.say(`/tp #${this.id} #${x.id}`, '')
    }

    public async reset() {
        this.client.say(`/resetplayer #${this.id}`, '')
    }

    // public [util.inspect.custom](): string {
    //     return `${this.constructor.name} {\n  id: '${this.id}',\n  username: '${this.username}',\n  ...\n}`
    // }
}

/**
 * Self Player
 */
export class SelfPlayer extends Player {
    private move_tick = 0

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
        can_edit: boolean
        can_god: boolean
    }) {
        super({...args, ...{
            win: false,
            coins: 0,
            blue_coins: 0,
            deaths: 0
        }})
    }

    public say(content: string): void;
    public say(preamble: string, content: string): void;
    public say(preamble: string, content?: string) {
        if (content == undefined) {
            return this.say(this.client.chatPrefix || '', preamble)
        }

        const MESSAGE_SIZE = 120
        const CONTENT_ALLOWED_SIZE = MESSAGE_SIZE - preamble.length - (preamble.length > 0 ? 1 : 0)

        if (preamble.length > MESSAGE_SIZE)
            throw new Error('Chat preamble is larger than message size. Bad.')

        // TODO regex?
        if (content.length > CONTENT_ALLOWED_SIZE) {
            const separator = content.substring(0, CONTENT_ALLOWED_SIZE).lastIndexOf(' ') || CONTENT_ALLOWED_SIZE
            this.say(preamble, content.substring(0, separator))
            this.say(preamble, content.substring(separator, content.length))
            return
        }

        return this.client.send(Magic(0x6B), Bit7(MessageType['chatMessage']), String(preamble + ' ' + content))
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