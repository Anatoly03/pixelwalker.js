import Client, { PlayerArray, PlayerBase } from "../../../dist"

export class StoredPlayer extends PlayerBase {
    static players: PlayerArray<StoredPlayer>
    constructor(args) { super(args) }

    public wins: number = 0
    public rounds: number = 0
    public time: number = 0

    static module(client: Client) {

        client.onCommand('wins', ([p]) => {
            const player = StoredPlayer.players.byCuid(p.cuid)
            if (player) return `Your wins: ${player.wins}`
        })

        client.onCommand('rounds', ([p]) => {
            const player = StoredPlayer.players.byCuid(p.cuid)
            if (player) return `Your rounds: ${player.rounds}`
        })

        client.onCommand('time', ([p]) => {
            const player = StoredPlayer.players.byCuid(p.cuid)
            if (player) return `Your total time: ${player.time}`
        })

        return client
    }
}
