import Client from "../client.js"
import { MessageType } from "../data/consts.js"
import { Magic, Bit7 } from "../types/message-bytes.js"
import { GamePlayerArray } from "../types/player-ds.js"
import Player, { PlayerBase, SelfPlayer } from "../types/player.js"
import World from "../types/world.js"

export default function StartModule(players: GamePlayerArray<true>) {
    return (client: Client) => {
        /**
         * On init, set everything up
         */
        client.raw.once('init', async ([id, cuid, username, face, isAdmin, x, y, can_edit, can_god, title, plays, owner, global_switch_states, width, height, buffer]) => {
            await client.send(Magic(0x6B), Bit7(MessageType['init']))

            client.world = new World({
                width, height, client, title, plays, owner
            })

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
                can_edit,
                can_god
            })

            players.push(client.self)
            client.emit('start', [client.self])
        })
        
        return client
    }
}
