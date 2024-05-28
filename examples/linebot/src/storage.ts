import Client, { PlayerArray, PlayerBase } from "../../../dist"

export class StoredPlayer extends PlayerBase {
    public wins: number = 0
    public rounds: number = 0
    public time: number = 0

    constructor(args: any) { super(args) }

    static players: PlayerArray<StoredPlayer, true, true>

    static module(client: Client) {

        client.on('player:join', ([p]) => {
            if (this.players.some(k => k.cuid == p.cuid)) return
            this.players.push(new StoredPlayer(p))
        })

        client.onCommand('wins', ([p]) => {
            const player = StoredPlayer.players.byCuid(p.cuid)
            if (player) return `Your wins: ${player.wins}`
        })

        client.onCommand('rounds', ([p]) => {
            const player = StoredPlayer.players.byCuid(p.cuid)
            if (player) return `Your rounds: ${player.rounds}`
        })

        client.onCommand('time', ([p]) => {
            const player = StoredPlayer.players.byCuid(p.cuid) as StoredPlayer
            if (player) return `Total Time in Game: ${player.time.toFixed(1)}s`
        })

        return client
    }
}