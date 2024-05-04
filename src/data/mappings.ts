import { API_ROOM_LINK } from "./consts.js"
import fs from 'node:fs'

const data: Response = await fetch(`https://${API_ROOM_LINK}/mappings`)
const text = await data.text()
const map: {[keys: string]: number} = JSON.parse(text)

export const BlockMappings: {[keys: string]: number} = map
export const BlockMappingsReverse: {[keys: number]: string} = Object.fromEntries(Object.entries(map).map(a => a.reverse()))

if (import.meta.dirname)
    fs.writeFileSync(import.meta.dirname + '/mappings.d.ts', `
    // This is auto generated in the project.

    export declare const BlockMappings: ${JSON.stringify(BlockMappings)}
    export declare const BlockMappingsReverse: ${JSON.stringify(BlockMappingsReverse)}
    `)
