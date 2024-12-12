import PocketBase, { BaseAuthStore, RecordModel, RecordService } from "pocketbase";
import { jwtDecode } from "jwt-decode";

import RoomTypes from "./data/room-types.js";
import GameClient from "./game.js";

import LobbyGuestClient from "./lobby.guest.js";
import PrivateWorld from "./types/private-world.js";
import Friend, { FriendRequest } from "./types/friends.js";
import JoinData from "./types/join-data.js";

/**
 * The LobbyClient connects with the
 * {@link https://api.pixelwalker.net/ PixelWalker API Server}
 * and provides an interface with the {@link https://pocketbase.io/ PocketBase}
 * instance. (The backend framework which PixelWalker uses.)
 */
export default class LobbyClient extends LobbyGuestClient {
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
    public override readonly pocketbase!: PocketBase & {
        authStore: BaseAuthStore & { isValid: true };
    };

    /**
     * Returns whether the client is authorized (i.e. logged in).
     */
    private get isAuthorized(): true {
        return this.pocketbase.authStore.isValid;
    }

    /**
     * Returns the client's own connect user id. This is only available
     * if the client is authorized and will be undefined otherwise.
     */
    public get cuid(): string {
        if (!this.isAuthorized)
            throw new Error('`LobbyClient.cuid` was asked before ');

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
     * to sign into pocketbase. You can get the token by logging in, in
     * a browser of your choice and heading over to the developer tools
     * on {@link https://pixelwalker.net}, then retrieving the cookies
     * for `pocketbase_auth`, and getting the token.
     *
     * @example
     *
     * This is a standard way of creating a new Client instance
     *
     * ```ts
     * import 'dotenv/config';
     * const client = LobbyClient.withToken('eyj.......');
     * ```
     *
     * @static
     */
    public static withToken(token: string) {
        const client = new this();
        client.pocketbase.authStore.save(token, { verified: true });
        if (!client.pocketbase.authStore.isValid) return null;
        return client;
    }

    /**
     * Create a new Client instance, by logging in with a username (or email) and
     * password. If invalid, returns a promise resolving. null.
     *
     * @param {string} username Username or email of the account you are trying to
     * login with. Do not hardcode them in the application/ store in git but instead
     * save them in a environment config file.
     *
     * @param {string} password Password of the account you are trying to login with.
     * Do not hardcode them in the application/ store in git but instead save them in
     * a environment config file.
     *
     * @example
     *
     * ```ts
     * import 'dotenv/config';
     * const client = LobbyClient.withUsernamePassword('ANATOLY', 'secret');
     * ```
     *
     * @static
     */
    public static async withUsernamePassword(username: string, password: string) {
        const client = new this();
        try {
            const auth = await client.pocketbase.collection("users").authWithPassword(username, password);
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
    public static guest(): LobbyGuestClient {
        return new LobbyGuestClient();
    }

    /**
     * @ignore The constructor is hidden from public gaze. Use static
     * methods.
     */
    private constructor() {
        super();
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
    public my_worlds(): RecordService<PrivateWorld> {
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
    public async user(): Promise<RecordModel> {
        return this.pocketbase.collection("users").getOne(this.cuid);
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
    public friends(): Promise<Friend[]> {
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
    public async friend_requests(): Promise<FriendRequest[]> {
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
    public async getJoinKey(world_id: string, roomType?: (typeof RoomTypes)[0]): Promise<string> {
        roomType = roomType ?? (process?.env.LOCALHOST ? "pixelwalker_dev" : RoomTypes[0]);
        const { token } = await this.pocketbase.send(`/api/joinkey/${roomType}/${world_id}`, {});
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
    public async connection(world_id: string, roomType?: (typeof RoomTypes)[0]): Promise<GameClient> {
        const token = await this.getJoinKey(world_id, roomType);
        return GameClient.withJoinKey(token);
    }

    /**
     * Create a new world on the game server. This method requires a title,
     *
     * The join data is a collection of all the possible messages that can be
     * sent to create or join a world.
     *
     * Width and Height are restricted to values between 25 and 400 and it has
     * to be in multiples of 25, with the exception of `636` assigned to width.
     *
     * @since 1.3.3
     */
    public async createUnsavedWorld(joinData: JoinData, roomType?: (typeof RoomTypes)[0]): Promise<GameClient> {
        const generatedId = "pw-js-" + Math.random().toString(36).substring(2, 9);
        const token = await this.getJoinKey(generatedId);
        return GameClient.withJoinKey(token, joinData);
    }
}
