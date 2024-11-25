import { BlockMappings, BlockMappingsReverse } from "../data/block-mappings";
import BufferReader from "../util/buffer-reader";
import { FormatType } from "../util/types";
import { BlockArgs } from "../world/block";

/**
 * A Block is a collection of data defining one unit on the game world
 * coordinates.
 *
 * @param Index The index of the block in the block mappings. By being a
 *              generic, this allows for type hinting the blocks' attributes
 *              in code.
 *
 * @var id The unique id of a block. Block ID changes accross updates.
 */
export type Block<Index extends number = number> = {
    [ArgIdx in number]: FormatType<(typeof BlockArgs)[(typeof BlockMappingsReverse)[Index] & keyof typeof BlockArgs]>[ArgIdx];
} & {
    /**
     * The unique id of a block. Block ID changes accross updates.
     */
    id: Index;

    /**
     * The unique mapping of a block. They mostly remain persistent
     * across updates, but may be updated.
     */
    name: (typeof BlockMappingsReverse)[Index];

    /**
     * Additional block arguments. These are additional data that is sent
     * with the block.
     */
    // TODO add never ternary for blocks without data.
    // TODO data: FormatType<(typeof BlockArgs)[keyof typeof BlockArgs]>;
    data: (string | number | bigint | boolean | Buffer)[];
};

/**
 * @todo // TODO
 */
export type BlockMap = {
    [Index in number]: Block<Index>;
} & {
    [Name in Uppercase<keyof typeof BlockMappings & string>]: Block<(typeof BlockMappings)[Name]>;
} & {
    /**
     * Create a new instance of the empty block (`id=0`)
     */
    new (): Block<0>;

    /**
     * Create a new instance of a block by its' numeric id.
     */
    new <I extends number>(id: I): Block<I>;

    /**
     * Create a new instance of a block by its' string mapping.
     */
    new <N extends keyof typeof BlockMappings & string>(name: N): Block<(typeof BlockMappings)[N]>;

    /**
     * Create a new buffer serialized from a block.
     *
     * @param block Block that should be serialized into a byte
     *              buffer.
     */
    serialize_args(block: Block<number>): Buffer;

    /**
     * Create a new instance of a block by deserializing the buffer.
     *
     * @param buffer Byte Buffer containing the block data in
     *               serialized format.
     */
    deserialize(buffer: BufferReader): Block<number>;
};

export default Block;
