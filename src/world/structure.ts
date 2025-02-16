import BufferReader from "../util/buffer.js";
import StructureParser, { ParserSignature } from "./parser/index.js";

import { BlockDeserializationOptions } from "./block.js";
import Layer from "./layer.js";
import GameWorld from "./world.js";

/**
 * Represents a structure in the world.
 *
 * @since 1.4.2
 */
export default class Structure<Meta extends Record<string, any> = {}> {
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
     * The meta properties of the structure, an endpoint for custom
     * attributes.
     * 
     * @since 1.4.7
     */
    public meta: Meta = {} as Meta;

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
            for (let x = x1; x <= x2; x++) {
                for (let y = y1; y <= y2; y++) {
                    world[i][x - x1][y - y1] = this[i][x][y].copy();
                }
            }
        }

        return world;
    }

    /**
     * Compare two structures for deep equality: Block and block
     * data must equal.
     *
     * @param other Another structure, against which deep
     * quality is compared.
     *
     * @since 1.4.5
     */
    public deepEquals(other: Structure): boolean {
        for (const [index, layer] of this.layers()) {
            if (!layer.deepEquals(other[index])) return false;
        }

        return true;
    }

    /**
     * Iterates over all layers in the structure. Returns a tuple
     * of index and {@link Layer} reference.
     *
     * @since 1.4.5
     */
    public *layers() {
        for (let i = 0; i < Structure.LAYER_COUNT; i++) {
            yield [i, this[i]] as const;
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
    public deserialize(source: WithImplicitCoercion<ArrayBuffer> | Buffer, options: BlockDeserializationOptions = { endian: "little", readTypeByte: false }): this {
        const buffer = BufferReader.from(source);

        for (let i = 0; i < Structure.LAYER_COUNT; i++) {
            try {
                this[i].deserialize(buffer, options);
            } catch (e) {
                console.error(`error deserializing at ${i == 0 ? "background" : "foreground"} layer`);
                throw e;
            }
        }

        if (buffer.length) {
            throw new Error(`buffer length is not zero, outdated or corrupt world serialization: ${buffer.length}`);
        }

        return this;
    }

    //
    //
    // STORAGE I/O
    //
    //

    /**
     * Create a new structure from a parser implementation.
     *
     * @since 1.4.5
     */
    public static parser<P extends ParserSignature>(parser: P): StructureParser<P> {
        return new StructureParser(parser);
    }
}
