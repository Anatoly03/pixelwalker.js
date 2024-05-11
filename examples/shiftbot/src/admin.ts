

import Client, { Player } from '../../../dist/index.js'
import client from './shift.js'

export function is_bot_admin(player: Player) {
    return player.cuid == client.self?.cuid
}

export function module (client: Client) {

    return client
}