import { API_ROOM_LINK } from "./consts.js"

const data: Response = await fetch(`https://${API_ROOM_LINK}/listroomtypes`)
const text = await data.text()
const map: string[] = JSON.parse(text)

export const RoomTypes: string[] = map
