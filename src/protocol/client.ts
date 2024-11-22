import PocketBase, { RecordService } from "pocketbase";
import Config from "../data/config.js";
import PublicProfile from "../types/public-profile.js";
import PublicWorld from "../types/public-world.js";

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
     * // Test it out: https://api.pixelwalker.net/api/collections/public_profiles/records?perPage=500&page=1
     * 
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
     */
    public profiles() {
        return this.pocketbase.collection(
            "public_profiles"
        ) as RecordService<PublicProfile>;
    }

    /**
     * Returns a Pocketbase [RecordService](https://github.com/pocketbase/js-sdk/blob/master/src/services/RecordService.ts).
     * See usage at the [PocketBase](https://pocketbase.io/) website for [searching records](https://pocketbase.io/docs/api-records#listsearch-records).
     * This method returns a collection handler that allows you to search through all public worlds.
     *
     * @example
     *
     * ```
     * // Test it out: https://api.pixelwalker.net/api/collections/public_worlds/records?perPage=500&page=1
     * 
     * {
     *   "collectionId": "rhrbt6wqhc4s0cp",
     *   "collectionName": "public_worlds",
     *   "description": "This is a 200x200 world",
     *   "height": 200,
     *   "id": "djtqrcjn4fzyhi8",
     *   "minimap": "djtqrcjn4fzyhi8_dsTobiFBDM.png",
     *   "owner": "5cy5r7za1r3splc",
     *   "plays": 243,
     *   "title": "200x200 World",
     *   "width": 200
     * }
     * ```
     */
    public worlds() {
        return this.pocketbase.collection(
            'public_worlds'
        ) as RecordService<PublicWorld>;
    }
}
