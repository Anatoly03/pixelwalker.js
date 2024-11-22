import { BlockMappings, BlockMappingsReverse } from "../data/block-mappings";
import BufferReader, { ComponentTypeHeader } from "../util/buffer-reader";

/**
 * A block is a single unit in the game world matrix. 
 */
export class Block {
    /**
     * Retrieve a default block by its' id or string identifier.
     */
    static [id: number]: Block;

    /**
     * Deserialize a block from the buffer reader.
     */
    public static deserialize(buffer: BufferReader): Block {
        const blockId = buffer.readUInt32LE();
        const block = new Block(blockId);

        if ((BlockData as any)[block.name]) {
            block.args_t = (BlockData as any)[block.name];

            for (const type of block.args_t) {
                block.args.push(buffer.read(type));
            }
        }

        return block;
    }

    /**
     * The unique id of a block. Block ID changes accross updates.
     * If you want to save persistant data, refer the block mapping.
     */
    public id: number;

    /**
     * Block arguments are additional data that is sent with the block.
     */
    
    /**
     * Block arguments are additional data that is sent with the block.
    */
    public args: (string | number | bigint | boolean | Buffer)[] = [];
    private args_t: ComponentTypeHeader[] = [];

    /**
     * Create a new block instance based on its' block id.
     */
    public constructor(id: number);

    public constructor(id: number | string | undefined) {
        switch (true) {
            case (id === undefined):
                this.id = 0;
                break;
            case (typeof id === 'string'):
                this.id = BlockMappings[id];
                break;
            case (typeof id === 'number'):
                this.id = id;
                break;
            default:
                throw new Error('Unreachable: Invalid block id despite type hint.');
        }
    }

    /**
     * Retrieves the mapping name of the block based on its' id.
     */
    public get name(): string {
        return BlockMappingsReverse[this.id];
    }

    /**
     * Provides a custom string representation of the block which
     * is used for printing the block to stdout.
     */
    [Symbol.for('nodejs.util.inspect.custom')]() {
        return `Block[\x1b[0;33m${this.name ?? this.id}\x1b[0;0m]`;
    }
};

/**
 * This mapping contains definitins of block data which require additional
 * arguments to be sent or received with.
 */
export const BlockData = {
    'coin_gold_door': [ComponentTypeHeader.Int32],
    'coin_blue_door': [ComponentTypeHeader.Int32],
    'coin_gold_gate': [ComponentTypeHeader.Int32],
    'coin_blue_gate': [ComponentTypeHeader.Int32],

    "effects_jump_height": [ComponentTypeHeader.Int32],
    "effects_fly": [ComponentTypeHeader.Boolean],
    "effects_speed": [ComponentTypeHeader.Int32],
    "effects_invulnerability": [ComponentTypeHeader.Boolean],
    "effects_curse": [ComponentTypeHeader.Int32],
    "effects_zombie": [ComponentTypeHeader.Int32],
    "effects_gravityforce": [ComponentTypeHeader.Int32],
    "effects_multi_jump": [ComponentTypeHeader.Int32],
    // gravity effects no data
    // effects off
    // effects zombie

    'tool_portal_world_spawn': [ComponentTypeHeader.Int32],

    'sign_normal': [ComponentTypeHeader.String],
    'sign_red': [ComponentTypeHeader.String],
    'sign_green': [ComponentTypeHeader.String],
    'sign_blue': [ComponentTypeHeader.String],
    'sign_gold': [ComponentTypeHeader.String],

    'portal': [ComponentTypeHeader.Int32, ComponentTypeHeader.Int32, ComponentTypeHeader.Int32],
    'portal_invisible': [ComponentTypeHeader.Int32, ComponentTypeHeader.Int32, ComponentTypeHeader.Int32],
    'portal_world': [ComponentTypeHeader.String, ComponentTypeHeader.Int32],
    
    "switch_local_toggle": [ComponentTypeHeader.Int32],
    "switch_local_activator": [ComponentTypeHeader.Int32, ComponentTypeHeader.Boolean],
    "switch_local_resetter": [ComponentTypeHeader.Boolean],
    "switch_local_door": [ComponentTypeHeader.Int32],
    "switch_local_gate": [ComponentTypeHeader.Int32],
    "switch_global_toggle": [ComponentTypeHeader.Int32],
    "switch_global_activator": [ComponentTypeHeader.Int32, ComponentTypeHeader.Boolean],
    "switch_global_resetter": [ComponentTypeHeader.Boolean],
    "switch_global_door": [ComponentTypeHeader.Int32],
    "switch_global_gate": [ComponentTypeHeader.Int32],

    'hazard_death_door': [ComponentTypeHeader.Int32],
    'hazard_death_gate': [ComponentTypeHeader.Int32],
};

/**
 * This function initializes static block instances based on
 * the block mappings on the `Block` class. This maps `BLOCK
 * ID TO BLOCK`
 */
(() => {
    for (const id of Object.keys(BlockMappingsReverse)) {
        Block[+id] = new Block(+id);
    }
})();

export default Block;
