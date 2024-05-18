import { Client, Player, World } from "..";
import { PlayerBase } from "../types/player";

/**
 * This module generates a module function that will log certain events.
 */
export default function Module(client: Client): Client {
    /**
     * TODO
     */
    client.raw.on('placeBlock', async ([id, x, y, layer, bid, ...args]) => {
        if (!client.players || !client.world) return
        const [position, block] = client.world.set(x, y, layer, bid, args)
        client.emit('player:block', [client.players.get(id) as Player, position, block])
    })

    /**
     * Update world metadata
     * // TODO Emit events?
     */ 
    client.raw.on('worldMetadata', async ([title, plays, owner]) => {
        if (!client.world) return
        client.world.title = title
        client.world.owner = owner
        client.world.plays = plays
    })

    /**
     * TODO
     */
    client.raw.on('worldCleared', async ([]) => {
        if (!client.world) return
        client.world.clear(true)
        client.emit('world:clear', [])
    })

    /**
     * Reload world with new buffer.
     */
    client.raw.on('worldReloaded', async ([buffer]) => {
        if (!client.world) return
        client.world.init(buffer)
    })

    return client
}

