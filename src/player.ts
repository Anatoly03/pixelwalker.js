import Client from "./event";

export default class Player {
    private readonly client: Client
    public readonly id: number
    public readonly cuid: string
    public readonly username: string

    constructor(args: { client: Client, id: number, cuid: string, username: string }) {
        this.client = args.client

        this.id = args.id
        this.cuid = args.cuid
        this.username = args.username

        // face = null
        // isAdmin = false
        // x = null
        // y = null
        // god_mode = false
        // mod_mode = false
        // has_crown = false
    }

    public equals(other: Player): boolean {
        return this.cuid == other.cuid
    }

    public async pm(content: string) {
        this.client.say(`/pm ${this.username} ${content}`)
    }

    public async respond(content: string) {
        // TODO "USERNAME: message"
    }

    public async kick(reason: string) {
        this.client.say(`/kick ${this.username} ${reason}`)
    }

    public async edit(value: boolean) {
        this.client.say(`/${value ? 'giveedit' : 'takeedit'} ${this.username}`)
    }
}