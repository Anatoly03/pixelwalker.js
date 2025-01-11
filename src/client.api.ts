import PocketBase, { RecordService } from "pocketbase";

import CONFIG from "./config";

import PrivateWorld from "./types/private-world.js";
import PublicProfile from "./types/public-profile.js";
import PublicWorld from "./types/public-world.js";
import GameClient from "./client.game.js";

/**
 * The API Client is responsible for communication with the
 * {@link https://api.pixelwalker.net/ PixelWalker API Server}.
 * The API server uses {@link https://pocketbase.io/ PocketBase}
 * and manages account authentication, and retrieving storage.
 *
 * To compare it with how users sign up, the API Client is
 * the "lobby" from which you can access the open game rooms
 * or join a world.
 */
export default class APIClient {
    /**
     * The PocketBase instance used to communicate with the API
     * server. This allows for custom requests to the server if
     * this software kit is deemed not enough.
     */
    public readonly pocketbase: PocketBase;

    //
    //
    // STATIC
    //
    //

    /**
     * This is the cache for the singleton produced by
     * {@link roomTypes}. Here the room types will be stored.
     */
    static #roomTypes: string[] | undefined;

    /**
     * Create an authenticated instance of the API Client. If the
     * provided token is invalid, undefined is returned instead.
     *
     * @param token The token to use for authentication. You can
     * access this token from the the website with developer tools.
     *
     * Note, you cannot use `this.pocketbase.model` properly this
     * way as it will always default the "default value". If you
     * wish to read the contents of the cookie, you should use the
     * {@link https://www.npmjs.com/package/jwt-decode jwt-decode}\
     * module.
     *
     * @example
     *
     * ```typescript
     * import 'dotenv/config';
     * import { APIClient } from 'pixelwalker';
     *
     * const client = APIClient.withToken(process.env.TOKEN!)!;
     * ```
     *
     * Note, in this example the environment variable `TOKEN!`
     * follows an exclamation. This symbol is used in TypeScript
     * to mark a possibly undefined value as strictly defined.
     * This is a compiler hint and can be omitted in JavaScript
     * environment.
     *
     * @returns Authenticated instance of the API Client.
     *
     * @since 1.4.0
     */
    public static withToken(token: string): APIClient | undefined {
        const client = new this();
        client.pocketbase.authStore.save(token, { verified: true });

        // Return undefined if the token is invalid.
        if (!client.pocketbase.authStore.isValid) return;

        // Return the api client if the token is valid.
        return client;
    }

    /**
     * Create an authenticated instance of the API Client. This will
     * make a request to the server to authenticate the user with the
     * provided credentials. This callis **asynchronous** and yields
     * a promise. If the credentials are invalid, the promise unwraps
     * to `undefined`.
     *
     * It is recommend practice to use environment variables for
     * sensitive information like usernames and passwords. You can use
     * {@link https://www.npmjs.com/package/dotenv dotenv} to load
     * environment variables from a `.env` file. **Never commit this
     * file** to a repository.
     *
     * @example
     *
     * ```typescript
     * import 'dotenv/config';
     * import { APIClient } from 'pixelwalker';
     *
     * const client = await APIClient.withCredentials(process.env.USERNAME!, process.env.PASSWORD!);
     * ```
     *
     * @returns Authenticated instance of the API Client.
     *
     * @since 1.4.0
     */
    public static async withCredentials(username: string, password: string): Promise<APIClient | undefined> {
        const client = new this();

        try {
            await client.pocketbase.collection("users").authWithPassword(username, password);
        } catch (_) {
            return;
        }

        return client;
    }

