import Client, { PlayerArray, PlayerStorage } from "../../../dist"
import { PlayerBase } from "../../../dist/types/index.js"

export class StoredPlayer implements PlayerBase {
    public username: Uppercase<string>
    public cuid: string
    public wins: number = 0
    public rounds: number = 0
    public time: number = 0

    constructor ({ username, cuid }: PlayerBase) {
        this.username = username
        this.cuid = cuid
    }
}

export class StoredPlayerManager extends PlayerStorage<StoredPlayer> {
    public override module(client: Client) {

        client.on('player:join', ([p]) => {
            if (this.byCuid(p.cuid) != undefined) return
            this.push(new StoredPlayer(p))
        })

        client.onCommand('wins', ([p]) => {
            const player = this.byCuid(p.cuid)
            if (player) return `Your wins: ${player.wins}`
        })

        client.onCommand('rounds', ([p]) => {
            const player = this.byCuid(p.cuid)
            if (player) return `Your rounds: ${player.rounds}`
        })

        client.onCommand('time', ([p]) => {
            const player = this.byCuid(p.cuid) as StoredPlayer
            if (player) return `Total Time in Game: ${player.time.toFixed(1)}s`
        })

        return client
    }
}
