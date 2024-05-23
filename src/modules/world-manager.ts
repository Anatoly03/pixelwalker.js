import { Client, Player } from "..";
import { PlayerBase } from "../types/player";

/**
 * This module generates a module function that will log certain events.
 */
export default function Module(client: Client): Client {
    /**
     * TODO
     */
    client.raw.on('placeBlock', async ([id, x, y, layer, bid, ...args]) => {
        const player = client.players.byId<true>(id)
        const world = await client.wait_for(() => client.world)
        const [position, block] = world.set(x, y, layer, bid, args)

        client.emit('player:block', [player, position, block])
    })

    /**
     * Update world metadata
     * // TODO Emit events?
     */ 
    client.raw.on('worldMetadata', async ([title, plays, owner]) => {
        const world = await client.wait_for(() => client.world)

        world.title = title
        world.owner = owner
        world.plays = plays
    })

    /**
     * TODO
     */
    client.raw.on('worldCleared', async ([]) => {
        const world = await client.wait_for(() => client.world)
        world.clear(true)
        client.emit('world:clear', [])
    })

    /**
     * Reload world with new buffer.
     */
    client.raw.on('worldReloaded', async ([buffer]) => {
        const world = await client.wait_for(() => client.world)
        world.init(buffer)
    })

    return client
}

