import Client from "../client.js"
import { SystemMessageFormat } from "../data/consts.js"

/**
 * This module generates a module function that will log certain events.
 */
export default function Module(client: Client): Client {
    function transform(s: string) {
        return new RegExp(s.replace('*', '\\*').replace('%s', '(.*)').replace('%n', '([0-9\.\,]+)').replace('%p', `([A-Z0-9]+)`))
    }

    /**
     * When receiving a system message, parse and emit.
     */
    client.raw.on('systemMessage', async ([title, message, b]) => {
        let event: keyof typeof SystemMessageFormat
        for (event in SystemMessageFormat) {
            const matches_title = title.match(transform(SystemMessageFormat[event][0])),
                matches_message = message.match(transform(SystemMessageFormat[event][1]))

            if (matches_message == null || matches_title == null) continue
            const event_arr: string[] = []

            for (let i = 1; i < matches_title.length; i++)
                event_arr.push(matches_title[i])
            for (let i = 1; i < matches_message.length; i++)
                event_arr.push(matches_message[i])

            client.system.emit(event, event_arr as any)

            break
        }
    })

    return client
}

