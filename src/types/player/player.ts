import Client from "../../client.js"
import { Point } from "../index.js"
import { PublicProfile } from "./profile.js"
import { SelfPlayer } from "./self.js"
import { Team, TeamIdentifier } from "./team.js"

export type PlayerInitArgs = {
    client: Client,
    cuid: string,

    username: string,
    id: number
    isAdmin: boolean
    isSelf: boolean
    face: number

    x: number
    y: number

    god: boolean
    mod: boolean
    can_god: boolean
    can_edit: boolean

    crown: boolean
    win: boolean
    team: TeamIdentifier

    coins: number,
    blue_coins: number,
    deaths: number,
    checkpoint?: Point,
}

export type PlayerEvents = {
    ChatMessage: [string],
    PlayerLeft: [],
    PlayerMoved: [],
    PlayerTeleported: [number, number],
    PlayerFace: [],
    PlayerGodMode: [],
    PlayerModMode: [],
    PlayerRespawn: [],
    PlayerReset: [],
    PlayerTouchBlock: [],
    PlayerTouchPlayer: [],
    PlayerEffect: [],
    PlayerRemoveEffect: [],
    PlayerResetEffects: [],
    PlayerTeam: [],
    PlayerCounters: [],
    PlayerLocalSwitchChanged: [],
    PlayerLocalSwitchReset: [],
}

/**
 * ```ts
 * const player = client.players.random()
 * player.crown(true)
 * player.edit(true)
 * player.god(false)
 * ```
 */
export default class Player  {
    protected readonly client: Client

    public readonly cuid: string
    public readonly username: string
    public readonly id: number
    public readonly isAdmin: boolean
    #isSelf: boolean

    #x: number
    #y: number
    #face: number

    #god: boolean
    #mod: boolean
    #can_god: boolean
    #can_edit: boolean
    
    #crown: boolean
    #win: boolean
    #team: Team

    #coins: number
    #blue_coins: number
    #deaths: number
    #checkpoint?: Point
    #switches: Set<number>
    #collected: Set<Point>

    /**
     * @ignore
     */
    constructor(args: PlayerInitArgs) {
        this.client = args.client

        this.#x = args.x
        this.#y = args.y
        this.#face = args.face

        this.cuid = args.cuid
        this.username = args.username
        this.id = args.id
        this.isAdmin = args.isAdmin
        this.#isSelf = args.isSelf

        this.#god = args.god ?? false
        this.#mod = args.mod ?? false
        this.#can_god = args.can_god ?? false
        this.#can_edit = args.can_edit ?? false
    
        this.#crown = args.crown ?? false
        this.#win = args.win ?? false
        this.#team = new Team(args.team)
    
        this.#coins = args.coins ?? 0
        this.#blue_coins = args.blue_coins ?? 0
        this.#deaths = args.deaths ?? 0
        this.#checkpoint = args.checkpoint

        this.#switches = new Set() // TODO
        this.#collected = new Set() // TODO
    }

    //
    //
    // Type Predicate
    //
    //

    /**
     * Type hint wether the current player is client self
     */
    public isSelf(): this is SelfPlayer {
        return this.#isSelf
    }

    /**
     * Retrieve the public profile of a user.
     */
    public async profile(): Promise<PublicProfile> {
        return this.client.pocketbase().collection('public_profiles').getFirstListItem<PublicProfile>(this.client.pocketbase().filter(`id ~ ${this.cuid}`))
    }

    //
    //
    // Event Code
    //
    //

    /**
     * @ignore
     */
    public on<K extends keyof PlayerEvents>(event: K, callback: (...args: PlayerEvents[K]) => void): this {
        throw new Error('Not Implemented') // TODO add event emitter
        return this
    }

    /**
     * @ignore
     */
    public once<K extends keyof PlayerEvents>(event: K, callback: (...args: PlayerEvents[K]) => void): this {
        throw new Error('Not Implemented') // TODO add event emitter
        return this
    }

    /**
     * @ignore
     */
    public emit<K extends keyof PlayerEvents>(event: K, ...args: PlayerEvents[K]): this {
        throw new Error('Not Implemented') // TODO trigger event emitter
        return this
    }

    //
    //
    // Getters
    //
    //

    public get face(): number {
        return this.#face
    }

