import { API_ROOM_LINK } from "./consts.js"

export let BlockMappings: {[keys: string]: number}
export let BlockMappingsReverse: {[keys: number]: string}

/**
 * Store the block map as constant
 */
export async function init_mappings() {
    // If already defined, return
    if (BlockMappings) return

    const data = await fetch(`https://${API_ROOM_LINK}/mappings`)
    const text = await data.text()
    const map = JSON.parse(text)

    BlockMappings = map
    BlockMappingsReverse = Object.fromEntries(Object.entries(map).map(a => a.reverse()))
}
