import Client from "../../client.js"
import { Point } from "../geometry.js"
import { PlayerBase } from "./base.js"

/**
 * 
 */
export type PlayerInitArgs = {
    client: Client,
    cuid: string,
    username: string,
    id: number
    isAdmin: boolean
    face: number

    x: number
    y: number

    god: boolean
    mod: boolean
    can_god: boolean
    can_edit: boolean

    crown: boolean
    win: boolean
    team: number

    coins: number,
    blue_coins: number,
    deaths: number,
    checkpoint?: Point,
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

    #x: number
    #y: number
    #face: number

    #god: boolean
    #mod: boolean
    #can_god: boolean
    #can_edit: boolean
    
    #crown: boolean
    #win: boolean
    #team: number

    #coins: number
    #blue_coins: number
    #deaths: number
    #checkpoint?: Point
    #switches: Set<number>

    /**
     * @ignore
     */
    constructor(args: PlayerInitArgs) {
        super(args)

        this.client = args.client

        this.#x = args.x
        this.#y = args.y
        this.#face = args.face

        this.id = args.id
        this.isAdmin = args.isAdmin

        this.#god = args.god ?? false
        this.#mod = args.mod ?? false
        this.#can_god = args.can_god ?? false
        this.#can_edit = args.can_edit ?? false
    
        this.#crown = args.crown ?? false
        this.#win = args.win ?? false
        this.#team = args.team ?? 0
    
        this.#coins = args.coins ?? 0
        this.#blue_coins = args.blue_coins ?? 0
        this.#deaths = args.deaths ?? 0
        this.#checkpoint = args.checkpoint

        this.#switches = new Set() // TODO
    }

    //
    //
    // Setters & Getters
    //
    //

    public get face(): number {
        return this.#face
    }

    /**
     * Retrieve the players position as a point.
     * 
     * @example
     * 
     * ```ts
     * console.log(client.self.pos)
     * ```
     */
    public get pos(): Point {
        return { x: this.#x, y: this.#y }
    }

    /**
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
     * 
     * @example
     * ```ts
     * function swap_players(a: Player, b: Player) {
     *     const pos = { x: a.x, y: b.y }
     *     a.teleport(b)
     *     b.teleport(pos.x, pos.y)
     * }
     * ```
     */
    public set pos(value: [number, number] | { x: number, y: number}) {
        if (!this.client.connected)
            throw new Error(`Tried to run \`${this.username}.pos = ${value}\` on disconnected client.`)
        if (this.client.world?.owner !== this.client.self?.username && !this.client.self?.isAdmin)
            throw new Error(`Tried to run \`${this.username}.pos = ${value}\` without having permissions. Are you a world owner?`)

        if (Array.isArray(value)) {
            this.client.say(`/tp #${this.id} ${value[0]} ${value[1]}`)
        } else {
            this.client.say(`/tp #${this.id} ${value.x} ${value.y}`)
        }
    }

    /**
     * Does the player have edit rights?
     */
    public get canEdit() {
        return this.#can_edit
    }

    /**
     * Modify a users' edit rights.
     * @param {true | false} value 
     * @example
     * ```ts
     * client.on('player:join', ([player]) => {
     *     player.edit = true
     *     player.god = false
     * })
     * ```
     */
    public set canEdit(value: boolean) {
        if (!this.client.connected)
            throw new Error(`Tried to run \`${this.username}.canEdit = ${value}\` on disconnected client.`)
        if (this.client.world?.owner !== this.client.self?.username && !this.client.self?.isAdmin)
            throw new Error(`Tried to run \`${this.username}.canEdit = ${value}\` without having permissions. Are you a world owner?`)

        this.client.say(`/${value ? 'giveedit' : 'takeedit'} #${this.id}`)
    }

    /**
     * Does the player have god rights?
     */
    public get canGod() {
        return this.#can_god
    }

    /**
     * Modify a users' god mode rights.
     * @param {true | false} value 
     * @example
     * ```ts
     * client.on('player:join', ([player]) => {
     *     player.canGod = true
     * })
     * ```
     */
    public set canGod(value: boolean) {
        if (!this.client.connected)
            throw new Error(`Tried to run \`${this.username}.canGod = ${value}\` on disconnected client.`)
        if (this.client.world?.owner !== this.client.self?.username && !this.client.self?.isAdmin)
            throw new Error(`Tried to run \`${this.username}.canGod = ${value}\` without having permissions. Are you a world owner?`)

        this.client.say(`/${value ? 'givegod' : 'takegod'} #${this.id}`)
    }

    /**
     * Is the player in any kind of god mode?
     */
    public get flying() {
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
     * Force a user into god mode.
     * @param {true | false} value 
     * @example
     * ```ts
     * client.onCommand('afk', ([player]) => {
     *     player.god = true
     * })
     * ```
     */
    public set god(value: boolean) {
        if (!this.client.connected)
            throw new Error(`Tried to run \`${this.username}.god = ${value}\` on disconnected client.`)
        if (this.client.world?.owner !== this.client.self?.username && !this.client.self?.isAdmin)
            throw new Error(`Tried to run \`${this.username}.god = ${value}\` without having permissions. Are you a world owner?`)

        this.client.say(`/forcegod #${this.id} ${value ? 'true' : 'false'}`)
    }

    /**
     * Is the player in any kind of god mode?
     */
    public get crown() {
        return this.#crown
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
    public set crown(value: boolean) {
        if (!this.client.connected)
            throw new Error(`Tried to run \`${this.username}.flying = ${value}\` on disconnected client.`)
        if (this.client.world?.owner !== this.client.self?.username && !this.client.self?.isAdmin)
            throw new Error(`Tried to run \`${this.username}.flying = ${value}\` without having permissions. Are you a world owner?`)

        this.client.say(`/${value ? 'givecrown' : 'takecrown'} #${this.id}`)
    }

    /**
     * What team is the user of?
     */
    public get team(): 'red' | 'green' | 'blue' | 'cyan' | 'magenta' | 'yellow' | 'none' {
        switch (this.#team) {
            // case 0: return 'none'
            case 1: return 'red'
            case 2: return 'green'
            case 3: return 'blue'
            case 4: return 'cyan'
            case 5: return 'magenta'
            case 6: return 'yellow'
            default: return 'none'
        }
    }

    /**
     * Add the player to a team
     */
    public set team(value: 'red' | 'green' | 'blue' | 'cyan' | 'magenta' | 'yellow' | 'none' | number) {
        if (!this.client.connected)
            throw new Error(`Tried to run \`${this.username}.team = '${value}'\` on disconnected client.`)
        if (this.client.world?.owner !== this.client.self?.username && !this.client.self?.isAdmin)
            throw new Error(`Tried to run \`${this.username}.team = '${value}'\` without having permissions. Are you a world owner?`)

        this.client.say(`/team #${this.id} ${value}`)
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
}
