import Config from "./config.js";
import fs from "node:fs";

const data: Response = await fetch(`https://${Config.GameServerLink}/mappings`);
const map: { [keys: string]: number } = await data.json();

export const BlockMappings: { [keys: string]: number } = map;
export const BlockMappingsReverse: { [keys: number]: string } = {};

Object.entries(map).forEach(([key, value]) => BlockMappingsReverse[+value] = key);

if (import.meta.dirname)
    fs.writeFileSync(
        import.meta.dirname + "/block-mappings.d.ts",
        `
    // This is auto generated in the project.

    export declare const BlockMappings: ${JSON.stringify(BlockMappings)}
    export declare const BlockMappingsReverse: ${JSON.stringify(BlockMappingsReverse)}
    `
    );
