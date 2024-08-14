import Client from '../client/client.js'
import { PlayerBase } from '../types/index.js';
import Player from '../types/player/player.js'
import SelfPlayer from '../types/player/self.js';
import PlayerStorage from './player-storage.js'

class BannedPlayer implements PlayerBase {
    public cuid: string;
    public username: Uppercase<string>;
    public reason: string | undefined

    constructor(args: BannedPlayer) {
        this.cuid = args.cuid
        this.username = args.username
        this.reason = args.reason
    }
}

export default class BannedPlayersManager extends PlayerStorage<BannedPlayer> {
    #permissionCallback: (p: Player) => boolean
    #client_self: SelfPlayer | undefined

    constructor(path: string, PERMISSION_CALLBACK: ((p: Player) => boolean) =
        (p) => (this.#client_self != undefined && this.#client_self.cuid == p.cuid)) {
        // console.log('hi')
        super(path, BannedPlayer, [{
            username: 'TESTUSER',
            cuid: 'testuserid',
            reason: 'Reason Goes Here'
        }])

        this.#permissionCallback = PERMISSION_CALLBACK
    }

    public override module(client: Client) {

        client.once('start', ([p]) => {
            this.#client_self = p
        })

        client.onCommand('ban', this.#permissionCallback, ([player, _, to_ban, reason]) => {
            if (!to_ban) return

            to_ban = to_ban.toUpperCase()

            const similar = Array.from(client.profiles.values()).filter(p => p.username.includes(to_ban))
            const to_ban_player = Array.from(client.profiles.values()).find(p => to_ban == p.username)

            if (to_ban_player) {
                this.push(new BannedPlayer({ ...to_ban_player, reason, cuid: to_ban_player.id }))
                player.pm('Banned: ' + to_ban_player.username)

                const bannedPlayer = client.players.find(v => v.cuid == to_ban_player.id && player.id != client.self?.id)
                if (bannedPlayer) bannedPlayer.kick(reason)

                return
            }

            if (similar.length > 0) {
                return player.pm(`Could not ban. Did you mean any of: ${similar.map(p => p.username).join(', ')}?`)
            }

            return player.pm('Could not find any player.')
        })

        client.onCommand('unban', this.#permissionCallback, ([player, _, to_unban]) => {
            to_unban = to_unban.toUpperCase()

            const similar = this.filter(p => p.username.includes(to_unban))
            const to_unban_player = this.remove_all(p => to_unban == p.username)

            if (to_unban_player.length > 0) {
                player.pm('Unbanned: ' + to_unban_player.first()?.username)
                return
            }

            if (similar.length > 0) {
                return player.pm(`Could not unban. Did you mean any of: ${similar.map(p => p.username).join(', ')}?`)
            }

            return player.pm('Could not find any player.')
        })

        client.on('player:join', async ([player]) => {
            let match

            if (match = this.find(p => p.cuid == player.cuid && player.id != client.self?.id)) {
                player.kick(match.reason)
            }
        })

        return client
    }
}
