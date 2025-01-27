// TODO remove this if deemed irrelevant
// ideas on writing a parser for the world structure

/**
 * @name WorldParserV2
 * @author Anatoly
 * @ignore
 * @module
 */

import { Block, Structure } from "../../index.js";
// import Block from "./block.js";
// import Layer from "./layer.js";
import { StructureData } from "./index.js";

// The character which is used to separate layers in the
// structure `data` field.
const SEPARATOR_LAYER = "\n";

// The character which is used to separate layers in the
// structure `data` field.
const SEPARATOR_BLOCK = " ";

// The character which is used to separate layers in the
// structure `data` field.
const SEPARATOR_BLOCK_DATA = ",";

// The character after block id indicating multiple following
// blocks.
const MARKER_REPETITION = "*";

// The characters after block id indicating the block data
// range.
const MARKER_BLOCK_DATA_START = "[";
const MARKER_BLOCK_DATA_END = "]";

/**
 * // TODO document
 *
 * @since 1.4.5
 */
export function fromStructure(input: Structure): StructureData {
    const { width, height } = input;
    const palette: string[] = ["empty"];
    let data = "";

    // Deserialization: For every layer, for every block:
    //
    // - Update palette and retrieve relative id.
    for (const [_0, layer] of input.layers()) {
        if (data.length) {
            data += SEPARATOR_LAYER;
        }

        let layerData: string = "";
        let bufferedBlock = "";
        let bufferedCount = 0;

        for (const [_1, _2, block] of layer.blocks()) {
            // If the block was not recorded yet, update in the
            // palette.
            if (!palette.includes(block.mapping)) {
                palette.push(block.mapping);
            }

            // The relative id is the index of the block in the
            // palette.
            const relativeId = palette.indexOf(block.mapping);

            // If the block is the same as the previous one, buffer
            // the block and continue. If there is a block buffered,
            // and it is the same, increment the count, otherwise write
            // counter and continue processing
            if (bufferedBlock === block.mapping) {
                bufferedCount += 1;
                continue;
            } else if (bufferedCount) {
                // If there are MULTIPLE buffered blocks, write their count.
                if (bufferedCount > 1) {
                    layerData += MARKER_REPETITION;
                    layerData += bufferedCount;
                }

                bufferedBlock = "";
                bufferedCount = 0;
            }

            // If there is already data, add a space as a separator.
            if (layerData.length) {
                layerData += SEPARATOR_BLOCK;
            }

            // Write the block id.
            layerData += relativeId;

            // If the block has no data, it can be buffered.
            if (!block.data.length) {
                bufferedBlock = block.mapping;
                bufferedCount = 1;
                continue;
            }

            if (block.data.length) {
                let dataString = "";

                for (const data of block.data) {
                    dataString += dataString.length ? SEPARATOR_BLOCK_DATA : MARKER_BLOCK_DATA_START;

                    switch (true) {
                        case typeof data === "number":
                            dataString += data;
                            break;
                        case typeof data === "bigint":
                            dataString += `BigInt(${data})`;
                            break;
                        case typeof data === "boolean":
                            dataString += data ? "true" : "false";
                            break;
                        case typeof data === "string":
                            dataString += `String(${Buffer.from(data).toString("base64")})`;
                            break;
                        case data instanceof Buffer:
                            dataString += `Buffer(${data.toString("base64")})`;
                            break;
                        default:
                            throw new Error("Unsupported data type: " + data);
                    }
                }

                dataString += MARKER_BLOCK_DATA_END;
                layerData += dataString;
            }
        }

        data += layerData;
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
        meta: {},

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
        data,
    };
}

/**
 * // TODO document
 *
 * @since 1.4.5
 */
export function toStructure(input: StructureData): Structure {
    const { data, width, height, palette } = input;
    const structure = new Structure(width, height);

    for (const [layerIndex, decodedLayer] of data.split(SEPARATOR_LAYER).map((v, i) => [i, v] as const)) {
        let x = 0;
        let y = 0;

        for (const decodedBlock of decodedLayer.split(SEPARATOR_BLOCK)) {
            const regex = /[0-9]+/;
            const match = regex.exec(decodedBlock)![0];
            const id = parseInt(match, 10);
            const block = Block.fromMapping(palette[id]);

            if (regex.lastIndex + 1 < decodedBlock.length) {
                switch (decodedBlock.substring(regex.lastIndex + 1, regex.lastIndex + 2)) {
                    case MARKER_REPETITION:
                        const count = parseInt(decodedBlock.substring(regex.lastIndex + 2), 10);

                        for (let i = 0; i < count; i++) {
                            structure[layerIndex][x++][y] = block;

                            if (x >= width) {
                                x = 0;
                                y += 1;
                            }
                        }

                        continue;
                    case MARKER_BLOCK_DATA_START:
                        const dataString = decodedBlock.substring(regex.lastIndex + 1);
                        const decodedDataString = dataString.split(SEPARATOR_BLOCK_DATA);

                        for (const [index, data] of decodedDataString.map((v, i) => [i, v] as const)) {
                            block.data[index] = data;
                        }

                        break;
                }
            }

            structure[layerIndex][x++][y] = block;

            if (x >= width) {
                x = 0;
                y += 1;
            }
        }

        if (y++ >= height) {
            throw new Error(`blocks overrun the structure dimensions ${width}x${height}`);
        }
    }

    return structure;
}
