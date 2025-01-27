import { Mappings, Palette } from "../build/block-mappings.js";
import BufferReader from "../util/buffer.js";
import { BlockData } from "./block-args.js";

import { create } from "@bufbuild/protobuf";
import { WorldBlockPlacedPacket, WorldBlockPlacedPacketSchema } from "../protocol/world_pb.js";

/**
 * @since 1.4.2
 */
export default class Block {
    /**
     * The block id. This is a number that represents the block in the
     * current game version. If you want to get a persistant block
     * identifier, use {@link name}
     *
     * @since 1.4.2
     */
    public readonly id: number;

    /**
     *
     */
    public readonly data: (boolean | number | bigint | string | Buffer)[] = [];

    // /**
    //  * The sign content of the block. This is used to store the text
    //  * of a sign block. This is only available if the block is a sign
    //  * block. To check if the block can use this attribute, use
    //  * {@link isPortal}.
    //  */
    // private signContent!: string;

    //
    //
    // STATIC
    //
    //

    /**
     * This static constant contains the mappings of block names to
     * block IDs. This is used to map persistant block names to game
     * blocks.
     *
     * @deprecated Use {@link Palette} instead.
     *
     * @since 1.4.2
     */
    public static readonly Map: typeof Mappings = Mappings;

    /**
     * This static constant contains the palette of block mappings,
     * the entry at index `i` is the block name of the block with
     * the id `i`.
     *
     * @since 1.4.5
     */
    public static readonly Palette: typeof Palette = Palette;

    /**
     * This static constant contains the number of blocks in the game.
     * This is used for block ID validation.
     *
     * @deprecated Use {@link Palette.length} instead.
     *
     * @since 1.4.2
     */
    public static readonly BlockCount = Palette.length;

    /**
     * This method is used to create a block from a block id.
     *
     * @param id The block id. One of the values from {@link BlockMap}
     *
     * @since 1.4.2
     */
    public static fromId(id: number): Block {
        if (id < 0 || this.Palette.length <= id) throw new Error(`block id ${id} is out of range: expected 0-${this.Palette.length - 1}`);
        return new Block(id);
    }

    /**
     * This method is used to create a block from a block mapping.
     *
     * @param mapping The block mapping. One of the values from {@link BlockMapReverse}
     *
     * @since 1.4.2
     */
    public static fromMapping(mapping: (typeof Palette)[number]): Block {
        const id = Palette.indexOf(mapping);
        if (id < 0) throw new Error(`block mapping ${mapping} is not found in the global block palette`);
        return new Block(id);
    }

    /**
     * // TODO document
     */
    private constructor(id: number) {
        this.id = id;
        this.data.length = BlockData[Palette[this.id] as keyof typeof BlockData]?.length ?? 0;
    }

    //
    //
    // GUARDS
    //
    //

    // /**
    //  * Is true, if the block is a coin-triggered block. These
    //  * are coin-based doors and gates.
    //  *
    //  * @since 1.4.3
    //  */
    // public isCoinTriggered(): this is Block & {
    //     /**
    //      * The amount of coins needed to trigger the effect,
    //      * either lock or unlock a door/ gate.
    //      *
    //      * @since 1.4.3
    //      */
    //     coins: number;
    // } {
    //     switch (this.mapping) {
    //         case "coin_gold_door":
    //         case "coin_blue_door":
    //         case "coin_gold_gate":
    //         case "coin_blue_gate":
    //             return true;
    //         default:
    //             return false;
    //     }
    // }

    // /**
    //  * Is true if the block is a **sign**. This is used to typehint
    //  * relative attributes.
    //  *
    //  * @since 1.4.3
    //  */
    // public isSign(): this is SignBlock {
    //     return this instanceof SignBlock;
    // }

