import * as fs from "fs";
import Structure from "../world/structure.js";
import StructureParser from "../world/parser";

/**
 * The entry type of the structure tiles.
 *
 * @since 1.4.9
 */
type StructureEntry<Meta extends Record<string, any> = {}> = {
    structure: Structure<Meta>;
    mtime: number;
};

/**
 * Settings for the player sync.
 *
 * @since 1.4.9
 */
type StructureQueueSyncSettings = {
    parser: {
        parse(v: string): any;
        stringify(v: any): string;
    };
    sourcePath: string | null;
    resyncTime: number;
};

/**
 * The synced StructureQueue is a structure queue which is
 * periodically pulled from the file system. This is useful
 * for dynamic structures which are modified during runtime.
 *
 * The queue is a list of structures which allows methods to
 * grab the next structure, or a random one.
 *
 * @example
 *
 * ```typescript
 * import YAML from "yaml";
 * import { StructureQueueSync } from "pixelwalker.js/high";
 * import { game } from ".";
 *
 * export const topLeftX = 38;
 * export const topLeftY = 44;
 *
 * export type StructureMeta = {
 *     name: string;
 *     creator: string;
 * };
 *
 * export const structures = await StructureQueueSync.create<StructureMeta>({
 *     parser: YAML,
 *     sourcePath: "./maps",
 * });
 *
 * export async function build() {
 *     const s = await structures.next();
 *     await game.world.pasteStructure(s, topLeftX, topLeftY);
 * }
 *
 * export default structures;
 *
 * ```
 *
 * @since 1.4.9
 */
export default class StructureQueueSync<Meta extends Record<string, any> = {}> {
    /**
     * Entry of all tiles and their relative path.
     *
     * @param path The relative path to the structure.
     */
    private tiles: { [path: string]: StructureEntry<Meta> } = {};

    /**
     * The structure queue.
     */
    private queue: Structure<Meta>[] = [];

    /**
     *
     */
    private lastReload: number = 0;

    /**
     * The serialization implementation which is used by the
     * syncer.
     *
     * @since 1.4.8
     */
    public readonly options: StructureQueueSyncSettings;

    /**
     * The structure parser, defined with settings.
     */
    private parser: StructureParser<any>;

    private constructor(options: Partial<StructureQueueSyncSettings> = {}) {
        this.options = {
            parser: JSON,
            sourcePath: null,
            resyncTime: 2500,
            ...options,
        };

        this.parser = Structure.parser(this.options.parser);
    }

    //
    //
    // GETTERS
    //
    //

    /**
     * The number of structures in the queue.
     *
     * @since 1.4.9
     */
    get length() {
        return this.tiles.length;
    }

    //
    //
    // STATIC FUNCTIONS
    //
    //

    /**
     * Creates a new instance of the player queue.
     *
     * @since 1.4.9
     */
    public static async create<Meta extends Record<string, any> = {}>(options: Partial<StructureQueueSyncSettings> = {}): Promise<StructureQueueSync<Meta>> {
        const structure = new StructureQueueSync<Meta>(options);

        if (options.sourcePath) {
            await structure.load(options.sourcePath);
        }

        structure.lastReload = performance.now();

        return structure;
    }

    //
    //
    // METHODS
    //
    //

    /**
     * Gets all structures in the queue.
     *
     * @since 1.4.9
     */
    public async all(): Promise<readonly Structure<Meta>[]> {
        await this.reload();

        return Object.entries(this.tiles).map(([_path, { structure }]) => structure);
    }

    /**
     * Gets the next queued structured, or selects randomly.
     * Asserts, that the structure list _or_ the queue is not
     * empty.
     *
     * @since 1.4.9
     */
    public async next(): Promise<Structure<Meta>> {
        return this.queue.shift() ?? this.random();
    }

    /**
     * Adds the input structure at the end of the queue.
     */
    public async pushQueue(structure: Structure<Meta>): Promise<void> {
        this.queue.push(structure);
    }

    /**
     * Gets a random structure, **ignoring** queue order. Asserts,
     * that the structure list is not empty.
     *
     * @since 1.4.9
     */
    public async random(): Promise<Structure<Meta>> {
        await this.reload();

        const structures = await this.all();
        const idx = (Math.random() * structures.length) | 0;
        return structures[idx];
    }

    /**
     * Syncs the queue with the directory entries.
     *
     * // TODO optimize
     */
    private async reload() {
        // If source path is not defined, skip.
        if (!this.options.sourcePath) return;

        // If last reload is less then sync time, skip.
        if (performance.now() - this.lastReload < this.options.resyncTime) return;

        this.lastReload = performance.now();

        // Load new structures.
        this.load(this.options.sourcePath);

        // Structures which were deleted, which no longer
        // exist in the file system have to be removed.
        for (const path in this.tiles) {
            if (!fs.existsSync(path)) {
                delete this.tiles[path];
                continue;
            }

            const stat = fs.statSync(path);

            // Check if the file was modified.
            if (this.tiles[path].mtime !== stat.mtimeMs) {
                const data = fs.readFileSync(path, { encoding: "utf-8" });
                this.tiles[path] = {
                    mtime: stat.mtimeMs,
                    structure: this.parser.fromString(data) as any,
                };
            }
        }
    }

    /**
     * Syncs the queue with the directory entries.
     *
     * // TODO optimize
     */
    private load(path: string): Promise<any> {
        // If the tile is already registered, skip.
        if (this.tiles[path]) return Promise.resolve(true);

        // If we're in a directory, load all files.
        if (fs.lstatSync(path).isDirectory()) {
            const paths = fs.readdirSync(path).map((p) => `${path}/${p}`);

            return Promise.all(
                paths.map((entryPath) => {
                    return this.load(entryPath);
                })
            );
        }

        // Otherwise, load and parse the file.
        return new Promise((resolve, reject) => {
            const stat = fs.statSync(path);

            fs.readFile(path, { encoding: "utf-8" }, (err, data) => {
                if (err) return reject(err);

                this.tiles[path] = {
                    mtime: stat.mtimeMs,
                    structure: this.parser.fromString(data) as any,
                };

                resolve(true);
            });
        });
    }
}
