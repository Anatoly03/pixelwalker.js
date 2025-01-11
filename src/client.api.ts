import PocketBase, { RecordService } from "pocketbase";

import PublicProfile from "./types/public-profile";
import PublicWorld from "./types/public-world";

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
     * // TODO document
     */
    protected constructor() {
        this.pocketbase = new PocketBase("https://api.pixelwalker.net/");
    }

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
     * @since 1.4.0
     */
    public worlds(): RecordService<PublicWorld> {
        return this.pocketbase.collection("public_worlds");
    }
}
