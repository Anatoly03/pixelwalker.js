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
    public static readonly VERSION = 2; 

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
     *
     * @param input The textual input encoding the structure. This
     * can be in a custom format, depending on the {@link Parser}
     * generic:
     */
    public toString(input: Structure): string {
        const { width, height } = input;
        const palette: (keyof typeof BlockMap)[] = ['empty'];

        /**
         * Deserialize
         */
        for (const [_0, layer] of input.layers()) {
            for (const [_1, _2, block] of layer.blocks()) {
                if (!palette.includes(block.mapping)) {
                    palette.push(block.mapping);
                }

                // const relativeIndex = palette.indexOf(block.id);
            }
        }

        /**
         * The root attributes of the file, which is used to store
         * the structure data.
         */
        const file = {
            width,
            height,
            palette,
        }

        return this.parser.stringify(file)
    }

    /**
     * 
     * @param input The textual input encoding the structure. This
     * can be in a custom format, depending on the {@link Parser}
     * generic: 
     */
    public fromString(input: string): Structure {
        throw new Error('Not implemented!');
    }
}
