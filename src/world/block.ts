import { BlockMap, BlockMapReverse } from "../build/block-mappings.js";
import BufferReader, { ComponentTypeHeader } from "../util/buffer.js";

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
     * @since 1.4.2
     */
    public static readonly Map: typeof BlockMap = BlockMap;

    /**
     * This static constant contains the number of blocks in the game.
     * This is used for block ID validation.
     *
     * @since 1.4.2
     */
    public static readonly BlockCount = Object.keys(BlockMap).length;

    /**
     * This method is used to create a block from a block id.
     *
     * @param id The block id. One of the values from {@link BlockMap}
     *
     * @since 1.4.2
     */
    public static fromId(id: number): Block {
        if (id < 0 || this.BlockCount <= id) throw new Error(`block id ${id} is out of range: expected 0-${this.BlockCount - 1}`);
        return new Block(id);
    }

    /**
     * This method is used to create a block from a block mapping.
     *
     * @param mapping The block mapping. One of the values from {@link BlockMapReverse}
     *
     * @since 1.4.2
     */
    public static fromMapping(mapping: (typeof BlockMapReverse)[keyof typeof BlockMapReverse]): Block {
        const id = BlockMap[mapping];
        if (id === undefined) throw new Error(`block mapping ${mapping} is not found in the block map`);
        return new Block(id);
    }

    /**
     * // TODO document
     */
    private constructor(id: number) {
        this.id = id;
    }

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
    public get mapping(): (typeof BlockMapReverse)[keyof typeof BlockMapReverse] {
        return BlockMapReverse[this.id];
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
    public deserialize(buffer: BufferReader): void;

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
    public deserialize(buffer: BufferReader, options: { endian: 'big', readId: false, readTypeByte: true }): void;

    // TODO describe behaviour with options set

    public deserialize(buffer: BufferReader, options?: { endian: "little" | "big"; readId: boolean; readTypeByte: boolean }) {
        options ||= {
            endian: "little",
            readId: true,
            readTypeByte: false,
        };

        // TODO refactor to better pattern
        // Inspiration: https://github.com/Anatoly03/pixelwalker.js/blob/9bb3c7e39a45006086a2abae8c515599bd3db835/src/world/block.ts#L201

        // TODO use the block data to update the block instance

        // TODO do not allow overwriting id, use static method instead: deserializeFromWorldData
        // id has to be immutable, and this is a strict constraint

        if (options.readId) {
            // The new block id of this block instance. If instead the
            // buffer should not be read, the field `readId` has to be
            // unset. Then the id is kept as it is.
            (this as any).id = buffer.readUInt32LE();
        }

        switch (this.mapping) {
            case "coin_gold_door":
            case "coin_blue_door":
            case "coin_gold_gate":
            case "coin_blue_gate":
                buffer.read(ComponentTypeHeader.Int32, options);
                break;

            case "effects_jump_height":
                buffer.read(ComponentTypeHeader.Int32, options);
                break;

            case "effects_fly":
                buffer.read(ComponentTypeHeader.Boolean, options);
                break;

            case "effects_speed":
                buffer.read(ComponentTypeHeader.Int32, options);
                break;

            case "effects_invulnerability":
                buffer.read(ComponentTypeHeader.Boolean, options);
                break;

            case "effects_curse":
                buffer.read(ComponentTypeHeader.Int32, options);
                break;

            case "effects_zombie":
                buffer.read(ComponentTypeHeader.Int32, options);
                break;

            case "effects_gravityforce":
                buffer.read(ComponentTypeHeader.Int32, options);
                break;

            case "effects_multi_jump":
                buffer.read(ComponentTypeHeader.Int32, options);
                break;

            // gravity effects no data
            // effects off
            // effects zombie

            case "tool_portal_world_spawn":
                buffer.read(ComponentTypeHeader.Int32, options);
                break;

            case "sign_normal":
            case "sign_red":
            case "sign_green":
            case "sign_blue":
            case "sign_gold":
                buffer.read(ComponentTypeHeader.String, options);
                break;

            case "portal":
            case "portal_invisible":
                buffer.read(ComponentTypeHeader.Int32, options);
                buffer.read(ComponentTypeHeader.Int32, options);
                buffer.read(ComponentTypeHeader.Int32, options);
                break;

            case "portal_world":
                buffer.read(ComponentTypeHeader.String, options);
                buffer.read(ComponentTypeHeader.Int32, options);
                break;

            case "switch_local_toggle":
            case "switch_global_toggle":
            case "switch_local_door":
            case "switch_local_gate":
            case "switch_global_door":
            case "switch_global_gate":
                buffer.read(ComponentTypeHeader.Int32, options);
                break;

            case "switch_local_activator":
            case "switch_global_activator":
                buffer.read(ComponentTypeHeader.Int32, options);
                buffer.read(ComponentTypeHeader.Boolean, options);
                break;

            case "switch_local_resetter":
            case "switch_global_resetter":
                buffer.read(ComponentTypeHeader.Boolean, options);
                break;

            case "hazard_death_door":
            case "hazard_death_gate":
                buffer.read(ComponentTypeHeader.Int32, options);
                break;

            case "note_drum":
            case "note_piano":
            case "note_guitar":
                buffer.read(ComponentTypeHeader.ByteArray, options);
                break;
        }
    }
}
