import PocketBase, { BaseAuthStore, RecordModel, RecordService } from "pocketbase";
import { jwtDecode } from "jwt-decode";

import Config from "./data/config.js";
import RoomTypes from "./data/room-types.js";
import GameClient from "./game.js";

import PublicProfile from "./types/public-profile.js";
import PrivateWorld from "./types/private-world.js";
import PublicWorld from "./types/public-world.js";
import Friend, { FriendRequest } from "./types/friends.js";

/**
 * The LobbyClient connects with the
 * {@link https://api.pixelwalker.net/ PixelWalker API Server}
 * and provides an interface with the {@link https://pocketbase.io/ PocketBase}
 * instance. (The backend framework which PixelWalker uses.)
 */
export default class LobbyClient<Auth extends boolean = false> {
    /**
     * The list of available room types. The room types are used when
     * opening a new room on the game server. The room types are currently
     * not used, and currently room type `RoomTypes[0]` can be used.
     *
     * @static
     *
     * @ignore Since there is only one room type, this symbol is ignored,
     * but kept public to allow future extensions.
     */
    public static RoomTypes = RoomTypes;

    /**
     * The PixelWalker backend consists of several servers, and the API
     * server uses {@link https://pocketbase.io/ Pocketbase} as its'
     * backend framework.
     */
    public readonly pocketbase!: PocketBase & {
        authStore: BaseAuthStore & { isValid: Auth };
    };

    /**
     * Returns whether the client is authorized (i.e. logged in).
     */
    public get isAuthorized(): Auth {
        return this.pocketbase.authStore.isValid;
    }

