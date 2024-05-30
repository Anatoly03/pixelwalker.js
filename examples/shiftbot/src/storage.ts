
import Client, { PlayerArray, PlayerBase, PlayerStorage } from "../../../dist"

export class StoredPlayer extends PlayerBase {
    public gold: number = 0
    public silver: number = 0
    public bronze: number = 0
    public games: number = 0
    public rounds: number = 0
    public time: number = 0
}

export class StoredPlayerManager extends PlayerStorage<StoredPlayer> {
    public override module(client: Client) {

        client.on('player:join', ([p]) => {
            if (this.byCuid(p.cuid) != undefined) return
            this.push(new StoredPlayer(p))
        })

        client.onCommand('wins', ([p]) => {
            const player = this.byCuid(p.cuid)
            if (player) return `Your medals: Gold ${player.gold}, Silver ${player.silver}, Bronze ${player.bronze}`
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
