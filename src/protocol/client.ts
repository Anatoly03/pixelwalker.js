import PocketBase, { RecordService } from 'pocketbase';

// import Connection from './connection.js';
import RoomTypes from '../data/room-types.js';

import { PublicProfile } from '../types/public-profile.js';
import { PublicWorld } from '../types/public-world.js';

export const APIServerLink = 'api.pixelwalker.net';
export const GameServerLink = 'game.pixelwalker.net';

export default class PixelWalkerClient {
    /**
     * The connection instance. It handles communication
     * with the server.
     */
    // protected connection = new Connection(this);

    /**
     * PocketBase API
     */
    public pocketbase: PocketBase = new PocketBase(`https://${APIServerLink}`);

    /**
     * Create a new Client instance, by logging in with a token.
     * @param {{token:string}} args The object holding the token which is used to sign into pocketbase.
     * @example
     * This is a standart way of creating a new Client instance
     * ```ts
     * import 'dotenv/config'
     * const client = Client.new({ token: process.env.TOKEN as string })
     * const client2 = Client.new(process.env.TOKEN)
     * ```
     */
    public static withToken(token: string): PixelWalkerClient {
        const client = new PixelWalkerClient();
        client.pocketbase.authStore.save(token, { verified: true });

        if (!client.pocketbase.authStore.isValid)
            throw new Error('Invalid Token');

        return client;
    }

    /**
     * Create a new Client instance, by logging in with a username and a password.
     * @param {{user:string, pass:string}} args The object holding the username and password which are used to sign into pocketbase.
     * @example
     * ```ts
     * import 'dotenv/config'
     * const client = Client.auth('user@example.com', 'PixieWalkie');
     * const client2 = Client.new({ user: 'user@example.com', pass: 'PixieWalkie' });
     * ```
     */
    public static async withAuth(
        username: string,
        password: string
    ): Promise<PixelWalkerClient> {
        const client = new PixelWalkerClient();
        await client.pocketbase
            .collection('users')
            .authWithPassword(username, password);
        return client;
    }

    /**
     * Create a new Client instance, by logging in with data defined in the
     * @param {NodeJS.ProcessEnv} args The constant `process.env`
     * @example
     * This is a standart way of creating a new Client instance
     * ```ts
     * import 'dotenv/config'
     * const client = Client.new(process.env)
     * ```
     */
    public static async new(
        data: NodeJS.ProcessEnv
    ): Promise<PixelWalkerClient>;

    /**
     * Create a new Client instance, by logging in with a token.
     * @param {{token:string}} args The object holding the token which is used to sign into pocketbase.
     * @example
     * This is a standart way of creating a new Client instance
     * ```ts
     * import 'dotenv/config'
     * const client = Client.new({ token: process.env.TOKEN as string })
     * const client2 = Client.new(process.env.TOKEN)
     * ```
     */
    public static async new(data: {
        token: string;
    }): Promise<PixelWalkerClient>;

    /**
     * Create a new Client instance, by logging in with a username and a password.
     * @param {{user:string, pass:string}} args The object holding the username and password which are used to sign into pocketbase.
     * @example
     * ```ts
     * import 'dotenv/config'
     * const client = Client.auth('user@example.com', 'PixieWalkie');
     * const client2 = Client.new({ user: 'user@example.com', pass: 'PixieWalkie' });
     * ```
     */
    public static async new(data: {
        username: string;
        password: string;
    }): Promise<PixelWalkerClient>;

    public static async new(data: any): Promise<PixelWalkerClient> {
        if (data.token) return this.withToken(data.token);

        if (data.username && data.password)
            return this.withAuth(data.username, data.password);

        throw new Error(
            'Invalid login options. Expected { token } or { username, password }, got a different object.'
        );
    }

    /**
     * Returns a Pocketbase [RecordService](https://github.com/pocketbase/js-sdk/blob/master/src/services/RecordService.ts).
     * See usage at the [PocketBase](https://pocketbase.io/) website for [searching records](https://pocketbase.io/docs/api-records#listsearch-records).
     * This method returns a collection handler that allows you to search through all public profiles.
     *
     * @example
     *
     * ```
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
     *
     * @example
     *
     * `https://api.pixelwalker.net/api/collections/public_profiles/records?perPage=500&page=1`
     */
    public profiles() {
        return this.pocketbase.collection(
            'public_profiles'
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
     * @example
     *
     * `https://api.pixelwalker.net/api/collections/public_worlds/records?page=0&perPage=500`
     */
    public worlds() {
        return this.pocketbase.collection(
            'public_worlds'
        ) as RecordService<PublicWorld>;
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
     * const joinkey = await client.getJoinKey('4naaehf4xxexavv);
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
    public async getJoinKey(
        world_id: string,
        room_type: (typeof RoomTypes)[0] = RoomTypes[0]
    ) {
        const { token } = await this.pocketbase.send(
            `/api/joinkey/${room_type}/${world_id}`,
            {}
        );
        return token as string;
    }
}
