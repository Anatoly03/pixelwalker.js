import EventEmitter from 'events';
import WebSocket from 'ws';

import Client from './client.js';
import BufferReader from '../math/buffer-reader.js';
import MessageTypes from '../data/message-types.js';

/**
 *
 */
export enum MagicByte {
    Ping = 0x3f,
    Message = 0x6b,
}

/**
 * All events related to the state of the socket, such as
 * socket opening or closing.
 */
type SocketStateEvents = {
    Receive: BufferReader[];
    Send: Buffer[];
    Error: [Error];
    Close: [number, string];
    Disconnect: [];
    PromiseRejection: [Error];
    Debug: [string];
    '*': [(typeof MessageTypes)[number], ...any[]];
} & {
    [K in `Receive${keyof typeof MagicByte}`]: [BufferReader];
} & {
    [K in `Send${keyof typeof MagicByte}`]: Buffer[];
} & {
    [K in `Receive*${(typeof MessageTypes)[number]}`]: any[];
} & {
    [K in `Send*${(typeof MessageTypes)[number]}`]: Buffer[];
};

/**
 * The Connection class handles the lowest level of communication
 * between the client and the server. It contains the socket and
 * processes byte-level communication.
 *
 * The Connection class handles the ping handshake with the server,
 * which is sending a ping byte response to every ping byte request
 * from the server.
 *
 * The events follow a hierarchic, layered structure. The bottom-most
 * layer, which handles pure byte to byte transfer are the events
 * `Receive` and `Send` which directly submit byte data to the socket.
 * 
 * The second layer after direct communication consists of a header
 * the size of one byte (reffered to as magic byte below) The two
 * different magic bytes are for messages and pings. On this layer,
 * the events `ReceiveMessage`, `ReceivePing`, `SendMessage` and
 * `SendPing`.
 * 
 * Pings don't contain any information, but messages are transmitted
 * to the 3rd and top-most layer within the `Connection` class.
 * Messages follow by their message type in 7-bit encoding. The events
 * are then broadcasted to the events `Send*$1` and `Receive*$1`
 * where `$1` is replaced with the message name respectively.
 * 
 * @example
 * 
 * Here is an example of a ping message being processed.
 * 
 * ```
 * // Socket receives [MagicPing]
 * 'Receive': [MagicPing]
 * 'ReceivePing': []
 * 'SendPing': []
 * 'Send': [MagicPing]
 * // Socket sends [MagicPing]
 * ```
 * 
 * @example
 * 
 * Here is an example of a more complex message being processed.
 * 
 * ```
 * // Socket receives [MagicMessage, ChatMessage, 1, 'Hello, World!']
 * 'Receive': [MagicMessage, ChatMessage, 1, 'Hello, World!']
 * 'ReceiveMessage': [ChatMessage, 1, 'Hello, World!']
 * 'Receive*ChatMessage': [1, 'Hello, World!']]
 * // Processing, assume we send 'Hi!' as a return
 * 'Send*ChatMessage': ['Hi!']
 * 'SendMessage': [ChatMessage, 'Hi!']
 * 'Send': [MagicMessage, ChatMessage, 'Hi!']
 * // Socket sends [MagicMessage, ChatMessage, 'Hi!']
 * ```
 * 
 * @param {boolean} Ready A generic parameter signaling a connected
 * socket. As of now this is unused.
 */
export default class Connection<
    Ready extends boolean = false
