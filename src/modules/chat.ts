import Client from "../client.js"
import Player from "../types/player.js"

/**
 * This module generates a module function that will log certain events.
 */
export default function Module(client: Client): Client {
    /**
     * When receiving a chat message, emit.
     */
    client.raw.on('chatMessage', async ([id, message]) => {
        const player = client.players.byId<true>(id)
        // if (!player) return
        client.emit('chat', [player, message])
    })

    /**
     * When receiving a private message, emit.
     */
    client.raw.on('chatPrivateMessage', async ([id, message]) => {
        const player = client.players.byId<true>(id)
        // if (!player) return
        client.emit('chat:pm', [player, message])
    })

    return client
}

