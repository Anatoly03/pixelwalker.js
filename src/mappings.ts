import { API_ROOM_LINK } from "./consts.js"

export let BlockMappings: {[keys: string]: number}
export let BlockMappingsReverse: {[keys: number]: string}

const data: Response = await fetch(`https://${API_ROOM_LINK}/mappings`)
const text = await data.text()
const map = JSON.parse(text)

BlockMappings = map
BlockMappingsReverse = Object.fromEntries(Object.entries(map).map(a => a.reverse()))
