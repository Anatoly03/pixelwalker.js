import { BlockMap } from "../build/block-mappings.js";
// import Block from "./block.js";
// import Layer from "./layer.js";
import Structure from "./structure.js";

/**
 * The signature of a stringifier object. This is used to
 * generalize JSON and YAML stringifiers.
 */
export type ParserSignature = {
    parse(v: string): any;
    stringify(v: any): string;
};

/**
 * Represents a structure in the world.
 *
 * @since 1.4.5
 */
export default class StructureParser<Parser extends ParserSignature = JSON> {
    /**
     * The parser object, can be {@link JSON} or a custom object
     * implementing interface similar to {@link JSON.parse}.
     *
     * @since 1.4.5
     */
    private parser: Parser;

    /**
     * Sets the file version of the parser
     */
    public static readonly FILE_VERSION = 2;

    /**
     * The character which is used to separate layers in the
     * structure `data` field.
     */
    private static SEPARATOR_LAYER = '\n';

    /**
     * The character which is used to separate layers in the
     * structure `data` field.
     */
    private static SEPARATOR_BLOCK = ' ';

    /**
     * The character which is used to separate layers in the
     * structure `data` field.
     */
    private static SEPARATOR_BLOCK_DATA = ',';

    /**
     * The character after block id indicating multiple following blocks.
     */
    private static MARKER_REPETITION = '*';

    /**
     * The character within the block data entry indicating the
     * start of the data.
     */
    private static MARKER_BLOCK_DATA = ':';

    //
    //
    // STATIC
    //
    //

    /**
     * A quick access to the JSON parser.
     */
    public static get JSON() {
        return new this(JSON);
    }

    /**
     * Create a new structure deserializer. You have to explictily
     * specify {@link JSON} to work with the generic type, but it
     * can be a custom YAML or other implementation.
     */
    constructor(parser: Parser) {
        this.parser = parser;
    }

    //
    //
    // METHODS
    //
    //

    //
    //
    // STORAGE I/O
    //
    //

    /**
     * Generate a decoded {@link String} from a {@link Structure}
     *
     * @param input The textual input encoding the structure. This
     * can be in a custom format, depending on the {@link Parser} 
     * generic.
     */
    public toString(input: Structure): string {
        const { width, height } = input;
        const palette: (keyof typeof BlockMap)[] = ["empty"];
        let data = '';

        // Deserialization: For every layer, for every block:
        //
        // - Update palette and retrieve relative id.
        for (const [_0, layer] of input.layers()) {
            if (data.length) {
                data += StructureParser.SEPARATOR_LAYER;
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
                        layerData += StructureParser.MARKER_REPETITION;
                        layerData += bufferedCount;
                    }

                    bufferedBlock = "";
                    bufferedCount = 0;
                }

                // If there is already data, add a space as a separator.
                if (layerData.length) {
                    layerData += StructureParser.SEPARATOR_BLOCK;
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
                        if (dataString.length) {
                            dataString += StructureParser.SEPARATOR_BLOCK_DATA;
                        } else {
                            dataString += StructureParser.MARKER_BLOCK_DATA;
                        }

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

                    layerData += dataString;
                }
            }

            data += layerData;
        }

        /**
         * The root attributes of the file, which is used to store
         * the structure data.
         */
        const file = {
            /**
             * Useful to share dialects of the decoded data accross libraries.
             */
            generator: `pixelwalker.js/v${StructureParser.FILE_VERSION}`,

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

        return this.parser.stringify(file);
    }

    /**
     * Generate a {@link Structure} from a decoded {@link String}.
     *
     * @param input The textual input encoding the structure. This
     * can be in a custom format, depending on the {@link Parser} 
     * generic:
     */
    public fromString(input: string): Structure {
        throw new Error("Not implemented!");
    }
}
