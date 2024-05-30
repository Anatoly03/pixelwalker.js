
import Client, { PlayerBase, PlayerStorage } from "../../../dist"

export class StoredPlayer extends PlayerBase {
    public wins: number = 0     // Survived so many times more than five minutes
    public rounds: number = 0   // Played so many games
    public time: number = 0     // Played so much times
    public kills: number = 0    // Eliminated so many players as wormer
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
            if (player) return `Wins: ${player.wins}`
        })

        client.onCommand('rounds', ([p]) => {
            const player = this.byCuid(p.cuid)
            if (player) return `Rounds: ${player.rounds}`
        })

        client.onCommand('time', ([p]) => {
            const player = this.byCuid(p.cuid) as StoredPlayer
            if (player) return `Total Time in Game: ${player.time.toFixed(1)}s`
        })

        return client
    }
}
