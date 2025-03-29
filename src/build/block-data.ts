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
import { ComponentTypeHeader } from "../util/buffer.js";

const response = await fetch(CONFIG.GAME_SERVER_HTTP + "/listblocks");

/**
 * A block entry.
 */
export type BlockEntry = {
    Id: number;

    PaletteId: string;
    Layer: number;
    BlockDataArgs?: ComponentTypeHeader[];

    MinimapColor?: number;

    LegacyMorph?: number[];
    LegacyId?: number;
};

/**
 * An array of block entries.
 */
export const BlockItems: BlockEntry[] = await response.json();

/**
 * An array of block mappings.
 */
export const Palette: string[] = BlockItems.sort((a, b) => a.Id - b.Id).map(({ PaletteId }) => PaletteId);

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

export type BlockEntry = {
    Id: number;
    PaletteId: string;
    Layer: number;
    LegacyId: number;
};

export declare const Mappings: ${JSON.stringify(BlockItems, undefined, 4)};

export declare const Palette: [
${entries}
];
`
    );
}
