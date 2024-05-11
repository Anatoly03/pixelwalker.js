import { Client } from ".."
import { EventEmitter } from 'events'
import Player from "../types/player"

type GameRoundEvents = {
    'start': [Player[]]
    'eliminate': [Player, 'left' | 'god' | 'kill']
}

export class GameRound extends EventEmitter<GameRoundEvents> {
// export class GameRound<V extends {[keys: string]: any[]}> extends EventEmitter<GameRoundEvents | V> {
    private client: Client
    private players: Player[]
    private loop: () => Promise<any> = () => Promise.resolve({})
    
    private GAME_RUNNING = false

    constructor(client: Client) {
        super()
        this.client = client
        this.players = []
    }

    public start() {
        if (this.GAME_RUNNING) return
        this.GAME_RUNNING = true
        this.emit('start', this.players)
        this.runLoop()
    }

    public setLoop(callback: () => Promise<any>) {
        this.loop = callback
    }

    private async runLoop() {
        await this.loop()
        if (!this.GAME_RUNNING) return
        setTimeout(this.runLoop.bind(this), 0)
    }

    public stop() {
        this.GAME_RUNNING = false
    }

    public async signup(callback: (p: Player) => boolean = (p) => !p.god_mode && !p.mod_mode) {
        const players = await this.client.wait_for(() => this.client.players)
        this.players = Array.from(players.values()).filter(callback)
    }

    public eliminate(p: Player, reason: 'left' | 'god' | 'kill') {
        this.players = this.players.filter(q => q.id != p.id)
        this.emit('eliminate', p, reason)
    }

    public forEachPlayer(callback: (p: Player) => void) {
        this.players.forEach(callback)
    }

    public setPlayers(players: Player[]) {
        this.players = players
    }

    public module(client: Client) {
        this.client.on('player:god', ([p]) => {
            if (p.god_mode) this.eliminate(p, 'god')
        })

        this.client.on('player:death', ([p]) => {
            this.eliminate(p, 'kill')
        })
    
        this.client.on('player:leave', ([p]) => {
            this.eliminate(p, 'left')
        })

        return client
    }
}