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
export const BlockMap: { [keys: string]: number } = await response.json();

/**
 * This is the build script and will be executed upon program start.
 * It will generate a file called `block-mappings.d.ts` in the same
 * directory as this file, then {@link BlockMap} will be updated.
 */
if (import.meta.dirname)
    fs.writeFileSync(
        import.meta.dirname + "/block-mappings.d.ts",
        `
// This is auto generated in the project.

export declare const BlockMap: ${JSON.stringify(BlockMap, undefined, 4)};
`
    );
