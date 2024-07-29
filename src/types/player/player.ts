import EventEmitter from "events"
import Client from "../../client.js"
import { Point } from "../index.js"
import { PublicProfile } from "./profile.js"
import SelfPlayer from "./self.js"
import { Team, TeamIdentifier } from "./team.js"
import { BlockMappings, BlockMappingsReverse } from "../../data/mappings.js"
import palette_fix from "../../data/palette_fix.js"

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
    UpdateRights: [boolean, boolean],
    ChatMessage: [string],
    // PlayerLeft: [],
    PlayerMoved: [number, number, number, number, number, number, -1 | 0 | 1, -1 | 0 | 1, boolean, boolean, number],
    PlayerTeleported: [number, number],
    PlayerFace: [number],
    PlayerGodMode: [boolean],
    PlayerModMode: [boolean],
    PlayerRespawn: [number, number],
    PlayerReset: [number | undefined, number | undefined],
    PlayerTouchBlock: [number, number, number],
    PlayerTouchPlayer: [number, 0 | 1],
    PlayerEffect: any[],
    PlayerRemoveEffect: [number],
    PlayerResetEffects: [],
    PlayerTeam: [number],
    PlayerCounters: [number, number, number],
    PlayerLocalSwitchChanged: [number, number],
    PlayerLocalSwitchReset: [number],
}

/**
 * ```ts
 * const player = client.players.random()
 * player.crown(true)
 * player.edit(true)
 * player.god(false)
 * ```
 */
export default class Player {
    protected readonly client: Client
    protected readonly events = new EventEmitter<PlayerEvents>()

    public readonly cuid: string
    public readonly username: string
    public readonly id: number
    public readonly isAdmin: boolean
    #isSelf: boolean

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

    // Movement
    #x: number
    #y: number
    #tickId: number

    /**
     * @ignore
     */
    constructor(args: PlayerInitArgs) {
        this.client = args.client

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

        // Movement
        this.#x = args.x
        this.#y = args.y
        this.#tickId = 0

        this.registerEvents()
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
        return this.client
            .pocketbase()
            .collection('public_profiles')
            .getFirstListItem(this.client.pocketbase().filter(`id ~ ${this.cuid}`))
    }

    //
    //
    // Satic
    //
    //

    private registerEvents() {
        /**
         * The player rights changed.
         */
        this.on('UpdateRights', (can_edit, can_god) => {
            this.#can_edit = can_edit
            this.#can_god = can_god
        })

        /**
         * The player moved.
         */
        this.on('PlayerMoved', (x, y, speed_x, speed_y, mod_x, mod_y, horizontal, vertical, space_down, space_just_down, tick_id) => {
            if (tick_id > this.#tickId) return // Drop Packet

            this.#x = x / 16
            this.#y = y / 16
            this.#tickId = tick_id
        })

        /**
         * The player was forcefully teleported.
         */
        this.on('PlayerTeleported', (x, y) => {
            this.#x = x / 16
            this.#y = y / 16

            // TODO Momentum changes?
        })

        /**
         * The player changed face.
         */
        this.on('PlayerFace', (face) => {
            this.#face = face
        })

        /**
         * The players' god mode state changed.
         */
        this.on('PlayerGodMode', (state) => {
            this.#god = state
            this.#mod = false
        })

        /**
         * The players' mod mode state changed.
         */
        this.on('PlayerModMode', (state) => {
            this.#god = false
            this.#mod = state
        })

        /**
         * The player respawned.
         */
        this.on('PlayerRespawn', (x, y) => {
            this.#x = x / 16
            this.#y = y / 16
        })

        /**
         * The player was reset.
        */
        // TODO
        this.on('PlayerReset', (x, y) => {
            if (x && y) {
                this.#x = x / 16
                this.#y = y / 16
            }

            this.#crown = false
            this.#win = false
            this.#team = new Team(0)

            this.#coins = 0
            this.#blue_coins = 0
            this.#deaths = 0
            this.#checkpoint = undefined
        })

        /**
         * The player interacted a block.
         */
        // TODO
        this.on('PlayerTouchBlock', (x, y, bid) => {
            const block = BlockMappingsReverse[bid]
            const fix = (name: string) => (palette_fix[name as keyof typeof palette_fix]) ?? name

            switch (block) {
                case fix('key_red'): {
                    // TODO
                    break
                }
                case fix('crown_gold'): {
                    // TODO reset old crown
                    this.#crown = true
                    break
                }
                case fix('crown_silver'): {
                    this.#win =  true
                    break
                }
                case fix('tool_checkpoint'): {
                    this.#checkpoint = { x, y }
                    break
                }
                case fix('tool_god_mode_activator'): {
                    this.#can_god = true
                    break
                }
            }
        })

        /**
         * The player interacted a player.
         */
        // TODO
        this.on('PlayerTouchPlayer', (id, state) => { })

        /**
         * The player interacted a player.
         */
        // TODO
        this.on('PlayerEffect', () => { })

        /**
         * The player interacted a player.
         */
        // TODO
        this.on('PlayerRemoveEffect', (id) => { })

        /**
         * The player touched the effect removal button/
         */
        // TODO
        this.on('PlayerResetEffects', () => { })

        /**
         * The player became member of a team.
         */
        // TODO
        this.on('PlayerTeam', (team) => {
            this.#team = new Team(team as any)
        })

        /**
         * The player touched the effect removal button
         */
        // TODO
        this.on('PlayerCounters', (gold_coins, blue_coins, death_count) => {
            this.#coins = gold_coins
            this.#blue_coins = blue_coins
            this.#deaths = death_count
        })


        /**
         * The player touched a local switch.
         */
        // TODO
        this.on('PlayerLocalSwitchChanged', (id, state) => { })


        /**
         * The player resetted a local switch.
         */
        // TODO
        this.on('PlayerLocalSwitchReset', (id) => { })

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
        this.events.on(event, callback as any)
        return this
    }

    /**
     * @ignore
     */
    public once<K extends keyof PlayerEvents>(event: K, callback: (...args: PlayerEvents[K]) => void): this {
        this.events.once(event, callback as any)
        return this
    }

    /**
     * @ignore
     */
    public emit<K extends keyof PlayerEvents>(event: K, ...args: PlayerEvents[K]): this {
        this.events.emit(event, ...args as any)
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
     * Receive and increment a new tick id.
     */
    protected getNewTickId(): number {
        return this.#tickId ++
    }

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
