import Client from "./event.js";

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

    constructor(args: {
        client: Client,
        id: number,
        cuid: string,
        username: string,
        face: number,
        isAdmin: boolean,
        x: number,
        y: number,
        god_mode?: boolean
        mod_mode?: boolean
        has_crown?: boolean
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

        this.coins = 0
        this.blue_coins = 0
        this.deaths = 0
    }

    public equals(other: Player): boolean {
        return this.cuid == other.cuid
    }

    public async pm(content: string) {
        this.client.say(`/pm ${this.username} ${content}`)
    }

    public async respond(content: string) {
        this.client.say(`${this.username}: ${content}`)
    }

    public async kick(reason: string) {
        this.client.say(`/kick ${this.username} ${reason}`)
    }

    public async edit(value: boolean) {
        this.client.say(`/${value ? 'giveedit' : 'takeedit'} ${this.username}`)
    }
}
