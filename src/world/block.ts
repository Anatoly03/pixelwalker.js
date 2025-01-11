import { BlockMappings, BlockMappingsReverse } from "../data/block-mappings.js";
import { WorldBlockFilledPacket, WorldBlockPlacedPacket } from "../network/pixelwalker_pb.js";
import BufferReader, { ComponentTypeHeader } from "../util/buffer-reader.js";
import BlockArgs from "./block-extra.js";

/**
 * This type represents the block numeric id that can be used in the game.
 *
 * ```ts
 * const blockId: BlockId = 0;
 * const block = new Block(blockId);
 * block.name; // 'empty'
 * ```
 */
export type BlockId = (typeof BlockMappings)[BlockName];

/**
 * This type represents the block mapping name that can be used in the game.
 *
 * ```ts
 * const blockName: BlockName = 'empty';
 * const block = new Block(blockName);
 * block.id; // 0
 * ```
 */
export type BlockName = keyof typeof BlockMappings;

/**
 * A block is a single unit in the game world matrix. This class contains
 * static access to all blocks in the game with their uppercase mapping or
 * by id.
 *
 * ```ts
 * console.log(Block['EMPTY']); // Block[empty]
 * ```
 */
export class Block {
    /**
     * @todo
     */
    public static Mappings = BlockMappings;

    /**
     * Retrieve the block argument based on the argument number.
     *
     * @example
     * const portal = Block['portal'];
     * portal[0] = 1;   // rotation
     * portal[1] = 100; // portal id
     * portal[2] = 101; // target portal id
     */
    [arg: number]: string | number | bigint | boolean | Buffer;

    /**
     * The unique id of a block. Block ID changes accross updates.
     * If you want to save persistant data, refer the block mapping.
     */
    public readonly id: BlockId;

    /**
     * Block arguments are additional data that is sent with the block.
     */

    /**
     * Block arguments are additional data that is sent with the block.
     */
    // TODO add never ternary for blocks without data.
    // TODO data: FormatType<(typeof BlockArgs)[keyof typeof BlockArgs]>;
    public data: (string | number | bigint | boolean | Buffer)[] = [];

    /**
     * Create a new block instance based on its' block id or block mapping.
     */
    public constructor(id: BlockId | BlockName) {
        switch (true) {
            case id === undefined:
                throw new Error("Block id is undefined");
            // this.id = 0 as Index;
            // break;
            case typeof id === "string" && BlockMappings[id] !== undefined:
                this.id = BlockMappings[id];
                break;
            case typeof id === "number":
                this.id = id;
                break;
            default:
                throw new Error("Unreachable: Invalid block id despite type hint.");
        }

        if ((BlockArgs as any)[this.name]) {
            this.data = new Array((BlockArgs as any)[this.name].length);
        }

        // for (let i = 0; i < this.args_t.length; i++) {
        //     this[i] = this.args[i]; // TODO make this a getter/ reference cell
        // }
    }

    //
    //
    // METHODS
    //
    //

    /**
     * Retrieves the mapping name of the block based on its' id.
     */
    public get name(): BlockName {
        return BlockMappingsReverse[this.id];
    }

    /**
     * Create a packet to place the block in the world.
     *
     * @since 1.3.4
     */
    public toPacket(layer: 0 | 1, ...positions: { x: number; y: number }[]): ["worldBlockPlacedPacket", WorldBlockPlacedPacket] {
        return [
            "worldBlockPlacedPacket",
            {
                $typeName: "WorldPackets.WorldBlockPlacedPacket",
                playerId: 0,
                isFillOperation: false,
                extraFields: this.serialize_args(),
                positions: positions.map((pos) => ({ $typeName: "WorldPackets.PointInteger", ...pos })),
                layer: layer,
                blockId: this.id,
            },
        ];
    }

    /**
     * Create a fill packet to place the block in the world.
     *
     * @since 1.3.4
     */
    public toFillPacket(layer: 0 | 1, position: { x: number; y: number }, args?: { ignoreLayers: boolean }): ["worldBlockFilledPacket", WorldBlockFilledPacket] {
        return [
            "worldBlockFilledPacket",
            {
                $typeName: "WorldPackets.WorldBlockFilledPacket",
                extraFields: this.serialize_args(),
                ignoreLayers: false,
                position: { $typeName: "WorldPackets.PointInteger", ...position },
                layer: layer,
                blockId: this.id,
            },
        ];
    }

    /**
     * Returns if two blocks are equal based on their id and arguments.
     */
    public equals(other: Block): boolean {
        if ((this.id as number) !== other.id) return false;
        if (this.data.length !== other.data.length) return false;

        for (let i = 0; i < this.data.length; i++) {
            if (this.data[i] !== other.data[i]) return false;
        }

        return true;
    }

    //
    //
    // STORAGE I/O
    //
    //

    /**
     * Serialize block arguments to the buffer writer.
     */
    public serialize_args(): Buffer {
        const buffers: Buffer[] = [];
        const format: ComponentTypeHeader[] = (BlockArgs as any)[this.name];

        for (let i = 0; i < (format?.length ?? 0); i++) {
            buffers.push(BufferReader.Dynamic(format[i], this.data[i]));
        }

        return Buffer.concat(buffers);
    }

    /**
     * Deserialize a block from the buffer reader.
     */
    public static deserialize(buffer: BufferReader): Block {
        const blockId = buffer.readUInt32LE();
        const block = new Block(blockId);
        block.deserialize_args(buffer);
        return block;
    }

    /**
     * Deserialize a block arguments from the buffer reader.
     */
    public deserialize_args(buffer: BufferReader, flag = false): this {
        const format: ComponentTypeHeader[] = (BlockArgs as any)[this.name];

        for (let i = 0; i < (format?.length ?? 0); i++) {
            if (flag) {
                buffer.expectUInt8(format[i]);
            }

            this.data[i] = buffer.read(format[i], !flag);
        }

        return this;
    }

    /**
     * Deserialize the block from the string.
     */
    // public static fromString(value: string): Block {
    //     const parts = value.split(".");
    //     const blockId = parseInt(parts[0], 16);
    //     const block = new Block(blockId);
    //     const format: ComponentTypeHeader[] = (BlockArgs as any)[block.name];

    //     if (parts.length > 1) {
    //         const args = parts[1];
    //         const buffer = BufferReader.from(Buffer.from(args, "hex"));

    //         for (let i = 0; i < (format?.length ?? 0); i++) {
    //             block.data[i] = buffer.read(format[i]);
    //         }

    //         // if ((BlockArgs as any)[block.name]) {
    //         //     block.args_t = (BlockArgs as any)[block.name];

    //         //     for (const type of block.args_t) {
    //         //         block.args.push(buffer.read(type));
    //         //     }
    //         // }
    //     }

    //     return block;
    // }

    /**
     * Provides a custom string representation of the block which
     * is used for printing the block to stdout.
     */
    [Symbol.for("nodejs.util.inspect.custom")]() {
        return `Block[\x1b[0;33m${this.name ?? this.id}\x1b[0;0m]`;
    }

    /**
     * Returns a string representation of the block as understood by the API.
     */
    public toString(): string {
        return `Block[${this.name ?? this.id}${this.data.length > 0 ? ";" + this.data.toString() : ""}]`;
    }
}

export default Block;
