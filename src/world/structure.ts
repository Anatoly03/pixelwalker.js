import BufferReader from "../util/buffer-reader";
import Layer from "./layer";

export default class Structure<Meta extends { [keys: number | string]: number | string | boolean | null | undefined } = {}> {
    readonly [layer: number]: Layer;

    /**
     * The amount of layers the game has.
     */
    public static readonly LAYER_COUNT = 2;

    /**
     * The metadata of the structure. This attribute can be used
     * to store additional information about the structure.
     */
    public meta!: Meta;

    /**
     * 
     */
    public constructor(public width: number, public height: number) {
        this.meta = {} as Meta

        for (let i = 0; i < Structure.LAYER_COUNT; i++) {
            (this as any)[i] = new Layer(width, height);
        }
    }

    /**
     * Deserialize the structure from the buffer reader.
     */
    public deserialize(buffer: BufferReader): this {
        for (let i = 0; i < Structure.LAYER_COUNT; i++) {
            this[i].deserialize(buffer);
        }

        return this;
    }

    /**
     * Clears the layer completely.
     */
    public clear(): this {
        for (let i = 0; i < Structure.LAYER_COUNT; i++) {
            this[i].clear();
        }

        return this;
    }

    /**
     * Provides a custom string representation of the block which
     * is used for printing the block to stdout.
     */
    [Symbol.for('nodejs.util.inspect.custom')]() {
        return `Structure<\x1b[0;33m${this.width}\x1b[0;0m, \x1b[0;33m${this.height}\x1b[0;0m>`;
    }
}
