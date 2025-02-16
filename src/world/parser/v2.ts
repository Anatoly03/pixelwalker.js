/**
 * @name WorldParserV2
 * @author Anatoly
 * @since 1.4.5
 *
 * This is the v2 parser for the world structure. It is used to parse and stringify
 * the structure.
 *
 * @module
 */

import { Structure } from "../../index.js";
import { StructureData } from "./index.js";

/**
 * // TODO document
 *
 * @since 1.4.5
 */
export function fromStructure(input: Structure): StructureData {
    const { width, height } = input;
    const palette: string[] = ["empty"];
    let buffer: Buffer[] = [];

    // Deserialization: For every layer, for every block:
    //
    // - Update palette and retrieve relative id.
    for (const [_0, layer] of input.layers()) {
        for (const [_1, _2, block] of layer.blocks()) {
            // If the block was not recorded yet, update in the
            // palette.
            if (!palette.includes(block.mapping)) {
                palette.push(block.mapping);
            }

            // Deserialize the block to a buffer with a custom
            // palette.
            const tmp = block.serialize({ endian: "big", writeId: true, writeTypeByte: true, palette });
            buffer.push(tmp);
        }
    }

    /**
     * The root attributes of the file, which is used to store
     * the structure data.
     */
    return {
        /**
         * Useful to share dialects of the decoded data accross libraries.
         */
        generator: `pixelwalker.js/v2`,

        /**
         * This is reserved.
         */
        meta: input.meta,

        /**
         * The width of the structure.
         */
        width,

        /**
         * The height of the structure.
         */
        height,

        /**
         * The pallete of used blocks: This allows cross-update storage
         * of blocks.
         */
        palette,

        /**
         * The decode data. This is a list of strings, where each
         * entry is a layer. See [README](./README.md) to learn about
         * how this works.
         */
        data: Buffer.concat(buffer).toString("base64"),
    };
}

/**
 * // TODO document
 *
 * @since 1.4.5
 */
export function toStructure(input: StructureData): Structure {
    const { data, width, height, palette, meta } = input;
    const structure = new Structure(width, height);

    structure.meta = meta;
    structure.deserialize(Buffer.from(data, "base64"), { endian: "big", readTypeByte: true, palette });

    return structure;
}
