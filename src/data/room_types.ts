import { API_ROOM_LINK } from "./consts.js"
import fs from 'node:fs'

const data: Response = await fetch(`https://${API_ROOM_LINK}/listroomtypes`)
const map: string[] = await data.json()

export const RoomTypes: string[] = map
export default RoomTypes

if (import.meta.dirname)
    fs.writeFileSync(import.meta.dirname + '/room_types.d.ts',
`
// This is auto generated in the project.
export declare const RoomTypes: (${RoomTypes.map(v => `"${v}"`).join(' | ')})[]
export default RoomTypes
`)
