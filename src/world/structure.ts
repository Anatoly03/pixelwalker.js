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
     */
    public get background(): Layer {
        return this[0];
    }

    /**
     * Reference to the foreground layer of the structure.
     */
    public get foreground(): Layer {
        return this[1];
    }

}
