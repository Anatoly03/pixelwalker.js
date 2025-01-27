/**
 * @module build/block-mappings
 *
 * This module contains a runtime build file. This file is used to
 * generate a mapping of block names to block IDs. Obbserve how in
 * Node runtimes this file will expand to the live structure of the
 * game.
 */

import fs from "node:fs";
import CONFIG from "../config.js";

const response = await fetch(CONFIG.GAME_SERVER_HTTP + "/mappings");

/**
 * An object of block mappings to block id.
 */
export const Mappings: { [keys: string]: number } = await response.json();

/**
 * An array of block mappings.
 */
export const Palette: string[] = Object
    .entries(Mappings)
    .sort(([, a], [, b]) => a - b)
    .reduce((arr, [key]) => [...arr, key], [] as string[]);

/**
 * This is the build script and will be executed upon program start.
 * It will generate a file called `block-mappings.d.ts` in the same
 * directory as this file, then {@link BlockMap} will be updated.
 */
if (import.meta.dirname) {
    const entries = Palette.map((key, index) => `\t"${key}", // ${index}`).join("\n");

    fs.writeFileSync(
        import.meta.dirname + "/block-mappings.d.ts",
        `
// This is auto generated in the project.

export declare const Mappings: ${JSON.stringify(Mappings, undefined, 4)};

export declare const Palette: [
${entries}
];
`
    );
}
