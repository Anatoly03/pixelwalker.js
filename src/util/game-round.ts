import { Client } from "..";
import Player from "../types/player";

// TODO This class is currently unused.

export abstract class GameRound<P extends Player> {
    client: Client
    players: Player[]

    constructor(client: Client) {
        this.client = client
        this.players = []
    }

    public signup(callback: (p: Player) => boolean = (p) => !p.god_mode && !p.mod_mode) {
        this.players = Array.from(this.client.players.values()).filter(callback)
    }

    public eliminate(p: Player, reason: string) {
        this.players = this.players.filter(q => q.id != p.id)
    }

    protected disqualify_events() {
        this.client.on('player:god', ([p]) => {
            if (p.god_mode) this.eliminate(p, 'turned on godmode')
        })

        this.client.on('player:death', ([p]) => {
            this.eliminate(p, 'died')
        })
    
        this.client.on('player:leave', ([p]) => {
            this.eliminate(p, 'left the world')
        })
    }
}