    // /**
    //  * Is true if the block is a **portal**. This is used to typehint
    //  * relative attributes.
    //  *
    //  * This is not to be confused with the **world portal**, guarded
    //  * behind {@link isWorldPortal}. The portal block is a block that
    //  * teleports the player to another location in the world, not an
    //  * entirely different world.
    //  *
    //  * @since 1.4.3
    //  */
    // public isPortal() {
    //     switch (this.mapping) {
    //         case "portal":
    //         case "portal_invisible":
    //             return true;
    //         default:
    //             return false;
    //     }
    // }

    // /**
    //  * Is true if the block is a **world portal**. This is used to
    //  * typehint relative attributes.
    //  *
    //  * This is not to be confused with the **portal**, guarded behind
    //  * {@link isPortal}. The world portal block is a block that teleports
    //  * the player to another world.
    //  *
    //  * @since 1.4.3
    //  */
    // public isWorldPortal(): this is Block & {
    //     /**
    //      * The target world id of the portal block. This is the world
    //      * players get sent to if redirected.
    //      *
    //     *
    //      * @since 1.4.3
    //     */
    //     // TODO replace string with world id class and provide better methods.
    //     targetWorldId: string;

    //     /**
    //      * // TODO document
    //      *
    //      * @since 1.4.3
    //      */
    //     spawnId: number;
    // } {
    //     switch (this.mapping) {
    //         case "portal_world":
    //             return true;
    //         default:
    //             return false;
    //     }
    // }

    //
    //
    // GETTERS
    //
    //

    /**
     * The block mapping. This is a string that represents the block via
     * a persistant identifier. When the block mapping changes, the block
     * is usually updated with migration files. This is the recommended
     * way to save block data.
     *
     * If you are saving structured world data, it is recommended that you
     * add a `palette` entry which map the internal id's to the block name
     * and update the palette with migration files if needed.
     *
     * @since 1.4.2
     */
    public get mapping(): (typeof Palette)[number] {
        // TODO lazy save the block mapping.

        return Palette[this.id];
    }

    //
    //
    // METHODS
    //
    //

    /**
     * Returns a value copy of the block. This is used to
     * desync block references from the original block.
     *
     * @since 1.4.3
     */
    public copy() {
        return new Block(this.id);
    }

    /**
     * Returns wether two blocks are equal. This is used to
     * compare blocks in the game, mostly by the block
     * scheduler to verify placed blocks.
     *
     * Any two blocks are equal if and only if their id and
     * their block data is equal.
     *
     * @since 1.4.3
     */
    public equals(other: Block): boolean {
        if (this.id !== other.id) return false;
        if (this.data.length !== other.data.length) return false;

        for (let i = 0; i < this.data.length; i++) {
            if (this.data[i] !== other.data[i]) return false;
        }

        return true;
    }

    //
    //
    // GAME SERIALIZATION
    //
    //

    /**
     * Deserializes a block from a {@link BufferReader} and converts
     * itself into the block of that type. This will scan the block
     * id (4 bytes) from the buffer followed by optional block data,
     * where each data entry **skips** the type byte. Little Endian
     * is used in the world data.
     *
     * **The difference between the static and the instance method is
     * that static method will serialize the block and create a new
     * block instance, while the instance method will modify the block.**
     *
     * @example
     *
     * ```typescript
     * PlayerInit {
     *     worldWidth: 2,
     *     worldHeight: 1,
     *     data: [0x00, ????, 0xFF, 0, 0, 0] // Coin Gold Door with value = 255
     *     //     ^^^^ block id (top left): empty block
     *     //           ^^^^ block id of the coin gold door
     *     //                | type byte of following data omitted
     *     //                 ^^^^^^^^^^^^^ data
     * }
     * ```
     *
     * ### Summary
     *
     * - Block ID is 4 bytes, followed by block-specific data
     * - Numbers are in **Little Endian**, type bytes are omitted
     *
     * @since 1.4.4
     */
    public static deserialize(buffer: BufferReader, options: { endian: "little"; readTypeByte: false; palette?: string[] }): Block;

