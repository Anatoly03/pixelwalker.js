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
    
    private client: Client
    private GAME_RUNNING = false
    private loop: () => Promise<any> = () => Promise.resolve({})

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
        setTimeout(() => this.runLoop(), 0)
    }

    public stop() {
        this.GAME_RUNNING = false
    }

    public async signup(callback: (p: Player) => boolean = (p) => !p.god_mode && !p.mod_mode) {
        const players = await this.client.wait_for(() => this.client.players)
        this.players = Array.from(players.values()).filter(callback)
    }

    private eliminate(p: Player, reason: 'left' | 'god' | 'kill') {
        if (!this.GAME_RUNNING) return
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