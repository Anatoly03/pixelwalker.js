import BufferReader from "../util/buffer-reader.js";
import Layer from "./layer.js";
import Block, { BlockArgs, BlockName } from "./block.js";

import structureMigrations from "./structure.migrations.js";

export default class Structure<Meta extends { [keys: number | string]: any } = {}> {
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
    // GETTERS
    //
    //

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
     * Copy a subset of the structure defined by the coordinates.
     */
    public copy(x1: number, y1: number, x2: number, y2: number): Structure {
        if (x2 < x1) { let tmp = x2; x2 = x1; x1 = tmp }
        if (y2 < y1) { let tmp = y2; y2 = y1; y1 = tmp }

        const world = new Structure(x2 - x1 + 1, y2 - y1 + 1)

        for (let x = x1; x <= x2; x++)
            for (let y = y1; y <= y2; y++) {
                if (x < 0 || y < 0 || x >= this.width || y >= this.height)
                    continue
                world.background[x - x1][y - y1] = this.background[x][y]
                world.foreground[x - x1][y - y1] = this.foreground[x][y]
            }

        return world
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

    private static LATEST_VERSION_ENCODING = 1;

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
     */
    public static fromString(value: string, parser: { parse(v: string): any }): Structure;

    public static fromString(value: string, parser: { parse(v: string): any } = JSON): Structure {
        let data = parser.parse(value);

        if (data["file-version"] < 0 || data["file-version"] > Structure.LATEST_VERSION_ENCODING) {
            throw new Error(`Unsupported file version: ${data["file-version"]}`);
        }

        data = structureMigrations(data);

        if (data.width <= 0 || data.height <= 0) {
            throw new Error(`Invalid structure size: ${data.width}x${data.height}`);
        } else if (!data.palette) {
            throw new Error(`Missing palette data in structure.`);
        }
        
        const structure = new Structure(data.width, data.height);
        structure.meta = data.meta ?? {};
        
        for (let i = 0; i < Structure.LAYER_COUNT; i++) {
            const layer: string = data.layers[i];
            const blocks = layer.split(";").slice(0, data.width * data.height);
            let idx = 0;

            for (const bl of blocks) {
                const [paletteId, args] = bl.split(".");
                if (!paletteId) throw new Error('Malformed block data segment: ' + bl + ';');

                const blockName = data.palette[parseInt(paletteId, 16)];
                const block = new Block(blockName);
                
                if ((BlockArgs as any)[blockName]) {
                    const format = (BlockArgs as any)[blockName];
                    const buffer = BufferReader.from(Buffer.from(args, "hex"));

                    for (let i = 0; i < (format?.length ?? 0); i++) {
                        block.data[i] = buffer.read(format[i]);
                    }
                }

                const x = idx % data.width;
                const y = Math.floor(idx / data.width);

                // console.log(i, x, y, block);

                structure[i][x][y] = block;
                idx += 1;
            }
        }

        return structure;
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
     */
    public toString(parser: { stringify(v: any): string }): string;

    public toString(parser: { stringify(v: any): string }): string {
        const palette: BlockName[] = ["empty"];
        const layers: string[] = [];

        const data = {
            "file-version": Structure.LATEST_VERSION_ENCODING,
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
                    if (block.data.length) ENCODING += '.' + block.serialize_args().toString('hex');
                    ENCODING += ';';
                }
            }

            layers.push(ENCODING);
        }

        return parser.stringify(data);
    }
}
