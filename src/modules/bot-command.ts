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
     * When receiving a chat message, if it is a command,
     * emit command.
     */
    client.raw.on('chatMessage', async ([id, message]) => {
        if (!message) return
        const player = await client.wait_for(() => client.players.get(id))
        const prefix = client.cmdPrefix.find(v => message.toLowerCase().startsWith(v))
        if (!prefix) return

        const slice = message.substring(prefix.length)
        const arg_regex = /"(\\\\|\\"|[^"])*"|'(\\\\|\\'|[^'])*'|[^\s]+/gi
        const args: [Player, ...any] = [player]

        for (const match of slice.matchAll(arg_regex)) args.push(match[0])

        if (args.length < 2) return

        const cmd = args[1].toLowerCase()

        client.emit(`cmd:${cmd}`, args)
    })

    return client
}