    /**
     * Get the players' horizontal position.
     */
    public get x(): number {
        return this.#x
    }

    /**
     * Get the players' vertical position.
     */
    public get y(): number {
        return this.#y
    }

    /**
     * Copy the players Position
     */
    public get pos(): Point {
        return { x: this.#x, y: this.#y }
    }

    /**
     * Check the players edit right permissions
     */
    public get canEdit() {
        return this.#can_edit
    }

    /**
     * Does the player have god rights?
     */
    public get canGod() {
        return this.#can_god
    }

    /**
     * Is the player in any kind of god mode?
     */
    public get isFlying() {
        return this.#god || this.#mod
    }

    /**
     * Is the player in god mode?
     */
    public get god() {
        return this.#god
    }

    /**
     * Is the player in mod mode?
     */
    public get mod() {
        return this.#mod
    }

    /**
     * Is the player in any kind of god mode?
     */
    public get hasCrown() {
        return this.#crown
    }

    /**
     * Does the player have a silver crown?
     */
    public get isWinner() {
        return this.#win
    }

    /**
     * What team is the user of?
     */
    public get team() {
        return this.#team.name
    }

    //
    //
    // Methods
    //
    //

    /**
     * @param {string} content The message to send to the user.
     * @example
     * ```ts
     * user.pm('Help: !help !admin !ping')
     * ```
     */
    public async pm(content: string) {
        this.client.say(`/pm #${this.id} ${content}`)
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
        this.client.say(`${this.username}: ${content}`)
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
        this.client.say(`/kick #${this.id} ${reason}`)
    }

    /**
     * @example
     * ```ts
     * player.reset()
     * ```
     */
    public async reset() {
        this.client.say(`/resetplayer #${this.id}`)
    }

    /**
     * @example
     * Bizarre Concept Idea: In this example, if a `player` places a checkpoint
     * in the world, teleports the current `crowned` player to the position and
     * gives the crown to the person who placed the checkpoint.
     * 
     * ```ts
     * client.on('player:block', ([player, [x, y, _], block]) => {
     *     if (block.name !== 'checkpoint') return
     *     const crowned = client.players.byCrown()
     *     crowned?.teleport({ x, y })
     *     player.crown(true)
     * })
     * ```
     * 
     * @example
     * ```ts
     * function swap_players(a: Player, b: Player) {
     *     const { pos } = a
     *     a.teleport(b)
     *     b.teleport(pos)
     * }
     * ```
     */
    public async teleport(to: Point) {
        if (to instanceof Player) {
            return this.client.say(`/tp #${this.id} #${to.id}`)
        }
        return this.client.say(`/tp #${this.id} ${to.x} ${to.y}`)
    }

    /**
     * Modify a users' edit rights.
     * @param {true | false} value 
     * @example
     * ```ts
     * client.on('player:join', ([player]) => {
     *     player.setEdit(true)
     *     player.god = false
     * })
     * ```
     */
    public setEditRights(value: boolean) {
        return this.client.say(`/${value ? 'giveedit' : 'takeedit'} #${this.id}`)
    }

    /**
     * Modify a users' god mode rights.
     * @param {true | false} value 
     * @example
     * ```ts
     * client.on('player:join', ([player]) => {
     *     player.setGodRights(true)
     * })
     * ```
     */
    public setGodRights(value: boolean) {
        return this.client.say(`/${value ? 'givegod' : 'takegod'} #${this.id}`)
    }

    /**
     * Force a user into god mode.
     * @param {true | false} value 
     * @example
     * ```ts
     * client.onCommand('afk', ([player]) => {
     *     player.god = true
     * })
     * ```
     */
    public forceGod(value: boolean) {
        return this.client.say(`/forcegod #${this.id} ${value ? 'true' : 'false'}`)
    }

    /**
     * Modify a users' crown ownership. Note: At any point in time there can only be one player with the crown.
     * @param {true | false} value 
     * @example
     * ```ts
     * client.on('player:join', ([player]) => {
     *     player.crown = true
     * })
     * ```
     */
    public giveCrown(value: boolean) {
        return this.client.say(`/${value ? 'givecrown' : 'takecrown'} #${this.id}`)
    }

    /**
     * Add the player to a team
     */
    public setTeam(value: TeamIdentifier) {
        return this.client.say(`/team #${this.id} ${value}`)
    }
}
