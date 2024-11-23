import { BlockMappings, BlockMappingsReverse } from "../data/block-mappings";
import BufferReader, { ComponentTypeHeader } from "../util/buffer-reader";

/**
 * This mapping contains the list of all blocks that are present in
 * the game.
 */
export const BlockList: {
    readonly [id: keyof typeof BlockMappingsReverse | keyof typeof BlockMappings]: Block;
} = new Proxy(
    {},
    {
        get: (target, prop: string) => {
            return new Block(!isNaN(+prop) ? +prop : prop);
        },
    }
);

/**
 * A block is a single unit in the game world matrix. This class contains
 * static access to all blocks in the game with their uppercase mapping or
 * by id.
 * 
 * ```ts
 * console.log(Block['EMPTY']); // Block[empty]
 * ```
 */
export class Block<Index extends number = number> {
    /**
     * Retrieve a default block by its' id or string identifier.
     *
     * @example
     *
     * ```ts
     * const empty = Block[0];
     * ```
     */
    static readonly [id: number | Uppercase<keyof typeof BlockMappings & string>]: Block;

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
    public readonly id: Index;

    /**
     * Block arguments are additional data that is sent with the block.
     */

    /**
     * Block arguments are additional data that is sent with the block.
     */
    public args: (string | number | bigint | boolean | Buffer)[] = [];
    private args_t: ComponentTypeHeader[] = [];

    /**
     * Create an instance of the empty Block. The following are equivalent.
     *
     * ```ts
     * new Block();
     * Block[0];
     * Block['empty'];
     * Block.EMPTY;
     * ```
     */
    // public constructor();

    /**
     * Create a new block instance based on its' block id.
     */
    public constructor(id: Index);

    /**
     * Create a new block instance based on its' block name.
     */
    public constructor(id: keyof typeof BlockMappings);

    public constructor(id?: number | string) {
        switch (true) {
            case id === undefined:
                this.id = 0 as Index;
                break;
            case typeof id === "string" && BlockMappings[id] !== undefined:
                this.id = BlockMappings[id] as Index;
                break;
            case typeof id === "number":
                this.id = id as Index;
                break;
            default:
                throw new Error("Unreachable: Invalid block id despite type hint.");
        }

        if ((BlockData as any)[this.name]) {
            this.args_t = (BlockData as any)[this.name];
            this.args = new Array(this.args_t.length);
        }

        for (let i = 0; i < this.args_t.length; i++) {
            this[i] = this.args[i]; // TODO make this a getter/ reference cell
        }
    }

    //
    //
    // METHODS
    //
    //

    /**
     * Retrieves the mapping name of the block based on its' id.
     */
    public get name(): (typeof BlockMappingsReverse)[Index] {
        return BlockMappingsReverse[this.id];
    }

    /**
     * Returns if two blocks are equal based on their id and arguments.
     */
    public equals(other: Block<number>): other is Block<Index> {
        if ((this.id as number) !== other.id) return false;
        if (this.args.length !== other.args.length) return false;

        for (let i = 0; i < this.args.length; i++) {
            if (this.args[i] !== other.args[i]) return false;
        }

        return true;
    }

    /**
     * Provides a custom string representation of the block which
     * is used for printing the block to stdout.
     */
    [Symbol.for("nodejs.util.inspect.custom")]() {
        return `Block[\x1b[0;33m${this.name ?? this.id}\x1b[0;0m]`;
    }

    //
    //
    // STORAGE I/O
    //
    //

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
     * Serialize block arguments to the buffer writer.
     */
    public serialize_args(): Buffer {
        const buffers: Buffer[] = [];

        for (let i = 0; i < this.args_t.length; i++) {
            buffers.push(BufferReader.Dynamic(this.args_t[i], this.args[i]));
        }

        return Buffer.concat(buffers);
    }

    /**
     * Deserialize the block from the string.
     */
    public static fromString(value: string): Block<number> {
        const parts = value.split(".");
        const blockId = parseInt(parts[0], 16);
        const block = new Block(blockId);

        if (parts.length > 1) {
            const args = parts[1];
            const buffer = BufferReader.from(Buffer.from(args, "hex"));

            if ((BlockData as any)[block.name]) {
                block.args_t = (BlockData as any)[block.name];

                for (const type of block.args_t) {
                    block.args.push(buffer.read(type));
                }
            }
        }

        return block;
    }

    /**
     * Returns a string representation of the block as understood by the API.
     */
    public toString(): string {
        let s = this.id.toString(16).padStart(2, "0");
        if (this.args.length) s += "." + this.serialize_args().toString("hex");
        s += ";";
        return s;
    }
}

/**
 * This mapping contains definitins of block data which require additional
 * arguments to be sent or received with.
 */
export const BlockData = {
    coin_gold_door: [ComponentTypeHeader.Int32],
    coin_blue_door: [ComponentTypeHeader.Int32],
    coin_gold_gate: [ComponentTypeHeader.Int32],
    coin_blue_gate: [ComponentTypeHeader.Int32],

    effects_jump_height: [ComponentTypeHeader.Int32],
    effects_fly: [ComponentTypeHeader.Boolean],
    effects_speed: [ComponentTypeHeader.Int32],
    effects_invulnerability: [ComponentTypeHeader.Boolean],
    effects_curse: [ComponentTypeHeader.Int32],
    effects_zombie: [ComponentTypeHeader.Int32],
    effects_gravityforce: [ComponentTypeHeader.Int32],
    effects_multi_jump: [ComponentTypeHeader.Int32],
    // gravity effects no data
    // effects off
    // effects zombie

    tool_portal_world_spawn: [ComponentTypeHeader.Int32],

    sign_normal: [ComponentTypeHeader.String],
    sign_red: [ComponentTypeHeader.String],
    sign_green: [ComponentTypeHeader.String],
    sign_blue: [ComponentTypeHeader.String],
    sign_gold: [ComponentTypeHeader.String],

    portal: [ComponentTypeHeader.Int32, ComponentTypeHeader.Int32, ComponentTypeHeader.Int32],
    portal_invisible: [ComponentTypeHeader.Int32, ComponentTypeHeader.Int32, ComponentTypeHeader.Int32],
    portal_world: [ComponentTypeHeader.String, ComponentTypeHeader.Int32],

    switch_local_toggle: [ComponentTypeHeader.Int32],
    switch_local_activator: [ComponentTypeHeader.Int32, ComponentTypeHeader.Boolean],
    switch_local_resetter: [ComponentTypeHeader.Boolean],
    switch_local_door: [ComponentTypeHeader.Int32],
    switch_local_gate: [ComponentTypeHeader.Int32],
    switch_global_toggle: [ComponentTypeHeader.Int32],
    switch_global_activator: [ComponentTypeHeader.Int32, ComponentTypeHeader.Boolean],
    switch_global_resetter: [ComponentTypeHeader.Boolean],
    switch_global_door: [ComponentTypeHeader.Int32],
    switch_global_gate: [ComponentTypeHeader.Int32],

    hazard_death_door: [ComponentTypeHeader.Int32],
    hazard_death_gate: [ComponentTypeHeader.Int32],
};

/**
 * This function initializes static block instances based on
 * the block mappings on the `Block` class. This maps `BLOCK
 * ID TO BLOCK`
 */
(() => {
    for (const id of Object.keys(BlockMappingsReverse)) {
        (Block as any)[+id] = new Block(+id);
    }

    for (const name of Object.keys(BlockMappings)) {
        (Block as any)[name.toUpperCase()] = new Block(BlockMappings[name]);
    }
})();

export default Block;
