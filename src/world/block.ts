import CONFIG from "../config.js";
import { BlockMap } from "../build/block-mappings.js";

/**
 * @since 1.4.2
 */
export default class Block {

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

}