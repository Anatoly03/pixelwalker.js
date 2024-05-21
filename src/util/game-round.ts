import { Client } from ".."
import { EventEmitter } from 'events'
import Player from "../types/player"

type GameRoundEvents = {
    'start': [Player[]]
    'eliminate': [Player, 'left' | 'god' | 'kill']
}

export class GameRound extends EventEmitter<GameRoundEvents> {
// export class GameRound<V extends {[keys: string]: any[]}> extends EventEmitter<GameRoundEvents | V> {
    public players: Player[]
    
    public running = false

    private client: Client
    private loop: () => Promise<any> = () => Promise.resolve({})

    constructor(client: Client) {
        super()
        this.client = client
        this.players = []
    }

    public start() {
        if (this.running) return
        this.running = true
        this.emit('start', this.players)
        this.runLoop()
    }

    public setLoop(callback: () => Promise<any>) {
        this.loop = callback
    }

    private async runLoop() {
        await this.loop()
        if (!this.running) return
        setTimeout(() => this.runLoop(), 0)
    }

    public stop() {
        this.running = false
    }

    public async signup(callback: (p: Player) => boolean = (p) => !p.god_mode && !p.mod_mode) {
        const { players } = this.client
        this.players = Array.from(players.values()).filter(callback)
    }

    private eliminate(p: Player, reason: 'left' | 'god' | 'kill') {
        if (!this.running) return // Game not running, ignore.
        if (this.players.findIndex(v => v.id == p.id) == -1) return // Not active player, can't eliminate
        this.players = this.players.filter(q => q.id != p.id)
        this.emit('eliminate', p, reason)
    }

    public module(client: Client) {
        client.on('player:god', ([p]) => {
            // console.log(this)
            // console.log(client.self)
            if (p.god_mode) this.eliminate(p, 'god')
        })

        client.on('player:death', ([p]) => {
            this.eliminate(p, 'kill')
        })
    
        client.on('player:leave', ([p]) => {
            this.eliminate(p, 'left')
        })

        return client
    }
}