    /**
     * Returns the client's own id. This is only available if the client
     * is authorized and will be undefined otherwise.
     */
    public get selfId(): Auth extends true ? string : undefined {
        if (!this.isAuthorized) return undefined as any;
        return jwtDecode<{
            collectionId: "_pb_users_auth_";
            exp: number;
            id: string;
            type: "authRecord";
        }>(this.pocketbase.authStore.token).id as any;
    }

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
     * const client = Client.new('eyj.......')
     * ```
     *
     * @static
     */
    public static withToken(token: string) {
        const client = new this<true>();
        client.pocketbase.authStore.save(token, { verified: true });
        if (!client.pocketbase.authStore.isValid) return null;
        return client;
    }

    /**
     * Create a new Client instance, by logging in with a username (or email) and
     * password. If invalid, returns a promise resolving. null.
     */
    public static async withUsernamePassword(username: string, password: string) {
        const client = new this<true>();
        try {
            const auth = await client.pocketbase.collection('users').authWithPassword(username, password);
            if (!auth) return null;
            return client;
        } catch (_) {
            return null;
        }
    }

    /**
     * Create a new Client instance, by logging in as a guest. This
     * method does not require any arguments and will return a new
     * instance able to have minimal interactions with the API server.
     *
     * @note You can still access public information, but won't be able
     * to establish a game connection, access private information and
     * you will be affected by stricter rate limits.
     *
     * @static
     */
    public static guest(): LobbyClient<false> {
        return new this();
    }

    /**
     * @todo
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
     * Returns a Pocketbase [RecordService](https://github.com/pocketbase/js-sdk/blob/master/src/services/RecordService.ts).
     * See usage at the [PocketBase](https://pocketbase.io/) website for [searching records](https://pocketbase.io/docs/api-records#listsearch-records).
     * This method returns a collection handler that allows you to search through
     * all worlds owned by you.
     * 
     * @example
     * 
     * ```ts
     * LobbyClient.withToken(process.env.token).
     *   .my_worlds()
     *   .getFullList()
     *   .then(console.log)
     * ```
     * 
     * @note To use this function you have to be logged in. (Login with
     * an authorized constructor, i.e. not {@link LobbyClient.guest})
     */
    public my_worlds(this: LobbyClient<true>): RecordService<PrivateWorld> {
        return this.pocketbase.collection("worlds");
    }

    /**
     * @note To use this function you have to be logged in. (Login with
     * an authorized constructor, i.e. not {@link LobbyClient.guest})
     * 
     * @example
     * 
     * ```json
     * // To test it, you will need to fetch the resource with your auth token.
     * // When you have the token, you can use the link below to find the
     * // resource linked to you.
     * // 
     * // https://api.pixelwalker.net/api/collections/users/records?perPage=500&page=1
     * 
     * {
     *   "admin": false,
     *   "banned": false,
     *   "collectionId": "_pb_users_auth_",
     *   "collectionName": "users",
     *   "created": "...",
     *   "email": "...",
     *   "emailVisibility": false,
     *   "face": 0,
     *   "friends": [ "..." ],
     *   "id": "5cy5r7za1r3splc",
     *   "isSuspicious": false,
     *   "lastSeen": "2024-11-28 19:44:17.000Z",
     *   "lastWorld": "r450e0e380a815a",
     *   "lastWorldTitle": "Statsu 418",
     *   "updated": "...",
     *   "username": "ANATOLY",
     *   "verified": true
     * }
     * ```
     *
     * @this LobbyClient<true>
     */
    public async user(this: LobbyClient<true>): Promise<RecordModel> {
        return this.pocketbase.collection("users").getOne(this.selfId);
    }

    /**
     * @note To use this function you have to be logged in. (Login with
     * an authorized constructor, i.e. not {@link LobbyClient.guest})
     * 
     * @example
     * 
     * ```json
     * // To test it, you will need to fetch the resource with your auth token.
     * // When you have the token, you can use the link below to find the
     * // resource linked to you.
     * // 
     * // https://api.pixelwalker.net/api/friends
     * 
     * {
     *   "id": "5cy5r7za1r3splc",
     *   "username": "ANATOLY",
     *   "face": 0,
     *   "lastSeen": "2024-11-28 19:44:17.000Z",
     *   "lastWorld": "r450e0e380a815a",
     *   "lastWorldTitle": "Statsu"
     * }
     * ```
     *
     * @this LobbyClient<true>
     */
    public friends(this: LobbyClient<true>): Promise<Friend[]> {
        return this.pocketbase.send("/api/friends", { token: this.pocketbase.authStore.token });
    }

    /**
     * @note To use this function you have to be logged in. (Login with
     * an authorized constructor, i.e. not {@link LobbyClient.guest})
     * 
     * @example
     * 
     * ```json
     * // To test it, you will need to fetch the resource with your auth token.
     * // When you have the token, you can use the link below to find the
     * // resource linked to you.
     * // 
     * // https://api.pixelwalker.net/api/friends
     * 
     * {
     *   "id": "...", // The id of the friend request entry in the database
     *   "sender": "5cy5r7za1r3splc",
     *   "receiver": "...",
     *   "senderUsername": "ANATOLY",
     *   "receiverUsername": "..."
     * }
     * ```
     *
     * @this LobbyClient<true>
     */
    public async friend_requests(this: LobbyClient<true>): Promise<FriendRequest[]> {
        return this.pocketbase.send("/api/friends/requests", { token: this.pocketbase.authStore.token });
    }

    /**
     * Generate a join key for a specific world id. Optionally overwrite room type.
     * This key can then be used to connect to a websocket on the game server.
     *
     * @example
     *
     * In this example you can set up a custom socket connection with the server.
     * After logging in with [PocketBase](https://pocketbase.io/), you retrieve
     * the join key, which then can be used at the game server at endpoint
     * `/room/:joinkey` to establish a websocket connection. The code below
     * demonstrates a simple client responding to pings and logging all other
     * received packages. Note, that since you don't send the `PlayerInit = 0`
     * message here, you will be disconnected in some seconds after connecting.
     *
     * ```ts
     * export const client = LobbyClient.withToken(process.env.token);
     * const joinkey = await client.getJoinKey('4naaehf4xxexavv');
     * const socket = new WebSocket(`wss://game.pixelwalker.net/room/${joinkey}`);
     * socket.binaryType = 'arraybuffer';
     *
     * socket.on('message', (buffer) => {
     *     buffer = Buffer.from(message as WithImplicitCoercion<ArrayBuffer>);
     *     if (buffer.length == 0) return;
     *     if (buffer[0] == 0x3F) return socket.send(Buffer.from([0x3F]), {});
     *     console.log(buffer.subarray(1));
     * })
     * ```
     *
     * To keep an indefinite connection running, you will have to accept the `PlayerInit`
     * handshake. This does not require any further arguments, however needs to be
     * placed after the magic byte `Message = 0x6B`. Read about the byte-level protocol
     * in the [Connection](./connection.ts) class.
     *
     * @note To use this function you have to be logged in. (Login with
     * an authorized constructor, i.e. not {@link LobbyClient.guest})
     *
     * @this LobbyClient<true>
     */
    public async getJoinKey(this: LobbyClient<true>, world_id: string, room_type?: (typeof RoomTypes)[0]): Promise<string> {
        room_type = room_type ?? (process.env.LOCALHOST ? "pixelwalker_dev" : RoomTypes[0]);
        const { token } = await this.pocketbase.send(`/api/joinkey/${room_type}/${world_id}`, {});
        return token;
    }

    /**
     * Generate a game session for a specific world id. Optionally override room
     * type. The returned object will return an event emitter than can bind to
     * the game server.
     *
     * @note To use this function you have to be logged in. (Login with
     * an authorized constructor, i.e. not {@link LobbyClient.guest})
     *
     * @this LobbyClient<true>
     */
    public async connection(this: LobbyClient<true>, world_id: string, room_type?: (typeof RoomTypes)[0]): Promise<GameClient> {
        const token = await this.getJoinKey(world_id, room_type);
        return new GameClient(token);
    }
}
