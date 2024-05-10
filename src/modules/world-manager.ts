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
        if (client.scheduler == null) return

        const player = await client.wait_for(() => client.players.get(id))
        const world = await client.wait_for(() => client.world)
        const [position, block] = world.place(x, y, layer, bid, args)
        
        const key: `${number}.${number}.${0|1}` = `${x}.${y}.${layer}`
        const entry = client.scheduler.block_queue.get(key)

        // console.log('receive', block.name)

        if (entry) {
            client.scheduler.block_queue.delete(key)
        }
        // if (client.self && entry && client.self.id == id) {
        //     if (client.scheduler.block_queue.get(key)?.isSameAs(block)) {
        //         client.scheduler.block_queue.delete(key)
        //     }
        // }

        client.emit('player:block', [player, position, block])
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

