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
                (this as any)[x][y] = Block.fromId(0);
            }
        }
    }

    //
    //
    // METHODS
    //
    //

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
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                (this as any)[x][y] = Block.fromId(0);
            }
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
        // TODO bug: since blocks are cloned by reference here, blocks in new structure are updated in original structure and vice versa

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

        for (let x = x1; x <= x2; x++)
            for (let y = y1; y <= y2; y++) {
                if (x < 0 || y < 0 || x >= this.width || y >= this.height) continue;
                layer[x - x1][y - y1] = this[x][y];
            }

        return layer;
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
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                this[x][y].deserialize(buffer);
            }
        }
    }

}
