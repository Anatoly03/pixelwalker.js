import Client from "../client.js";

export default class Player {
    private readonly client: Client

    public readonly id: number
    public readonly cuid: string
    public readonly username: string

    public face: number
    public isAdmin: boolean
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
        this.client = args.client

        this.id = args.id
        this.cuid = args.cuid
        this.username = args.username

        this.face = args.face
        this.isAdmin = args.isAdmin
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

    public async reset() {
        this.client.say(`/resetplayer ${this.username}`)
    }
}