> extends EventEmitter<SocketStateEvents> {
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
    static MessageId<
        Index extends number,
        MessageType extends (typeof MessageTypes)[Index]
    >(messageName: MessageType): Index {
        return this.MessageTypes.findIndex((m) => m === messageName)! as Index;
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
     * Registers the following event handlers.
     *
     * - `process.'unhandledRejection'`
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
                throw new Error(
                    'Receive unexpected type while logging unhandled rejections: ' +
                        error
                );
            this.emit('PromiseRejection', error);
        });

        /**
         * @event
         *
         * Receive a binary buffer from server. This function
         * preprocessed the array buffer that is received and
         * broadcasts a buffer reader to the `Receive` event.
         *
         * The `Receive` event will apply logic on the message
         * and distribute among different event handlers.
         */
        this.#socket.on('message', (message) => {
            const buffer = BufferReader.from(
                message as WithImplicitCoercion<ArrayBuffer>
            );

            this.emit('Receive', buffer);
        });

        /**
         * @event
         *
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
         * @event
         *
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
         * @event
         *
         * On socket opened.
         */
        this.#socket.on('open', () => {
            this.emit('Debug', `Socket opened!`);
        });

        /**
         * @event
         *
         * On socket is closed.
         */
        this.#socket.on('close', (code, reason) => {
            this.emit('Close', code, reason.toString('ascii'));
            this.disconnect();
        });

        /**
         * @event Receive
         *
         * This event is called directly from the socket event
         * for message events. The `Receive` event distributes
         * the message to an upper layer of abstraction by reading
         * the first byte from the buffer reader. The distribution
         * is applied to the `ReceivePing` and `ReceiveMessage`
         * events.
         */
        this.on('Receive', (buffer) => {
            if (buffer.length == 0) return;
            const magicByte = buffer.readUInt8();

            for (const e of Object.keys(MagicByte).filter(isNaN as any)) {
                const header = e as keyof typeof MagicByte;
                const byte = MagicByte[header];
                if (byte != magicByte) continue;
                this.emit(`Receive${header}`, buffer);
                return;
            }

            this.emit(
                'Error',
                new Error(
                    `Received unidentified magic byte from server: 0x${buffer
                        .at(0)
                        .toString(16)}`
                )
            );
        });

        /**
         * @event ReceivePing
         *
         * This event is called when a ping was received. A ping
         * is a message from the socket consisting only of the
         * magic byte for pings.
         *
         * Upon receiving a ping, it is considered by the game
         * server as a requirement to respond with a ping. This is
         * done by emitting the `SendPing` event with an empty
         * buffer.
         */
        this.on('ReceivePing', () => {
            this.emit('SendPing', Buffer.alloc(0));
        });

        /**
         * @event ReceiveMessage
         *
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

            this.emit(`*`, event_name, ...data);
            this.emit(`Receive*${event_name}`, ...data);
        });

        // /**
        //  * Receive and process incoming pings.
        //  */
        // this.on('ReceivePing', () => {
        //     this.emit('Send', BufferReader.Magic(MagicByte.Ping));
        // });

        /**
         * @event Send*PlayerInit
         * @event Send*UpdateRights
         * @event ...
         *
         * The following piece of code generates event handlers for
         * message events. The event handler only does two things:
         *
         * First, append the respective header byte at the start of
         * the buffer, then broadcast to the lower communication layer,
         * emitting `SendMessage`, which then broadcasts the message
         * to the lowest layer at `Send`.
         */
        for (const e of MessageTypes) {
            const header = e as (typeof MessageTypes)[number];
            this.on(`Send*${header}`, (...buffer) => {
                const messageId = Connection.MessageId(header);
                const messageIdBuffer = BufferReader.Bit7(messageId);

                this.emit('SendMessage', messageIdBuffer, ...buffer);
            });
        }

        /**
         * @event SendMessage
         * @event SendPing
         *
         * The following piece of code generates event handlers for
         * magic byte events. The event handler only does two things:
         *
         * First, append the respective magic byte at the start of the
         * buffer, then broadcast to the lowest communication layer,
         * emitting `Send`, which then broadcasts the message to the
         * server.
         */
        for (const e of Object.keys(MagicByte).filter(isNaN as any)) {
            const header = e as keyof typeof MagicByte;
            this.on(`Send${header}`, (...buffer) => {
                this.emit(
                    'Send',
                    BufferReader.Magic(MagicByte[header]),
                    ...buffer
                );
            });
        }

        /**
         * @event Send
         *
         * Send a binary buffer to the server.
         */
        this.on('Send', (...buffers) => {
            const buffer = Buffer.concat(buffers);
            this.#socket.send(
                buffer,
                {},
                (error) => error && this.emit('Error', error)
            );
        });
    }

    /**
     * Creates a new connection manager.
     */
    constructor(private client: Client) {
        super();
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
