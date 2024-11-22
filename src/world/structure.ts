import YAML from "yaml";
import BufferReader from "../util/buffer-reader";
import Layer from "./layer";
import Block from "./block";

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
        this.meta = {} as Meta;

        for (let i = 0; i < Structure.LAYER_COUNT; i++) {
            (this as any)[i] = new Layer(width, height);
        }
    }

    //
    //
    // METHODS
    //
    //

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
    [Symbol.for("nodejs.util.inspect.custom")]() {
        return `Structure<\x1b[0;33m${this.width}\x1b[0;0m, \x1b[0;33m${this.height}\x1b[0;0m>`;
    }

    //
    //
    // STORAGE I/O
    //
    //

    // TODO TEST THIS
    public static fromString(format: "json" | "yaml", value: string): Structure {
        let data: any;

        switch (format) {
            case "json": {
                data = JSON.parse(data);
                break;
            }
            case "yaml": {
                data = YAML.parse(data);
                break;
            }
            default:
                throw new Error(`Unknown format: ${format}`);
        }

        if (data["file-version"] !== 1) {
            throw new Error(`Unsupported file version: ${data["file-version"]}`);
        }

        if (data.width <= 0 || data.height <= 0) {
            throw new Error(`Invalid structure size: ${data.width}x${data.height}`);
        }

        const structure = new Structure(data.width, data.height);
        structure.meta = data.meta ?? {};

        for (let i = 0; i < Structure.LAYER_COUNT; i++) {
            const layer = data.layers[i];
            const blocks = layer.split(";");
            let idx = 0;

            for (const bl of blocks) {
                const block = Block.fromString(bl);
                const x = idx % data.width;
                const y = Math.floor(idx / data.width);
                structure[i][x][y] = block;
                idx += 1;
            }
        }

        return structure;
    }

    /**
     * Write the structure into a writeable stream.
     */
    public toString(format: "json"): string;

    /**
     * Write the structure into a writeable stream.
     */
    public toString(format: "yaml"): string;

    public toString(format: "json" | "yaml"): string {
        const palette = ["empty"];
        const layers: string[] = [];

        const data = {
            "file-version": 1,
            meta: this.meta,
            width: this.width,
            height: this.height,
            palette,
            layers,
        };

        for (let i = 0; i < Structure.LAYER_COUNT; i++) {
            let ENCODING: string = '';

            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    const block = this[i][x][y];

                    if (!palette.includes(block.name)) palette.push(block.name);
                    let blockId = palette.indexOf(block.name);

                    ENCODING += blockId.toString(16).padStart(2, "0");
                    if (block.args.length) ENCODING += '.' + block.serialize_args().toString('hex');
                    ENCODING += ';';
                }
            }

            layers.push(ENCODING);
        }

        switch (format) {
            case "json": {
                return JSON.stringify(data);
            }
            case "yaml": {
                return YAML.stringify(data);
            }
            default:
                throw new Error(`Unknown format: ${format}`);
        }
    }
}
