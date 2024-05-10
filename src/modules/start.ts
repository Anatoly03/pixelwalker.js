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
     * On init, set everything up
     */
    client.raw.once('init', async ([id, cuid, username, face, isAdmin, x, y, can_edit, can_god, title, plays, owner, global_switch_states, width, height, buffer]) => {
        await client.send(Magic(0x6B), Bit7(MessageType['init']))

        client.world = new World(width, height)
        client.world.init(buffer)

        client.self = new SelfPlayer({
            client,
            id,
            cuid,
            username,
            face,
            isAdmin,
            x: x / 16,
            y: y / 16,
        })

        client.players.set(id, client.self)
        client.emit('start', [client.self])
    })

    return client
}

