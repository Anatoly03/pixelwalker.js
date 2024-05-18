import Client from "../client.js"
import Player from "../types/player.js"

/**
 * This module generates a module function that will log certain events.
 */
export default function Module(client: Client): Client {
    /**
     * When receiving a chat message, if it is a command,
     * emit command.
     */
    async function handle_command(id: number, message: string) {
        if (!message) return
        const player = client.players.get(id)
        if (!player) return
        const prefix = client.cmdPrefix.find(v => message.toLowerCase().startsWith(v))
        if (!prefix) return

        const slice = message.substring(prefix.length)
        const arg_regex = /"(\\\\|\\"|[^"])*"|'(\\\\|\\'|[^'])*'|[^\s]+/gi
        const args: [Player, ...any] = [player]

        for (const match of slice.matchAll(arg_regex)) args.push(match[0])

        if (args.length < 2) return

        const cmd = args[1].toLowerCase()

        client.emit(`cmd:${cmd}`, args)
    }

    client.raw.on('chatMessage', ([id, message]) => handle_command(id, message))
    client.raw.on('chatPrivateMessage', ([id, message]) => handle_command(id, message))

    return client
}