    public static deserialize(buffer: BufferReader, options: { endian?: "little" | "big"; readTypeByte?: boolean; palette?: string[] } = {}): Block {
        options.endian ??= "little";
        options.readTypeByte ??= false;
        options.palette ??= Palette;
        
        const blockLocalId = buffer.readUInt32LE();
        const blockMapping = options.palette[blockLocalId];

        if (blockMapping === undefined) {
            throw new Error(`block mapping ${blockMapping} (derived from block id ${blockLocalId} in the ${Palette.length == options.palette.length ? "global" : "custom provided"} block palette) is not found`);
        }

        const block = Block.fromMapping(blockMapping);

        block.deserialize(buffer, options);

        return block;
    }

    /**
     * Deserializes a block from a {@link BufferReader} and converts
     * itself into the block of that type. This will scan the block
     * id (4 bytes) from the buffer followed by optional block data,
     * where each data entry **skips** the type byte. Little Endian
     * is used in the world data.
     *
     * @example
     *
     * ```typescript
     * PlayerInit {
     *     worldWidth: 2,
     *     worldHeight: 1,
     *     data: [0x00, ????, 0xFF, 0, 0, 0] // Coin Gold Door with value = 255
     *     //     ^^^^ block id (top left): empty block
     *     //           ^^^^ block id of the coin gold door
     *     //                | type byte of following data omitted
     *     //                 ^^^^^^^^^^^^^ data
     * }
     * ```
     *
     * ### Summary
     *
     * - Block ID is 4 bytes, followed by block-specific data
     * - Numbers are in **Little Endian**, type bytes are omitted
     *
     * @deprecated Set the options to `endian = "little"` and
     * `readTypeByte = false`. The options object will be required
     * in future versions.
     *
     * @since 1.4.2
     */
    // TODO deprecated: remove in 1.5.0
    // TODO make options required in 1.5.0
    public deserialize(buffer: BufferReader): void;

    /**
     * Deserializes a block from a {@link BufferReader} and converts
     * itself into the block of that type. This will scan the block
     * id (4 bytes) from the buffer followed by optional block data,
     * where each data entry **skips** the type byte. Little Endian
     * is used in the world data.
     *
     * @example
     *
     * ```typescript
     * PlayerInit {
     *     worldWidth: 2,
     *     worldHeight: 1,
     *     data: [0x00, ????, 0xFF, 0, 0, 0] // Coin Gold Door with value = 255
     *     //     ^^^^ block id (top left): empty block
     *     //           ^^^^ block id of the coin gold door
     *     //                | type byte of following data omitted
     *     //                 ^^^^^^^^^^^^^ data
     * }
     * ```
     *
     * ### Summary
     *
     * - Block ID is 4 bytes, followed by block-specific data
     * - Numbers are in **Little Endian**, type bytes are omitted
     *
     * @since 1.4.2
     */
    public deserialize(buffer: BufferReader, options: { endian: "little"; readTypeByte: false }): void;

    /**
     * Deserializes a block from a {@link BufferReader} and converts
     * itself into the block of that type. This particular method will
     * scan block data in big endian format, reading type bytes.
     *
     * @example
     *
     * ```typescript
     * WorldBlockPlacedPacket {
     *     blockId: coin_gold_door.id,
     *     data: [0x03, 0, 0, 0, 0xFF] // Coin Gold Door with value = 255
     *     //     ^^^^ type byte
     *     //           ^^^^^^^^^^^^^ data
     * }
     * ```
     *
     * ### Summary
     *
     * - Numbers are in **Big Endian**, type bytes are included
     *   in the block data.
     *
     * @since 1.4.3
     */
    public deserialize(buffer: BufferReader | WithImplicitCoercion<ArrayBuffer>, options: { endian: "big"; readTypeByte: true }): void;