    /**
     * Retrieves the room types from the server. This is a static
     * method and will cache the room types for future use. If you
     * want to force a reload of the room types, you can pass `true`
     * as the first argument.
     */
    public static async roomTypes(forceReload = false): Promise<string[]> {
        // Return the cached room types if they exist.
        if (this.#roomTypes && !forceReload) return this.#roomTypes;

        // Fetch the room types from the server.
        const response = await fetch(CONFIG.GAME_SERVER_HTTP + "/listroomtypes");
        const map: string[] = await response.json();

        // Cache the room types for future use.
        return (this.#roomTypes = map);
    }

    /**
     * // TODO document
     */
    protected constructor() {
        this.pocketbase = new PocketBase(CONFIG.API_SERVER_HTTP);
    }

    //
    //
    // METHODS
    //
    //

    /**
     * Returns a Pocketbase `RecordService` for the public profiles
     * collection. This allows you to search through all publicly
     * available profiles.
     *
     * It is recommend to read more on the PocketBase website and
     * experiment with the PixelWalker API server to get intuition
     * on how to use this method effectively.
     *
     * - {@link https://pocketbase.io/docs/api-rules-and-filters/ Filter Syntax}
     * - {@link https://api.pixelwalker.net/api/collections/public_profiles/records?perPage=500&page=1 Test the API}
     *
     * @example
     *
     * ```json
     * {
     *   "admin": false,
     *   "banned": false,
     *   "collectionId": "0wl44rzm22wuf2q",
     *   "collectionName": "public_profiles",
     *   "created": "2024-04-17 08:50:37.671Z",
     *   "face": 15,
     *   "id": "5cy5r7za1r3splc",
     *   "username": "ANATOLY"
     * }
     * ```
     *
     * @since 1.4.0
     */
    public profiles(): RecordService<PublicProfile> {
        return this.pocketbase.collection("public_profiles");
    }

    /**
     * Returns a Pocketbase `RecordService` for the public worlds
     * collection. This allows you to search through all worlds
     * with public visibility. Legacy worlds are excluded.
     *
     * If you want to list all worlds you own, you should instead
     * use {@link myWorlds} as it will contain more metadata such
     * as the download URL of the world data.
     *
     * It is recommend to read more on the PocketBase website and
     * experiment with the PixelWalker API server to get intuition
     * on how to use this method effectively.
     *
     * - {@link https://pocketbase.io/docs/api-rules-and-filters/ Filter Syntax}
     * - {@link https://api.pixelwalker.net/api/collections/public_worlds/records?perPage=500&page=1 Test the API}
     *
     * @example
     *
     * ```json
     * {
     *   "collectionId": "rhrbt6wqhc4s0cp",
     *   "collectionName": "public_worlds",
     *   "description": "This is a 200x200 world",
     *   "height": 200,
     *   "id": "r450e0e380a815a",
     *   "minimap": "r450e0e380a815a_6zNp6ir2pt.png",
     *   "owner": "5cy5r7za1r3splc",
     *   "plays": 654,
     *   "title": "Statsu 418",
     *   "width": 200
     * }
     * ```
     *
     * @example
     *
     * Print all worlds that have a width of more than 500 blocks.
     *
     * ```typescript
     * APIClient.withToken(process.env.TOKEN!)
     *     .worlds()
     *     .getFullList({ filter: 'width>500' })
     *     .then(console.log);
     * ```
     *
     * @since 1.4.0
     */
    public worlds(): RecordService<PublicWorld> {
        return this.pocketbase.collection("public_worlds");
    }

    /**
     * Returns a Pocketbase `RecordService` for the privately
     * owned worlds collection. You should use this method if
     * you want to look at the worlds you own.
     *
     * It is recommend to read more on the PocketBase website and
     * experiment with the PixelWalker API server to get intuition
     * on how to use this method effectively.
     *
     * - {@link https://pocketbase.io/docs/api-rules-and-filters/ Filter Syntax}
     * - {@link https://api.pixelwalker.net/api/collections/public_worlds/records?perPage=500&page=1 Test the API}
     *
     * Returns a Pocketbase [RecordService](https://github.com/pocketbase/js-sdk/blob/master/src/services/RecordService.ts).
     * See usage at the [PocketBase](https://pocketbase.io/) website for [searching records](https://pocketbase.io/docs/api-records#listsearch-records).
     * This method returns a collection handler that allows you to search through
     * all worlds owned by you.
     *
     * @example
     *
     * Print all worlds that you own.
     *
     * ```typescript
     * APIClient.withToken(process.env.TOKEN!)
     *   .myWorlds()
     *   .getFullList()
     *   .then(console.log)
     * ```
     *
     * @since 1.4.0
     */
    public myWorld(): RecordService<PrivateWorld> {
        return this.pocketbase.collection("worlds");
    }

    /**
     * Generate a join key for a specific world id. Optionally
     * overwrite room type. This key can then be used to connect
     * to a websocket on the game server.
     *
     * @example
     *
     * In this example we will set up a custom socket connection
     * with the server. After logging in with PocketBase, we will
     * retrieve the join key, and use it to connect to a room.
     * 
     * Observe: You will be disconnected in some seconds after
     * connecting, and you will receive several messages logged
     * to the console.
     *
     * ```typescript
     * export const client = APIClient.withToken(process.env.token);
     * const joinkey = await client.getJoinKey('4naaehf4xxexavv');
     * const socket = new WebSocket(`wss://game.pixelwalker.net/room/${joinkey}`);
     * socket.binaryType = 'arraybuffer';
     *
     * socket.onmessage = event => {
     *     const buffer = Buffer.from(event.data as WithImplicitCoercion<ArrayBuffer>);
     *     console.log(buffer)
     * };
     * ```
     *
     * // TODO explain how to keep indefinite connection running
     *
     * @since 1.4.0
     */
    public async getJoinKey(worldId: string): Promise<string> {
        // Get the room type from the server. Since room types
        // is an array. We destructure the first element.
        const [roomType] = await APIClient.roomTypes();

        // Get the join key from the server. This key can be
        // used to connect to the game server.
        const { token } = await this.pocketbase.send<{ token: string }>(`/api/joinkey/${roomType}/${worldId}`, {});

        return token;
    }

    /**
     * Generate a game manager for a specific world id. This
     * will return a {@link GameClient} instance that can be
     * used to communicate to the game room. This method will
     * not connect to the room yet, you must call {@link GameClient.bind}
     * to start the connection. This is a design decision to
     * have time to append even listeners to the game manager
     * before the connection is established.
     * 
     * @example
     * 
     * This example will connect to the room and keep a running
     * connection. If you do not wish to use a game manager you
     * can create a custom socket connection with the join key.
     * 
     * ```typescript
     * const client = APIClient.withToken(process.env.TOKEN!)!;
     * const game = await client.createGame("r450e0e380a815a");
     * game.bind();
     * ```
     */
    public async createGame(worldId: string): Promise<GameClient> {
        const token = await this.getJoinKey(worldId);
        return new GameClient(token);
    }
}
