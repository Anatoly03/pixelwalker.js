import BufferReader from "../util/buffer.js";

import Block from "./block.js";
import Layer from "./layer.js";

/**
 * The number of layers in a structure.
 */
const LAYER_COUNT = 2;

/**
 * Represents a structure in the world.
 *
 * @since 1.4.2
 */
export default class Structure {
    readonly [layer: number]: Layer;

    /**
     * The width of the structure. This is inherited to the layers.
     *
     * @since 1.4.2
     */
    public readonly width: number;

    /**
     * The height of the structure. This is inherited to the layers.
     *
     * @since 1.4.2
     */
    public readonly height: number;

    /**
     *
     * @param width The width of the structure
     * @param height The height of the structure
     */
    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;

        for (let i = 0; i < LAYER_COUNT; i++) {
            (this as any)[i] = new Layer(width, height);
        }
    }

    /**
     * Reference to the background layer of the structure.
     *
     * @since 1.4.2
     */
    public get background(): Layer {
        return this[0];
    }

    /**
     * Reference to the foreground layer of the structure.
     *
     * @since 1.4.2
     */
    public get foreground(): Layer {
        return this[1];
    }

    //
    //
    // METHODS
    //
    //

    /**
     * @deprecated
     *
     * @since 1.4.2
     */
    public _debug_print_position(callback: (block: Block) => boolean) {
        for (let i = 0; i < LAYER_COUNT; i++) {
            for (let x = 0; x < this.width; x++) {
                for (let y = 0; y < this.height; y++) {
                    if (callback(this[i][x][y])) {
                        console.debug(`Layer ${i} at (${x}, ${y}): ${this[i][x][y]}`);
                    }
                }
            }
        }
    }

    //
    //
    // GAME SERIALIZATION
    //
    //

    /**
     * // TODO document
     *
     * @since 1.4.2
     */
    public deserialize(source: WithImplicitCoercion<ArrayBuffer> | Buffer) {
        const buffer = BufferReader.from(source);

        for (let i = 0; i < LAYER_COUNT; i++) {
            this[i].deserialize(buffer);
        }

        if (buffer.length) {
            throw new Error(`buffer length is not zero, outdated or corrupt world serialization: ${buffer.length}`);
        }
    }

    //
    //
    // STORAGE I/O
    //
    //

    /**
     * Read the structure from a parser implementation and
     * return a Structure instance. *The default parser is JSON.*
     *
     * @example
     *
     * ```ts
     * const value = fs.readFileSync("structure.json");
     * const data = Structure.fromString(value);
     * ```
     *
     * @since 1.4.2
     */
    public static fromString(value: string): Structure;

    /**
     * Read the structure from a JSON parser implementation and
     * return a Structure instance.
     *
     * @example
     *
     * ```ts
     * const value = fs.readFileSync("structure.json");
     * const data = Structure.fromString(value, JSON);
     * ```
     *
     * @since 1.4.2
     */
    public static fromString(value: string, format: JSON): Structure;

    /**
     * Read the structure from a custom parser implementation and
     * return a Structure instance.
     *
     * @example
     *
     * ```ts
     * import YAML from "yaml";
     *
     * const value = fs.readFileSync("structure.yaml");
     * const data = Structure.fromString(value, YAML);
     * ```
     *
     * @since 1.4.2
     */
    public static fromString(value: string, parser: { parse(v: string): any }): Structure;

    public static fromString(value: string, parser: { parse(v: string): any } = JSON): Structure {
        throw new Error("Not implemented");
    }

    /**
     * Write the structure into a writeable stream and return an
     * JSON string representation of the structure.
     *
     * @example
     *
     * ```ts
     * const structure = ...;
     * const data = structure.toString(JSON);
     * fs.writeFileSync("structure.json", data);
     * ```
     *
     * @since 1.4.2
     */
    public toString(format: JSON): string;

    /**
     * Write the structure into a writeable stream and return a custom
     * object encoding string.
     *
     * @example
     *
     * ```ts
     * import YAML from "yaml";
     *
     * const structure = ...;
     * const data = structure.toString(YAML);
     * fs.writeFileSync("structure.yaml", data);
     * ```
     *
     * @since 1.4.2
     */
    public toString(parser: { stringify(v: any): string }): string;

    public toString(parser: { stringify(v: any): string }): string {
        throw new Error("Not implemented");
    }
}
