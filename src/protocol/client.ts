import EventEmitter from 'events';
import WebSocket from 'ws';
import PocketBase, { RecordService } from 'pocketbase';

import Connection from './connection.js';
import RoomTypes from '../data/room-types.js';

import { PublicProfile } from '../types/public-profile.js';
import { PublicWorld } from '../types/public-world.js';

import { APIServerLink, GameServerLink } from '../data/config.js';
import PlayerManager from '../players/manager.js';
import BufferReader from '../util/buffer-reader.js';
import Player from '../players/player.js';

export type PixelwalkerClientEvents = {
    Init: [];
    PlayerWin: [Player];
    PlayerCrown: [Player, Player | undefined];
    Error: [Error];
};

export default class PixelWalkerClient extends EventEmitter<PixelwalkerClientEvents> {
    /**
     * The connection instance. It handles communication
     * with the server.
     */
    public readonly connection = new Connection(this);

    /**
     * PocketBase API
     */
    public readonly pocketbase: PocketBase = new PocketBase(
        `https://${APIServerLink}`
    );

    /**
     * Players connected in the world.
     */
    public readonly players = new PlayerManager(this);

    /**
     * Create a new Client instance, by logging in with a token.
     *
     * @param {string} token The object holding the token which is used to sign into pocketbase.
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
    public static withToken(token: string): PixelWalkerClient {
        const client = new PixelWalkerClient();
        client.pocketbase.authStore.save(token, { verified: true });

        console.log([token]);

        if (!client.pocketbase.authStore.isValid)
            throw new Error('Invalid Token');

        return client;
    }

    /**
     * Create a new Client instance, by logging in with a username and a password.
     *
     * @param {string} username The username of the player you are trying to connect with.
     * @param {string} password The password that belongs to this player.
     *
     * @example
     *
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
     *
     * @param {NodeJS.ProcessEnv} args The constant `process.env`
     *
     * @example
     *
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

    /**
     * The implementation of the new method.
     */
    public static async new(data: any): Promise<PixelWalkerClient> {
        if (data.token) return this.withToken(data.token);

        if (data.username && data.password)
            return this.withAuth(data.username, data.password);

        throw new Error(
            'Invalid login options. Expected { token } or { username, password }, got a different object.'
        );
    }

    /**
     * The PixelWalker Client constructor. This method
     * should not be accessible to allow static async
     * constructors. It is marked as deprecated because
     * it's not supposed to be directly called.
     */
    protected constructor() {
        super();
        this.registerEvents();
    }

    /**
     *
     */
    private registerEvents() {
        /**
         * @event
         *
         * Report unhandled promises. This will log all unhandled
         * promise rejections to the event emitter.
         */
        process.on('unhandledRejection', (error) => {
            if (!(error instanceof Error))
                return this.emit(
                    'Error',
                    new Error('Unhandled Rejection: No Error provided')
                );
            this.emit('Error', error);
        });

        /**
         * @event
         *
         * Interupt signal. Disconnect the websocket on interupt
         * signal. This is mainly used to signal instant closing
         * of the socket tunnel, so the player instances don't
         * flood the world.
         */
        process.on('SIGINT', (signals) => {
            this.disconnect();
        });
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
     * Implement a module functionality with a callback. This method
     * is called with `this` as parameter and can extend the client.
     *
     * @example
     *
     * ```ts
     * import PixelWalkerClient from 'pixelwalker.js`;
     *
     * function (client: PixelWalkerClient) {
     *   client.on('PlayerInit', () => console.log('Connected'));
     *   return client & { ext: 'This variable is extended!' };
     * }
     *
     * const client = PixelWalkerClient.fromToken('bla bla');
     * client.include(extension);
     * console.log(client.ext); // 'This variable is extended!'
     * ```
     */
    public include<T>(
        callback: (c: PixelWalkerClient) => PixelWalkerClient & T
    ): PixelWalkerClient & T;

    /**
     * Include a module from an object. Per default its' set to find
     * the method `module` which is called with `this` as parameter
     * and can be extended.
     *
     * @example
     *
     * ```ts
     * import PixelWalkerClient from 'pixelwalker.js`;
     *
     * class CustomModule {
     *   module(client: PixelWalkerClient) {
     *     client.on('PlayerInit', () => console.log('Connected'));
     *     return client & { ext: 'This variable is extended!' };
     *   }
     * }
     *
     * const client = PixelWalkerClient.fromToken('bla bla');
     * client.include(new CustomModule());
     * console.log(client.ext); // 'This variable is extended!'
     * ```
     */
    public include<T>(module: {
        module: (c: PixelWalkerClient) => PixelWalkerClient & T;
    }): PixelWalkerClient & T;

    /**
     *  The implementation of the include method.
     */
    public include<T>(
        callback:
            | ((c: PixelWalkerClient) => PixelWalkerClient & T)
            | { module: (c: PixelWalkerClient) => PixelWalkerClient & T }
    ): PixelWalkerClient & T {
        if (typeof callback == 'function') return callback(this);
        else return callback.module(this);
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

    /**
     * Given a `joinkey`, spawn a websocket. This can be overriden
     * to redirect the client to another game server, such as the
     * localhost.
     */
    protected initSocket(joinkey: string) {
        return new WebSocket(`wss://${GameServerLink}/room/${joinkey}`);
    }

