import { Palette } from "../build/block-mappings.js";
import LayerPosition from "../types/layer-position.js";
import BufferReader from "../util/buffer.js";

import Block from "./block.js";
import GameWorld from "./world.js";

/**
 * A layer is a 2D array of blocks. This is used to represent the
 * world data in a game. A {@link GameWorld} is a {@link Structure}
 * consisting of several {@link Layer Layers}. The layers are used
 * to abstract index access to the blocks in the world.
 *
 * @since 1.4.2
 */
export default class Layer {
    readonly [x: number]: { [y: number]: Block };

    /**
     * The width of the layer.
     *
     * @since 1.4.2
     */
    public readonly width: number;

    /**
     * The height of the layer.
     *
     * @since 1.4.2
     */
    public readonly height: number;

    /**
     * This constructor creates a new layer with the specified width
     * and height. The layer is initialized with default blocks
     * (which is the block with id `0`.)
     *
     * @param width Width of the layer
     * @param height Height of the layer
     *
     * @since 1.4.2
     */
    public constructor(width: number, height: number) {
        this.width = width;
        this.height = height;

        for (let x = 0; x < width; x++) {
            (this as any)[x] = {};

            for (let y = 0; y < height; y++) {
                this[x][y] = Block.fromId(0);
            }
        }
    }

    //
    //
    // METHODS
    //
    //

    /**
     * Iterates over all blocks in the structure. Returns a triple
     * of their position and {@link Block} reference.
     *
     * @since 1.4.5
     */
    public *blocks() {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                yield [x, y, this[x][y]] as const;
            }
        }
    }

    /**
     * This method is used to clear the layer. This sets all blocks
     * to empty. While "cleared layer" and "cleared world" sound similar,
     * they are not quite the same. When a {@link GameWorld} is cleared,
     * the foreground layer remains with a border of gray basic blocks.
     *
     * This method clears all blocks in the layer. If you want to clear
     * a world like the behaviour in PixelWalker, it is recommended to
     * use the following pseudo code:
     *
     * ```typescript
     * background.clear();
     * foreground.clear();
     * foreground.set_border(Block.fromMapping('gray_basic_block'));
     * ```
     *
     * @since 1.4.2
     */
    public clear() {
        for (const [x, y, _] of this.blocks()) {
            this[x][y] = Block.fromId(0);
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
    public copy(x1: number, y1: number, x2: number, y2: number): Layer {
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

        const layer = new Layer(x2 - x1 + 1, y2 - y1 + 1);

        for (const [x, y, block] of this.blocks()) {
            if (x < 0 || y < 0 || x >= this.width || y >= this.height) continue;
            layer[x - x1][y - y1] = block.copy();
        }

        return layer;
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
    public deepEquals(other: Layer): boolean {
        if (this.width !== other.width || this.height !== other.height) return false;

        for (const [x, y, block] of this.blocks()) {
            if (!block.equals(other[x][y])) return false;
        }

        return true;
    }

    /**
     * Replace all blocks in the layer with a particular block
     * by its' mapping. Returns the positions of all changed
     * blocks. It is guaranteed that `replaceAll().length === 0`
     * if no blocks were replaced.
     *
     * @since 1.4.3
     */
    public listAll(from: (typeof Palette)[number]): LayerPosition[];

    public listAll(from: string | Block): LayerPosition[] {
        switch (typeof from) {
            case "string":
                from = Block.fromMapping(from);
                break;

            default:
                throw new Error("method not implemented");
        }

        let positions: LayerPosition[] = [];

        for (const [x, y, block] of this.blocks()) {
            if (block.id !== from.id) continue;
            // TODO if block data is stored, allow strict checking

            positions.push({ x, y });
        }

        return positions;
    }

    /**
     * Replace all blocks in the layer with a particular block
     * by its' mapping. Returns the positions of all changed
     * blocks. It is guaranteed that `replaceAll().length === 0`
     * if no blocks were replaced.
     *
     * @since 1.4.3
     */
    public replaceAll(from: (typeof Palette)[number], to: Block): LayerPosition[];

    public replaceAll(from: string, to: Block): LayerPosition[] {
        const positions = this.listAll(from);

        for (const { x, y } of positions) {
            this[x][y] = to.copy();
        }

        return positions;
    }

    /**
     * Set the border of the layer to a particular block.
     *
     * @since 1.4.3
     */
    public setBorder(border: Block) {
        for (let x = 0; x < this.width; x++) {
            this[x][0] = border.copy();
            this[x][this.height - 1] = border.copy();
        }

        // Because the corners have already been set, we can skip
        // them, hence y = 1 and upper end - 1.
        for (let y = 1; y < this.height - 1; y++) {
            this[0][y] = border.copy();
            this[this.width - 1][y] = border.copy();
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
    public deserialize(buffer: BufferReader) {
        for (const [x, y, _] of this.blocks()) {
            try {
                this[x][y] = Block.deserialize(buffer, { endian: "little", readTypeByte: false });
            } catch (e) {
                console.error(`error deserializing at ${x}, ${y}`);
                throw e;
            }
        }
    }
}
