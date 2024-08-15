import { GameServerLink } from './config.js';
import fs from 'node:fs';

const data: Response = await fetch(`https://${GameServerLink}/mappings`);
const map: { [keys: string]: number } = await data.json();

export const BlockMappings: { [keys: string]: number } = map;
export const BlockMappingsReverse: { [keys: number]: string } =
    Object.fromEntries(Object.entries(map).map((a) => a.reverse()));

if (import.meta.dirname)
    fs.writeFileSync(
        import.meta.dirname + '/block-mappings.d.ts',
        `
    // This is auto generated in the project.

    export declare const BlockMappings: ${JSON.stringify(BlockMappings)}
    export declare const BlockMappingsReverse: ${JSON.stringify(
        BlockMappingsReverse
    )}
    `
    );
