import Client from "../client.js"
import { MessageType } from "../data/consts.js"
import { Bit7, Magic, Boolean, Int32, Double, String } from "./message-bytes.js"

/**
 * @example
 * ```ts
 * const player = new PlayerBase({
 *     cuid: 'abcdef',
 *     username: 'USER'
 * })
 * ```
 */
export class PlayerBase {
    public readonly cuid: string
    public readonly username: string
    
    /**
     * Create a new base instance of a Player.
     */
    constructor(args: {
        cuid: string
        username: string
    }) {
        this.cuid = args.cuid
        this.username = args.username
    }

    /**
     * @returns Username of the player.
     */
    public toString(): string {
        return this.username
    }
}

/**
 * ```ts
 * const player = client.players.random()
 * player.crown(true)
 * player.edit(true)
 * player.god(false)
 * ```
 */
export default class Player extends PlayerBase {
    protected readonly client: Client

    public readonly id: number
    public readonly isAdmin: boolean
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

    /**
     * @ignore
     */
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
        this.isAdmin = args.isAdmin
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

    /**
     * @param {string} content The message to send to the user.
     * @example
     * ```ts
     * user.pm('Help: !help !admin !ping')
     * ```
     */
    public async pm(content: string) {
        this.client.say(`/pm #${this.id}` + (this.client.chatPrefix ? ' ' + this.client.chatPrefix : ''), content)
    }

    /**
     * @param {string} content 
     * @example
     * ```ts
     * client.onCommand('deaths', ([player]) => {
     *     player.respond(`Your deaths: ${player.deaths}`)
     * })
     * ```
     * This example will print the following into the chat, if `JOHN` executes the command:
     * ```
     * JOHN: Your deaths: 123
     * ```
     */
    public async respond(content: string) {
        this.client.say(`${this.username}:` + (this.client.chatPrefix ? ' ' + this.client.chatPrefix : ''), content)
    }

    /**
     * @param {string} reason 
     * @example
     * ```ts
     * client.on('player:join', ([player]) => {
     *     if (!player.username.includes('EVIL')) return
     *     player.kick('I suspect you are evil.')
     * })
     * ```
     */
    public async kick(reason: string = "Tsk Tsk Tsk") {
        this.client.say(`/kick #${this.id} ${reason}`, '')
    }

    /**
     * Modify a users' edit rights.
     * @param {true | false} value 
     * @example
     * ```ts
     * client.on('player:join', ([player]) => {
     *     player.edit(true)
     *     player.god(false)
     * })
     * ```
     */
    public async edit(value: boolean) {
        this.client.say(`/${value ? 'giveedit' : 'takeedit'} #${this.id}`, '')
    }

    /**
     * Modify a users' god mode rights.
     * @param {true | false} value 
     * @example
     * ```ts
     * client.on('player:join', ([player]) => {
     *     player.god(true)
     * })
     * ```
     */
    public async god(value: boolean) {
        this.client.say(`/${value ? 'givegod' : 'takegod'} #${this.id}`, '')
    }

    /**
     * Modify a users' crown ownership. Note: At any point in time there can only be one player with the crown.
     * @param {true | false} value 
     * @example
     * ```ts
     * client.on('player:join', ([player]) => {
     *     player.crown(true)
     * })
     * ```
     */
    public async crown(value: boolean) {
        this.client.say(`/${value ? 'givecrown' : 'takecrown'} #${this.id}`, '')
    }

    /**
     * 
     * @param x x Coordinate of the player
     * @param y y Coordinate of the player
     * @example
     * Bizarre Concept Idea: In this example, if a `player` places a checkpoint in the world, teleports the current `crowned` player to the position and gives the crown to the person who placed the checkpoint.
     * ```ts
     * client.on('player:block', ([player, [x, y, _], block]) => {
     *     if (block.name !== 'checkpoint') return
     *     const crowned = client.players.byCrown()
     *     crowned?.teleport(x, y)
     *     player.crown(true)
     * })
     * ```
     */
    public async teleport(x: number, y:number): Promise<void>

    /**
     * @param {Player} p 
     * @example
     * ```ts
     * function swap_players(a: Player, b: Player) {
     *     const pos = { x: a.x, y: b.y }
     *     a.teleport(b)
     *     b.teleport(pos.x, pos.y)
     * }
     * ```
     */
    public async teleport(p: Player): Promise<void>

    public async teleport(x: number | Player, y?: number) {
        if (typeof x == 'number' && typeof y == 'number')
            this.client.say(`/tp #${this.id} ${x} ${y}`, '')
        else if (x instanceof Player)
            this.client.say(`/tp #${this.id} ${x.x} ${x.y}`, '')
    }

    /**
     * @example
     * ```ts
     * player.reset()
     * ```
     */
    public async reset() {
        this.client.say(`/resetplayer #${this.id}`, '')
    }
}

/**
 * ```
 * client.on('start', () => {
 *     client.self.set_god(true)
 * })
 * ```
 */
export class SelfPlayer extends Player {
    private move_tick = 0

    /**
     * @ignore
     */
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

    /**
     * 
     * @param content 
     */
    public say(content: string): void;

    /**
     * @ignore
     */
    public say(preamble: string, content: string): void;

    public say(preamble: string, content?: string) {
        if (content == undefined) {
            return this.say(this.client.chatPrefix || '', preamble)
        }

        preamble += ' '

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