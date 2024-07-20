import { API_ROOM_LINK } from "./consts.js"
import fs from 'node:fs'

const data: Response = await fetch(`https://${API_ROOM_LINK}/message_types`)
const map: string[] = await data.json()

export const MessageTypes: string[] = map

if (import.meta.dirname)
    fs.writeFileSync(import.meta.dirname + '/message_types.d.ts', `
    // This is auto generated in the project.

    export declare const MessageTypes: ${JSON.stringify(MessageTypes)}
    `)
