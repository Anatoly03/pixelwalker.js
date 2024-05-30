
import Client, { PlayerArray, PlayerBase, PlayerStorage } from "../../../dist"
import { is_bot_admin } from "./worm"

export class StoredPlayer extends PlayerBase {
    public wins: number = 0     // Survived so many times more than five minutes
    public rounds: number = 0   // Played so many games
    public time: number = 0     // Played so much times
    public kills: number = 0    // Eliminated so many players as wormer

    constructor(args: any) { super(args) }
}

export class StoredPlayerManager extends PlayerStorage<StoredPlayer> {
    public override module(client: Client) {

        client.on('player:join', ([p]) => {
            if (this.byCuid(p.cuid) != undefined) return
            this.push(new StoredPlayer(p))
        })

        client.onCommand('stats', ([p]) => {
            const player = this.byCuid(p.cuid)
            if (!player) return
            let s = `You won ${player.wins} of ${player.rounds} times. `
            if (player.rounds > 0) s += `Win Accuracy: ${(player.wins / player.rounds).toFixed(1)}% `
            s += `Your kill count: ${player.kills} `
            if (player.kills > 0) s += `Kills per rounds: ${(player.kills / player.rounds).toFixed(1)}% `
            s += `Total Played: ${player.time.toFixed(1)}s `
            return s
        })

        client.onCommand('wins', ([p]) => {
            const player = this.byCuid(p.cuid)
            if (player) return `Rounds: ${player.wins}`
        })

        client.onCommand('rounds', ([p]) => {
            const player = this.byCuid(p.cuid)
            if (player) return `Rounds: ${player.rounds}`
        })

        client.onCommand('time', ([p]) => {
            const player = this.byCuid(p.cuid) as StoredPlayer
            if (player) return `Total Time in Game: ${player.time.toFixed(1)}s`
        })

        client.onCommand('add', is_bot_admin, ([p]) => {
            const player = this.byCuid(p.cuid) as StoredPlayer
            // console.log('pfff', ((<any>this).data)[0])
            // console.log('pss', new Array(((<any>this).data)[0]))
            console.log('players', this)
            // console.log('to array', this.toArray())
            console.log(this.map(x => x))
            console.log(player)
            console.log()
            if (player) {
                player.wins = 10
                console.log(player)
                console.log(this.is_mut())
                return 'Should work!'
            }
        })

        return client
    }
}
