import EventEmitter from 'events';
import WebSocket from 'ws';

import Client from './client.js';
import BufferReader from '../math/buffer-reader.js';
import MessageTypes from '../data/message-types.js';

/**
 * All events related to the state of the socket, such as
 * socket opening or closing.
 */
type SocketStateEvents = {
    Send: [...Buffer[]];
    SendMessage: [...Buffer[]];
    ReceiveMessage: [BufferReader];
    ReceivePing: [];
    Error: [Error];
    Close: [number, string];
    Disconnect: [];
    PromiseRejection: [Error];
    Debug: [string];
};

/**
 *
 */
type MessageEvents = { [K in `*${(typeof MessageTypes)[number]}`]: any[] };

/**
 *
 */
export enum MagicByte {
    Ping = 0x3f,
    Message = 0x6b,
}

/**
 * The Connection class handles the lowest level of communication
 * between the client and the server. It contains the socket and
 * processes byte-level communication.
 *
 * The Connection class handles the ping handshake with the server,
 * which is sending a ping byte response to every ping byte request
 * from the server.
 *
 * This class does not handle higher-layer events, for that see
 * [ClientEvents](events.ts)
 */
export default class Connection<
    Ready extends boolean = false
> extends EventEmitter<SocketStateEvents & MessageEvents> {
    /**
     * Get an array of message typed sequenced integer → message name. Note,
     * that the array below is not full,
     *
     * @example
     *
     * ```ts
     * import { Connection } from 'pixelwalker.js'
     * console.log(Connection.MessageTypes); // ["PlayerInit", "UpdateRights", ...]
     * ```
     */
    static MessageTypes: typeof MessageTypes = MessageTypes;

    /**
     * Get the id for the message. This can then be used with `Magic` to send the proper event header.
     * 
     * @example
     * 
     * ```ts
     * import Client from 'pixelwalker.js'
     * client.send(Client.MessageId('PlayerInit'));
     * ```
     */
    static MessageId<Index extends number, MessageType extends (typeof MessageTypes)[Index]>(messageName: MessageType): Index {
        return this.MessageTypes.findIndex(m => m === messageName)! as Index;
    }

    /**
     * The magic bytes used to start a packet. The two
     * important magic bytes are for pings and messages.
     */
    static MagicByte: typeof MagicByte = MagicByte;

    /**
     * Socket that connects with the game
     */
    #socket!: Ready extends true ? WebSocket : never;

    /**
     *
     */
    #client: Client;

    /**
     *
     */
    private registerEvents() {
        /**
         * Report unhandled promises. This will log all unhandled
         * promise rejections to the event emitter.
         */
        process.on('unhandledRejection', (error) => {
            if (!(error instanceof Error))
                throw new Error(
                    'Receive unexpected type while logging unhandled rejections: ' +
                        error
                );
            this.emit('PromiseRejection', error);
        });

        /**
         * Receive a binary buffer from server.
         */
        this.#socket.on('message', (message) => {
            const buffer = BufferReader.from(
                message as WithImplicitCoercion<ArrayBuffer>
            );

            if (buffer.length == 0) return;

            switch (buffer.readUInt8()) {
                case MagicByte.Message:
                    this.emit('ReceiveMessage', buffer.subarray());
                    break;
                case MagicByte.Ping:
                    this.emit('ReceivePing');
                    break;
                default:
                    return this.emit(
                        'Error',
                        new Error(
                            `Received unidentified magic byte from server: 0x${buffer
                                .at(0)
                                .toString(16)}`
                        )
                    );
            }
        });

        /**
         * Check on connection error.
         */
        this.#socket.on('error', (error) => {
            try {
                this.emit('Error', error);
                this.disconnect();
            } catch (e) {
                this.emit(
                    'Error',
                    new Error(
                        'An unexpected error occured while closing the websocket.'
                    )
                );
            }
        });

        /**
         * Got an unexpected response from the server.
         */
        this.#socket.on('unexpected-response', (request, message) => {
            this.emit(
                'Error',
                new Error(
                    `Received an unexpected response.\nRequest ${request.method} "${request.host}/${request.path}" was received by response:\n(${message.statusCode}) ${message.statusMessage}`
                )
            );
            this.disconnect();
        });

        /**
         * On socket opened.
         */
        this.#socket.on('open', () => {
            this.emit('Debug', `Socket opened!`);
        });

        /**
         * On socket is closed.
         */
        this.#socket.on('close', (code, reason) => {
            this.emit('Close', code, reason.toString('ascii'));
            this.disconnect();
        });

        /**
         * Receive and process incoming message.
         */
        this.on('ReceiveMessage', (buffer) => {
            const event_id = buffer.read7BitInt();
            const event_name = MessageTypes[
                event_id
            ] as (typeof MessageTypes)[number];
            const data = buffer.deserialize();

            if (!event_name)
                return this.emit(
                    'Error',
                    new Error(
                        `Received unidentified protocol header 0x${event_id.toString(
                            16
                        )}. API may be out of date. Deserialised Data: ${data}`
                    )
                );

            // console.log(event_name, data);

            this.emit(`*${event_name}`, ...data);

            // this.#client.raw.emit('*', [event_name, ...data]);
            // this.#client.raw.emit(event_name, data as any);
            // this.emit('ReceiveFormatted', event_name, ...data);
        });

        /**
         * Receive and process incoming pings.
         */
        this.on('ReceivePing', () => {
            this.emit('Send', BufferReader.Magic(MagicByte.Ping));
        });

        /**
         * Send a binary buffer to the server.
         */
        this.on('Send', (...buffer) => {
            const rawBuffer = Buffer.concat(buffer);
            this.#socket.send(rawBuffer, {}, (error) =>
                this.emit(
                    'Error',
                    error ??
                        new Error(
                            `While trying to send ${buffer} an unknown error occured.`
                        )
                )
            );
            if (rawBuffer.length > 0 && rawBuffer[0] === MagicByte.Message)
                this.emit('SendMessage', rawBuffer);
        });
    }

    /**
     * @ignore
     */
    constructor(client: Client, debug = false) {
        super();
        this.#client = client;
    }

    /**
     * Is the current connection connected?
     */
    public connected(): this is Connection<true> {
        return this.#socket && this.#socket.readyState === this.#socket.OPEN;
    }

    /**
     * Initialize the connection with the
     */
    public init(socket: WebSocket): Connection<true> {
        this.#socket = socket as any;
        this.#socket.binaryType = 'arraybuffer';

        this.registerEvents();
        this.emit('Debug', `Connecting...`);

        return this as Connection<true>;
    }

    /**
     * Disconnect the websocket.
     */
    public disconnect() {
        // Disconnect the socket
        if (this.connected()) this.#socket.close();

        // Broadcast
        this.emit('Disconnect');
    }
}
