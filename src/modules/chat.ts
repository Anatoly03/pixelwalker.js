import Client from "../client.js"

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

    /**
     * When receiving a private message, emit.
     */
    client.system.on('receivePm', async ([username, message]) => {
        const players = await client.wait_for(() => Array.from(client.players.values()).filter(p => p.username == username))
        client.emit('chat:pm', [players[0], message])
    })

    return client
}

