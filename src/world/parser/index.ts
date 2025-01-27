import Structure from "../structure.js";
import * as v2 from "./v2.js";

/**
 * The signature of a stringifier object. This is used to
 * generalize JSON and YAML stringifiers.
 *
 * @since 1.4.5
 */
export type ParserSignature = {
    parse(v: string): any;
    stringify(v: any): string;
};

/**
 * @since 1.4.5
 */
export type StructureData = {
    generator: string;
    meta: Record<string, any>;
    width: number;
    height: number;
    palette: string[];
    data: string;
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
     *
     * @since 1.4.5
     */
    public static readonly FILE_VERSION = 2;

    /**
     * List of supported parser.
     *
     * @since 1.4.5
     */
    private static PARSERS = {
        "pixelwalker.js/v2": v2,
    } as const;

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
    public toString(input: Structure, options: { generator?: keyof typeof StructureParser.PARSERS } = {}): string {
        const generatorName = options.generator || `pixelwalker.js/v${StructureParser.FILE_VERSION}`;

        if (!(generatorName in StructureParser.PARSERS)) {
            throw new Error("Unsupported generator: " + options.generator);
        }

        const generator = StructureParser.PARSERS[generatorName];
        const file = generator.fromStructure(input);
        return this.parser.stringify(file);
    }

    /**
     * Generate a {@link Structure} from a decoded {@link String}.
     *
     * @param input The textual input encoding the structure. This
     * can be in a custom format, depending on the {@link Parser}
     * generic:
     */
    public fromString(input: string, options: { generator?: keyof typeof StructureParser.PARSERS } = {}): Structure {
        const object: StructureData = this.parser.parse(input);
        const generatorName = options.generator || (object.generator as keyof typeof StructureParser.PARSERS) || `pixelwalker.js/v${StructureParser.FILE_VERSION}`;

        if (!(generatorName in StructureParser.PARSERS)) {
            throw new Error("Unsupported generator: " + object.generator);
        }

        const generator = StructureParser.PARSERS[generatorName];
        // generator.validate(object);
        // generator.migrate(object);
        return generator.toStructure(object);
    }
}
