import Client from "../client.js"

/**
 * This module generates a module function that will log certain events.
 */
export default function Module(client: Client): Client {
    /**
     * When receiving a chat message, emit.
     */
    client.raw.on('chatMessage', async ([id, message]) => {
        const player = client.players.get(id)
        if (!player) throw new Error('Unreachable!')
        client.emit('chat', [player, message])
    })

    /**
     * When receiving a private message, emit.
     */
    client.system.on('receivePm', async ([username, message]) => {
        const players = Array.from(client.players.values()).filter(p => p.username == username)
        if (!players) throw new Error('Unreachable!')
        client.emit('chat:pm', [players[0], message])
    })

    return client
}