    /**
     * This signature provides a custom signature to deserialize the
     * block with custom options. **If you read this, you are likely
     * using the method wrong.**
     *
     * Deserializes a block from a {@link BufferReader} and converts
     * itself into the block of that type. This particular method will
     * scan block data in big endian format, reading type bytes.
     *
     * For deserialization from world data, use `endian = "big"` and
     * `readTypeByte = true`, for deserialization from packets, use
     * `endian = "little"` and `readTypeByte = false`, or omit options
     * entirely.
     *
     * @since 1.4.4
     */
    public deserialize(buffer: BufferReader | WithImplicitCoercion<ArrayBuffer>, options?: { endian?: "little" | "big"; readTypeByte?: boolean }): void;

    // TODO describe behaviour with options set

    public deserialize(buffer: BufferReader | WithImplicitCoercion<ArrayBuffer>, options: { endian?: "little" | "big"; readTypeByte?: boolean } = {}) {
        options.endian ??= "little";
        options.readTypeByte ??= false;

        // If the buffer is not a BufferReader, convert it to one.
        // We allow implicit coercion to make the method more flexible
        // with other buffer types.
        if (!(buffer instanceof BufferReader)) {
            buffer = BufferReader.from(buffer);
        }

        // TODO refactor to better pattern
        // Inspiration: https://github.com/Anatoly03/pixelwalker.js/blob/9bb3c7e39a45006086a2abae8c515599bd3db835/src/world/block.ts#L201

        const blockData = BlockData[this.mapping as keyof typeof BlockData] ?? [];
        this.data.length = 0;

        for (const dataType of blockData) {
            const entry = buffer.read(dataType, options);
            this.data.push(entry);
        }
    }

    /**
     * Serializes the block into a buffer. This is used to convert
     * the block into a binary format that can be sent over the game
     * server.
     *
     * - Little Endian
     * - With Id
     * - Type Byte omitted
     *
     * @since 1.4.3
     */
    public serialize(): Buffer;

    /**
     * // TODO document
     *
     * @since 1.4.3
     */
    public serialize(options: { endian: "big"; writeId: false; writeTypeByte: true }): Buffer;

    /**
     * **You are using custom serialization options. These are not used
     * in the game networking, the world block placed message data or the
     * world data in init.**
     *
     * @since 1.4.3
     */
    public serialize(options: { endian: "little" | "big"; writeId: boolean; writeTypeByte: boolean; palette?: string[] }): Buffer;

    public serialize(options: { endian?: "little" | "big"; writeId?: boolean; writeTypeByte?: boolean; palette?: string[] } = {}): Buffer {
        options.endian ??= "little";
        options.writeId ??= false;
        options.writeTypeByte ??= false;
        options.palette ??= Palette;

        // TODO writeTypeByte currently unused because it's always true (it's in buffer util)
        if (!options.writeTypeByte) {
            console.warn("writeTypeByte was set to false: your program uses unsupported serialization options");
        }

        const buffer: Buffer[] = [];

        if (options.writeId) {
            const idBuffer = Buffer.alloc(4);
            const id = options.palette.indexOf(this.mapping);

            // If the id is not mapped on the palette, we deal
            // with a custom palette that did not define a mapping
            // for this block.
            if (id < 0) {
                throw new Error(`block mapping ${this.mapping} is not found in the ${Palette.length == options.palette.length ? "global" : "custom provided"} block palette`);
            }

            idBuffer.writeUInt32LE(id);
            buffer.push(idBuffer);
        }

        const blockData = BlockData[this.mapping as keyof typeof BlockData] ?? [];
        let idx = 0;

        for (const dataType of blockData) {
            const entry = BufferReader.Dynamic(dataType, this.data[idx++]);
            buffer.push(entry);
        }

        return Buffer.concat(buffer);
    }

    /**
     * Returns a {@link WorldBlockPlacedPacket} that represents the
     * block placed packet for this block. This is used to send the
     * block over the game server.
     *
     * Note, that this packet will not implement the block positions
     * and the layer. This has to be done by the caller.
     *
     * @since 1.4.3
     */
    public toPacket(): WorldBlockPlacedPacket {
        return create(WorldBlockPlacedPacketSchema, {
            blockId: this.id,
            extraFields: this.serialize({ endian: "big", writeId: false, writeTypeByte: true }),
        });
    }
}
