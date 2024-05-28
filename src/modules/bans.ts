import Client from '../client'
import Player, { PlayerBase, SelfPlayer } from '../types/player'
import { PlayerArray } from '../types/player-ds'
import fs from 'node:fs'
import YAML from 'yaml'
import StoredPlayerArray from './player-storage'

let client_self: SelfPlayer | null

function DEFAULT_PERMISSION_CHECK(p: Player) {
    if (!client_self) return false
    return p.cuid == client_self.cuid
}

export class BannedPlayer extends PlayerBase {
    public reason: string | undefined
    
    constructor(args: {
        cuid: string;
        username: string;
        reason: string | undefined;
    }) {
        super(args)
        this.reason = args.reason
    }

    static players: PlayerArray<BannedPlayer, true, true>

    static module(client: Client, PERMISSION_CALLBACK: ((p: Player) => boolean) = DEFAULT_PERMISSION_CHECK) {

        client.once('start', ([p]) => {
            client_self = p
        })

        client.onCommand('ban', PERMISSION_CALLBACK, ([player, _, to_ban, reason]) => {
            if (!to_ban) return

            to_ban = to_ban.toUpperCase()

            const similar = Array.from(client.globalPlayers.values()).filter(p => p.username.includes(to_ban))
            const to_ban_player = Array.from(client.globalPlayers.values()).find(p => to_ban == p.username)

            if (to_ban_player) {
                this.players.push(new BannedPlayer({...to_ban_player, reason }))
                player.pm('Banned: ' + to_ban_player.username)

                const bannedPlayer = client.players.find(v => v.cuid == to_ban_player.cuid && player.id != client.self?.id)
                if (bannedPlayer) bannedPlayer.kick(reason)

                return
            }

            if (similar.length > 0) {
                return player.pm(`Could not ban. Did you mean any of: ${similar.map(p => p.username).join(', ')}?`)
            }

            return player.pm('Could not find any player.')
        })

        client.onCommand('unban', PERMISSION_CALLBACK, ([player, _, to_unban]) => {
            to_unban = to_unban.toUpperCase()

            const similar = this.players.filter(p => p.username.includes(to_unban))
            const to_unban_player = this.players.remove_all(p => to_unban == p.username)

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

            if (match = this.players.find(p => p.cuid == player.cuid && player.id != client.self?.id)) {
                player.kick(match.reason)
            }
        })

        return client
    }
}

/**
 * This module generates a module function that will log certain events.
 */
export default (PATH: string = 'bans.yaml', PERMISSION_CALLBACK: ((p: Player) => boolean) = DEFAULT_PERMISSION_CHECK) => {
    const k = new StoredPlayerArray(PATH, BannedPlayer, [{
        username: 'TESTUSER',
        cuid: 'testuserid',
        reason: 'Reason Goes Here'
    }])

    k.module_args = [PERMISSION_CALLBACK]
    return k
}
