import CONFIG from "../config.js";
import { BlockMap, BlockMapReverse } from "../build/block-mappings.js";

/**
 * @since 1.4.2
 */
export default class Block<BlockId extends (typeof BlockMap)[string]> {
    /**
     * The block id. This is a number that represents the block in the
     * current game version. If you want to get a persistant block
     * identifier, use {@link name}
     * 
     * @since 1.4.2
     */
    public readonly id: BlockId;

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
    public get mapping(): (typeof BlockMapReverse)[BlockId] {
        return BlockMapReverse[this.id];
    }

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
    public static fromId<BlockId extends number>(id: BlockId): Block<BlockId> {
        if (id < 0 || this.BlockCount <= id) throw new Error(`block id ${id} is out of range: expected 0-${this.BlockCount - 1}`);
        return new Block(id);
    }

    /**
     * // TODO document
     */
    private constructor(id: BlockId) {
        this.id = id;
    }
}
