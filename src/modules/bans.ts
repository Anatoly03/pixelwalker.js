import Client from '../client'
import Player, { SelfPlayer } from '../types/player'
import fs from 'node:fs'
import YAML from 'yaml'

let client_self: SelfPlayer | null

function DEFAULT_PERMISSION_CHECK(p: Player) {
    if (!client_self) return false
    return p.cuid == client_self.cuid
}

/**
 * This module generates a module function that will log certain events.
 */
export default (PATH: string = 'bans.yaml', PERMISSION_CALLBACK: ((p: Player) => boolean) = DEFAULT_PERMISSION_CHECK) => {
    if (!fs.existsSync(PATH)) {
        fs.writeFileSync(PATH, YAML.stringify([{
            username: 'TESTUSER',
            cuid: 'testuserid',
            reason: 'Reason Goes Here'
        }]))
    }

    return (client: Client) => {
        client.once('start', ([p]) => {
            client_self = p
        })

        client.on('cmd:ban', ([player, _, to_ban, reason]) => {
            if (!PERMISSION_CALLBACK(player)) return
            if (!to_ban) return

            to_ban = to_ban.toUpperCase()

            const similar = Array.from(client.globalPlayers.values()).filter(p => p.username.includes(to_ban))
            const to_ban_player = Array.from(client.globalPlayers.values()).find(p => to_ban == p.username)

            if (to_ban_player) {
                const BANLIST_NEW = [...YAML.parse(fs.readFileSync(PATH).toString('ascii')), { username: to_ban_player.username, cuid: to_ban_player.cuid, reason }]
                fs.writeFileSync(PATH, YAML.stringify(BANLIST_NEW))
                player.pm('[BOT] Banned: ' + to_ban_player.username)
                return
            }

            if (similar.length > 0) {
                return player.pm(`[BOT] Could not ban. Did you mean any of: ${similar.map(p => p.username).join(', ')}?`)
            }

            return player.pm('[BOT] Could not find any player.')
        })

        client.on('cmd:unban', ([player, _, to_unban]) => {
            if (!PERMISSION_CALLBACK(player)) return

            to_unban = to_unban.toUpperCase()

            const BANLIST: { username: string, cuid: string, reason: string }[] = YAML.parse(fs.readFileSync(PATH).toString('ascii'))
            const similar = BANLIST.filter(p => p.username.includes(to_unban))
            const to_unban_player = BANLIST.find(p => to_unban == p.username)

            if (to_unban_player) {
                const BANLIST_NEW = BANLIST.filter(p => p.cuid != to_unban_player.cuid)
                fs.writeFileSync(PATH, YAML.stringify(BANLIST_NEW))
                player.pm('[BOT] Unbanned: ' + to_unban_player.username)
                return
            }

            if (similar.length > 0) {
                return player.pm(`[BOT] Could not unban. Did you mean any of: ${similar.map(p => p.username).join(', ')}?`)
            }

            return player.pm('[BOT] Could not find any player.')
        })

        client.on('player:join', async ([player]) => {
            const BANLIST: { username: string, cuid: string, reason: string }[] = YAML.parse(fs.readFileSync(PATH).toString('ascii'))
            let match

            if (match = BANLIST.find(p => p.cuid == player.cuid)) {
                const { cuid, username, reason } = match
                player.kick(reason)
            }
        })

        return client
    }
}
