import Client from "../client.js"
import { MessageType } from "../data/consts.js"
import { Magic, Bit7 } from "../types.js"
import Player, { PlayerBase, SelfPlayer } from "../types/player.js"
import World from "../types/world.js"

/**
 * This module generates a module function that will log certain events.
 */
export default function Module(client: Client): Client {
    /**
     * When receiving a chat message, emit.
     */
    client.raw.on('chatMessage', async ([id, message]) => {
        const player = await client.wait_for(() => client.players.get(id))
        client.emit('chat', [player, message])
    })

    return client
}

