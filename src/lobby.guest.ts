import PocketBase, { RecordService } from "pocketbase";

import Config from "./data/config.js";
import RoomTypes from "./data/room-types.js";

import OnlineWorlds from "./types/online-worlds.js";
import PublicWorld from "./types/public-world.js";
import PublicProfile from "./types/public-profile.js";

/**
 * The LobbyClient connects with the
 * {@link https://api.pixelwalker.net/ PixelWalker API Server}
 * and provides an interface with the {@link https://pocketbase.io/ PocketBase}
 * instance. (The backend framework which PixelWalker uses.)
 */
export default class LobbyGuestClient {
    /**
     * The PixelWalker backend consists of several servers, and the API
     * server uses {@link https://pocketbase.io/ Pocketbase} as its'
     * backend framework.
     */
    public readonly pocketbase!: PocketBase;

    /**
     * Constructor for a guest client. You don't need to be authorized
     * to use this instance methods.
     */
    protected constructor() {
        this.pocketbase = new PocketBase(Config.APIServerLink) as any;
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
    public profiles(): RecordService<PublicProfile> {
        return this.pocketbase.collection("public_profiles");
    }

    /**
     * Returns a Pocketbase [RecordService](https://github.com/pocketbase/js-sdk/blob/master/src/services/RecordService.ts).
     * See usage at the [PocketBase](https://pocketbase.io/) website for [searching records](https://pocketbase.io/docs/api-records#listsearch-records).
     * This method returns a collection handler that allows you to search through all public worlds.
     *
     * @note
     *
     * If you want to get a full list of worlds that you own and are not set to
     * public, refer to the {@link LobbyClient.my_worlds} method.
     *
     * @example
     *
     * ```json
     * // Test it out: https://api.pixelwalker.net/api/collections/public_worlds/records?perPage=500&page=1
     *
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
     * If you want to get only **public** worlds that you yourself own, you can
     * use the `owner='selfId'` filter (with selfId being your own connect user id).
     *
     * ```ts
     * LobbyClient.withToken(process.env.token);
     *   .worlds()
     *   .getFullList({ filter: `owner='${client.selfId}'` })
     *   .then(console.log)
     * ```
     */
    public worlds(): RecordService<PublicWorld> {
        return this.pocketbase.collection("public_worlds");
    }

    /**
     * Returns an array of all online, visible worlds.
     *
     * @example
     *
     * ```ts
     * // Example response:
     *
     * {
     *   "visibleRooms": [
     *     {
     *       "id": "mknckr7oqxq24xa",
     *       "players": 1,
     *       "max_players": 50,
     *       "data": {
     *         "title": "[Realms] Lobby",
     *         "description": "Visit https://realms.martenm.nl to browse worlds.",
     *         "plays": 1119,
     *         "minimapEnabled": true,
     *         "type": 0
     *       }
     *     }
     *   ],
     *   "onlineRoomCount": 5,
     *   "onlinePlayerCount": 10
     * }
     * ```
     *
     * The `data` segment contains the `type` field, which is one of the following:
     *
     * - `0`: Saved World (Worlds that players own, e.g. Public Worlds)
     * - `1`: Unsaved World (Non-persistant Worlds, e.g. Martens' Realms)
     * - `2`: Legacy World (Worlds from the EE archive)
     * 
     * @throws {Error} If the server is unavailable or wi-fi is down.
     * 
     * @since 1.3.6
     */
    public async onlineWorlds(roomType?: (typeof RoomTypes)[0]): Promise<OnlineWorlds> {
        roomType = roomType ?? (process?.env.LOCALHOST ? "pixelwalker_dev" : RoomTypes[0]);

        const response = await fetch(`${Config.GameServerLink}/room/list/${roomType}`);
        if (!response.ok) throw new Error("Failed to fetch online worlds.");

        return response.json();
    }
}
