import Client from "../client.js"
import Player from "../types/player.js"
import { EventEmitter } from 'events'

/**
 * Handle commands
 */
export default function BotCommandModule(command: EventEmitter<{[keys: string]: [[Player, ...string[]]]}>) {
    return (client: Client) => {
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
            const args: [Player, ...string[]] = [player]

            for (const match of slice.matchAll(arg_regex)) args.push(match[0])

            if (args.length < 2) return

            const cmd = args[1].toLowerCase()

            if (client.eventNames().includes(`cmd:${cmd}`)) {
                console.warn('Deprecation Warning: The client event `cmd:...` is no longer supported and will be replaced with `client.onCommand()`')
            }

            client.emit(`cmd:${cmd}`, args)
            command.emit(cmd, args)
        }

        client.raw.on('chatMessage', ([id, message]) => handle_command(id, message))
        client.raw.on('chatPrivateMessage', ([id, message]) => handle_command(id, message))

        return client
    }
}
