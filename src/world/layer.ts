import BufferReader from "../util/buffer-reader.js";
import Block from "./block.js";

/**
 * A layer is a two-dimensional array of blocks.
 */
export default class Layer {
    readonly [x: number]: { [y: number]: Block };

    public constructor(public width: number, public height: number) {
        for (let x = 0; x < width; x++) {
            (this as any)[x] = {};
            for (let y = 0; y < height; y++) {
                (this as any)[x][y] = new Block(0);
            }
        }
    }

    //
    //
    // METHODS
    //
    //

    /**
     * Clears the layer.
     */
    public clear() {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                (this as any)[x][y] = new Block(0);
            }
        }
    }

    //
    //
    // STORAGE I/O
    //
    //

    /**
     * Deserialize the current layer from the buffer reader.
     */
    public deserialize(buffer: BufferReader): this {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                (this as any)[x][y] = Block.deserialize(buffer);
            }
        };

        return this;
    }
}
