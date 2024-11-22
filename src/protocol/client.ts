import PocketBase, { RecordService } from "pocketbase";
import Config from "../data/config.js";
import PublicProfile from "../types/public-profile.js";

export default class PixelWalkerClient {
    /**
     * The PixelWalker backend consists of several servers, and the API
     * server uses [PocketBase](https://pocketbase.io/) as its' base.
     */
    public readonly pocketbase: PocketBase;

    /**
     * Create a new Client instance, by logging in with a token. If the
     * token is invalid, it will return null.
     *
     * @param {string} token The object holding the token which is used
     * to sign into pocketbase.
     *
     * @example
     *
     * This is a standard way of creating a new Client instance
     *
     * ```ts
     * import 'dotenv/config'
     * const client = Client.new({ token: process.env.TOKEN as string })
     * const client2 = Client.new(process.env.TOKEN)
     * ```
     */
    public static withToken(token: string): PixelWalkerClient | null {
        const client = new PixelWalkerClient();
        client.pocketbase.authStore.save(token, { verified: true });

        if (!client.pocketbase.authStore.isValid) return null;

        return client;
    }

    protected constructor() {
        this.pocketbase = new PocketBase(`https://${Config.APIServerLink}`);
    }

    /**
     * Returns a Pocketbase [RecordService](https://github.com/pocketbase/js-sdk/blob/master/src/services/RecordService.ts).
     * See usage at the [PocketBase](https://pocketbase.io/) website for [searching records](https://pocketbase.io/docs/api-records#listsearch-records).
     * This method returns a collection handler that allows you to search through all public profiles.
     *
     * @example
     *
     * ```json
     * // https://api.pixelwalker.net/api/collections/public_profiles/records?perPage=1&page=1
     * // yields the following object
     * {
     *   ...
     *   "items": [{
     *     "admin": true,
     *     "banned": false,
     *     "collectionId": "0wl44rzm22wuf2q",
     *     "collectionName": "public_profiles",
     *     "created": "2024-01-16 07:51:33.724Z",
     *     "face": 6,
     *     "id": "129zur8t6e88m4b",
     *     "username": "PRIDDLE"
     *   }]
     * }
     * ```
     */
    public profiles() {
        return this.pocketbase.collection(
            "public_profiles"
        ) as RecordService<PublicProfile>;
    }
}
