import Client from "./event";

export default class Player {
    private readonly client: Client

    constructor(args) {
        this.client = args.client

        // _client = client
        // id = null
        // cuid = null
        // username = null
        // face = null
        // isAdmin = false
        // x = null
        // y = null
        // god_mode = false
        // mod_mode = false
        // has_crown = false
    }

    public async pm(content: string) {
        // TODO /pm
    }

    public async respond(content: string) {
        // TODO "USERNAME: message"
    }

    public async kick(reason: string) {
        // TODO /kick USERNAME
    }

    public async edit(value: boolean) {
        // TODO /giveedit, /takeedit
    }
}