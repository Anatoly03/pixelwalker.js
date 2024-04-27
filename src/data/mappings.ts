import { API_ROOM_LINK } from "./consts.js"

const data: Response = await fetch(`https://${API_ROOM_LINK}/mappings`)
const text = await data.text()
const map: {[keys: string]: number} = JSON.parse(text)

export const BlockMappings: {[keys: string]: number} = map
export const BlockMappingsReverse: {[keys: number]: string} = Object.fromEntries(Object.entries(map).map(a => a.reverse()))