    /**
     *
     */
    public async connect(
        world_id: string,
        room_type?: (typeof RoomTypes)[0]
    ): Promise<true>;

    /**
     *
     */
    public async connect(args: NodeJS.ProcessEnv): Promise<true>;

    /**
     *
     */
    public async connect(args: {
        world_id: string;
        room_type?: (typeof RoomTypes)[0];
    }): Promise<true>;

    /**
     * The implementation of the connect method.
     */
    public async connect(
        arg0:
            | {
                  world_id: string;
                  room_type?: (typeof RoomTypes)[0];
              }
            | NodeJS.ProcessEnv
            | string,
        room_type: (typeof RoomTypes)[0] = RoomTypes[0]
    ) {
        if (typeof arg0 === 'string')
            return this.connect({ world_id: arg0, room_type });

        if (!arg0.world_id)
            throw new Error('The argument `world_id` was not provided.');

        arg0.room_type ||= RoomTypes[0];

        const joinkey = await this.getJoinKey(arg0.world_id, arg0.room_type);
        const socket = await this.initSocket(joinkey);

        this.connection.init(socket);

        return true;
    }

    /**
     * Disconnect the client connection.
     */
    public disconnect() {
        this.connection.disconnect();
    }

    /**
     * Returns the event listener for unprocessed events. This
     * listener is not guaraneteed to be compatible with future
     * api versions of the game or renewed prortocols, however
     * is customly adjustable before this SDK is ready to update,
     * which makes it good for experiencing with the api.
     *
     * To listen to all events, the asterisk `*` can be used. The
     * arguments it will receive then will be `EventName, ...Args`
     *
     * ```ts
     * client.raw()
     *     .on('PlayerInit', callback1)
     *     .on('PlayerMoved', callback2)
     *     // ...
     * ```
     */
    public raw() {
        return this.connection.receive();
    }

    /**
     * Send a raw message to the server. Read more about the
     * static properties in [BufferReader](../math/buffer-reader.ts),
     * which automatically create the correct types for you.
     *
     * @example
     *
     * ```ts
     * import { BufferReader, Connection } from 'pixelwalker.js'
     * const { Magic } = BufferReader;
     *
     * client.connection.on('*PlayerInit', () => {
     *     // Maintain a stable connection with the server: Accept the handshake and initialise.
     *     client.send(Magic(MagicByte.Message), Magic(Connection.MessageId('PlayerInit')));
     * })
     * ```
     */
    public send(
        event: (typeof Connection.MessageTypes)[number],
        ...buffer: Buffer[]
    ) {
        if (!this.connection.connected()) return false;
        this.connection.send(
            Connection.MagicByte.Message,
            BufferReader.Bit7(Connection.MessageId(event)),
            ...buffer
        );
    }

    /**
     * Accept an incoming initialization handshake. If this is
     * sent twice per instance, the connection will close.
     *
     * @alias
     *
     * ```ts
     * client.send('PlayerInit');
     * ```
     */
    public init() {
        this.send('PlayerInit');
    }
}
