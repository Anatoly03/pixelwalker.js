import PocketBase, { RecordService } from "pocketbase";

import Config from "./data/config.js";
import RoomTypes from "./data/room-types.js";
import PublicProfile from "./types/public-profile.js";
import PublicWorld from "./types/public-world.js";
import GameClient from "./game.js";

/**
 *
 */
export default class LobbyClient {
    /**
     * The list of available room types. The room types are used when
     * opening a new room on the game server. The room types are currently
     * not used, and currently room type `RoomTypes[0]` can be used.
     */
    public static RoomTypes = RoomTypes;

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
    public static withToken(token: string): LobbyClient | null {
        const client = new LobbyClient();
        client.pocketbase.authStore.save(token, { verified: true });

        if (!client.pocketbase.authStore.isValid) return null;

        return client;
    }

    protected constructor() {
        this.pocketbase = new PocketBase(Config.APIServerLink);
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
        return this.pocketbase.collection("public_profiles") as RecordService<PublicProfile>;
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
        return this.pocketbase.collection("public_worlds") as RecordService<PublicWorld>;
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
     */
    public async getJoinKey(world_id: string, room_type?: (typeof RoomTypes)[0]): Promise<string> {
        if (process.env.LOCALHOST) {
            room_type = room_type ?? "pixelwalker_dev";
        } else {
            room_type = room_type ?? RoomTypes[0];
        }

        const { token } = await this.pocketbase.send(`/api/joinkey/${room_type}/${world_id}`, {});
        return token;
    }

    /**
     * Generate a game session for a specific world id. Optionally override room
     * type. The returned object will return an event emitter than can bind to
     * the game server.
     */
    public async connection(world_id: string, room_type?: (typeof RoomTypes)[0]): Promise<GameClient> {
        const token = await this.getJoinKey(world_id, room_type);
        return new GameClient(token);
    }
}
