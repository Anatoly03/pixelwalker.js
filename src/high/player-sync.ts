import fs from "node:fs";

/**
 * Per default all player data needs these two fields.
 */
type PlayerBase = {
    readonly username: string;
    readonly accountId: string;
};

/**
 * Settings for the player sync.
 *
 * @since 1.4.8
 */
type PlayerSyncSettings = {
    parser: {
        parse(v: string): any;
        stringify(v: any): string;
    };
};

/**
 * This is a player cache that synchronizes itself with
 * the storage over the given path.
 *
 * @since 1.4.8
 */
export default class PlayerSync<PlayerType extends PlayerBase> {
    // [x: string]: PlayerType;

    /**
     * The link to the document which stores the data.
     */
    private path: string;

    /**
     * The last time the data source was modified.
     */
    private mtimeMs: number = 0;

    /**
     * The data of the players.
     */
    private data: PlayerType[] = [];

    /**
     * The serialization implementation which is used by the
     * syncer.
     *
     * @since 1.4.8
     */
    public options: PlayerSyncSettings;

    public constructor(path: string, options: Partial<PlayerSyncSettings> = {}) {
        this.path = path;

        this.options = {
            parser: JSON,
            ...options,
        };

        // Load the data if the file exists, otherwise write file.
        if (fs.existsSync(this.path)) {
            this.load();
        } else {
            this.store();
        }
    }

    //
    //
    // GETTERS
    //
    //

    /**
     * The length of the saved players.
     *
     * @since 1.4.8
     */
    public get length(): number {
        return this.data.length;
    }

    //
    //
    // STORAGE I/O
    //
    //

    /**
     * Loads the player data from the storage.
     *
     * @since 1.4.8
     */
    public load(): void {
        const stats = fs.statSync(this.path);

        // Test if file was modified since last load.
        if (stats.mtimeMs === this.mtimeMs) return;

        const file = fs.readFileSync(this.path).toString("utf-8");
        this.data = this.options.parser.parse(file);
    }

    /**
     * Saves the player data to the storage.
     *
     * @since 1.4.8
     */
    public store(): void {
        const representation = this.options.parser.stringify(this.data);
        fs.writeFileSync(this.path, representation);

        // Update the last modified time.
        this.mtimeMs = fs.statSync(this.path).mtimeMs;
    }

    /**
     * Create a wrapper object.
     */
    private wrap(player: PlayerType): PlayerType {
        const that = this;
        const playerAccountId = player.accountId;

        return new Proxy(player, {
            get(target, prop, receiver): any {
                switch (prop) {
                    case "accountId":
                    case "username":
                        return player[prop];
                    default:
                        that.load();
                        const p = that.data.find((p) => p.accountId === playerAccountId);
                        return p?.[prop as keyof PlayerType];
                }
            },
            set(target, prop, value, receiver): boolean {
                switch (prop) {
                    case "accountId":
                    case "username":
                        return false;
                    default:
                        that.load();
                        const p = that.data.find((p) => p.accountId === playerAccountId)!;
                        p[prop as keyof PlayerType] = value;
                        that.store();
                        return true;
                }
            },
        });
    }

    //
    //
    // METHODS
    //
    //

    /**
     * Gets all stored player wrappers. These can be used to directly
     * modify the player attributes.
     *
     * @since 1.4.8
     */
    public getAll(): PlayerType[] {
        return this.data.map((p) => this.wrap(p));
    }

    /**
     * Get the player object by the associated account id.
     *
     * @since 1.4.8
     */
    public getAccount(accountId: string): PlayerType | undefined {
        return this.getAll().find((p) => p.accountId === accountId);
    }

    /**
     * Find the player object by the associated callback.
     *
     * @since 1.4.12
     */
    public findAccount(callback: (value: PlayerType) => boolean): PlayerType | undefined {
        return this.getAll().find(callback);
    }

    /**
     * Adds a new player object, if the associated account id
     * is not already stored. Returns true if the player was
     * added, false if the player was already stored.
     *
     * @since 1.4.8
     */
    public register(player: PlayerType): boolean {
        if (this.data.some((p) => p.accountId === player.accountId)) return false;

        this.data.push(player);
        this.store();

        return true;
    }
}
