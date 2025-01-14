import BufferReader from "../util/buffer.js";

import Block from "./block.js";
import Layer from "./layer.js";
import GameWorld from "./world.js";

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

    //
    //
    // STATIC
    //
    //

    /**
     * The number of layers in a structure.
     * 
     * @since 1.4.3
     */
    public static readonly LAYER_COUNT = 2;

    /**
     *
     * @param width The width of the structure
     * @param height The height of the structure
     */
    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;

        for (let i = 0; i < Structure.LAYER_COUNT; i++) {
            (this as any)[i] = new Layer(width, height);
        }
    }

    //
    //
    // GETTERS
    //
    //

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
     * Prints the location of matching blocks to the console.
     * 
     * @deprecated
     *
     * @since 1.4.2
     */
    public _debug_print_position(callback: (block: Block) => boolean) {
        for (let i = 0; i < Structure.LAYER_COUNT; i++) {
            for (let x = 0; x < this.width; x++) {
                for (let y = 0; y < this.height; y++) {
                    if (callback(this[i][x][y])) {
                        console.debug(`Layer ${i} at (${x}, ${y}): ${this[i][x][y]}`);
                    }
                }
            }
        }
    }

    /**
     * This method is used to clear the entire structure. This sets all
     * blocks to empty. While "cleared structure" and "cleared world" sound
     * similar, they are not quite the same. When a {@link GameWorld} is
     * cleared, the foreground layer remains with a border of gray basic blocks.
     * 
     * This method clears all blocks in all layers. If you want to clear
     * a world like the behaviour in PixelWalker, it is recommended to
     * use the following pseudo code:
     * 
     * ```typescript
     * structure.clear();
     * structure.foreground.set_border(Block.fromMapping('gray_basic_block'));
     * ```
     * 
     * @since 1.4.2
     */
    public clear() {
        for (let i = 0; i < Structure.LAYER_COUNT; i++) {
            this[i].clear();
        }
    }

    /**
     * Copies a subset of the structure into a new structure.
     * If this structure is managed by a {@link GameWorld}, the
     * new structure will not be synced by the world.
     * 
     * The dimensions of the new structure are given by the axis
     * difference. You can copy beyond the world boundaries,
     * which will fill the missing blocks with empty blocks.
     * 
     * @since 1.4.3
     */
    public copy(x1: number, y1: number, x2: number, y2: number): Structure {
        if (x2 < x1) {
            let tmp = x2;
            x2 = x1;
            x1 = tmp;
        }

        if (y2 < y1) {
            let tmp = y2;
            y2 = y1;
            y1 = tmp;
        }

        const world = new Structure(x2 - x1 + 1, y2 - y1 + 1);
        
        for (let i = 0; i < Structure.LAYER_COUNT; i++) {
            (world as any)[i] = this[i].copy(x1, y1, x2, y2);
        }

        return world;
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

        for (let i = 0; i < Structure.LAYER_COUNT; i++) {
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
