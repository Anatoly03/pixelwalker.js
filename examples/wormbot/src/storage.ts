
import Client, { PlayerArray, PlayerBase } from "../../../dist"

export class StoredPlayer extends PlayerBase {
    public wins: number = 0     // Survived so many times more than five minutes
    public rounds: number = 0   // Played so many games
    public time: number = 0     // Played so much times
    public kills: number = 0    // Eliminated so many players as wormer

    constructor(args: any) { super(args) }

    static players: PlayerArray<StoredPlayer, true, true>

    static module(client: Client) {

        client.on('player:join', ([p]) => {
            if (this.players.some(k => k.cuid == p.cuid)) return
            this.players.push(new StoredPlayer(p))
        })

        client.onCommand('stats', ([p]) => {
            const player = StoredPlayer.players.byCuid(p.cuid)
            if (!player) return
            let s = `You won ${player.wins} of ${player.rounds} times. `
            if (player.rounds > 0) s += `Win Accuracy: ${(player.wins / player.rounds).toFixed(1)}% `
            s += `Your kill count: ${player.kills} `
            if (player.kills > 0) s += `Kills per rounds: ${(player.kills / player.rounds).toFixed(1)}% `
            s += `Total Played: ${player.time.toFixed(1)}s `
            return s
        })

        client.onCommand('wins', ([p]) => {
            const player = StoredPlayer.players.byCuid(p.cuid)
            if (player) return `Rounds: ${player.wins}`
        })

        client.onCommand('rounds', ([p]) => {
            const player = StoredPlayer.players.byCuid(p.cuid)
            if (player) return `Rounds: ${player.rounds}`
        })

        client.onCommand('time', ([p]) => {
            const player = StoredPlayer.players.byCuid(p.cuid) as StoredPlayer
            if (player) return `Total Time in Game: ${player.time.toFixed(1)}s`
        })

        return client
    }
}
