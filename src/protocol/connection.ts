import EventEmitter from 'events';
import WebSocket from 'ws';

import Client from './client.js';
import BufferReader from '../util/buffer-reader.js';
import MessageTypes from '../data/message-types.js';
import PixelwalkerEvents from '../types/events.js';

/**
 * The Magic Bytes. All incoming messages start with
 * either of the magic bytes.
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
    Error: [Error];
    Open: [];
    Close: [number, string];
    Disconnect: [];
} & {
    [K in `Receive${keyof typeof MagicByte}`]: [BufferReader];
};

/**
 * All events stored in `receive` which keep the formatted
 * variants of the events.
 */
type ConnectionReceiveEvents = PixelwalkerEvents & {
    '*': [(typeof MessageTypes)[number], ...any[]];
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
 * layer is hidden within the `WebSocket` instance and cannot be
 * accessed.
 *
 * The Connection handles the second layer with the `Receive$1` events,
 * where `$1` is to be replaced with the distributions of the messages,
 * based on the first magic byte.
 *
 * Pings don't contain any information. Messages are transmitted
 * to the 3rd and top-most layer within another event emitter instance
 * that can be accessed with `receive()`
 *
 * Messages follow by their message type in 7-bit encoding. The events
 * are then broadcasted to the event emitter with the message name.
 *
 * @example
 *
 * Here is an example of a ping message being processed.
 *
 * ```
 * 1. Socket receives [MagicPing]
 * 2. 'ReceivePing' with rest buffer []
 * 3. 'send' is called with arguments. [MagicPing]
 * 4. Socket sends [MagicPing]
 * ```
 *
 * @example
 *
 * Here is an example of a more complex message being processed.
 *
 * ```
 * 1. Socket receives [MagicMessage, ChatMessage, 1, 'Hello, World!']
 * 2. 'ReceiveMessage' with rest buffer [ChatMessage, 1, 'Hello, World!']
 * 3. The upper-layer event 'ChatMessage' is emitted with rest buffer [1, 'Hello, World!']]
 * 4. Processing, assume we send 'Hi!' as a return
 * 5. Client 'send' is called with arguments event='ChatMessage' and arguments = ['Hi!]
 * 6. 'send' is called with arguments. [MagicMessage, ChatMessage, 'Hi!']
 * 7. Socket sends [MagicMessage, ChatMessage, 'Hi!']
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
    public static MessageTypes: typeof MessageTypes = MessageTypes;

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
    public static MagicByte: typeof MagicByte = MagicByte;

    /**
     * Socket that connects with the game.
     */
    #socket!: Ready extends true ? WebSocket : never;

    /**
     *
     */
    #receive: EventEmitter<ConnectionReceiveEvents> = new EventEmitter();

    /**
     * Registers the event handlers.
     *
     * - On socket open, emits `Open`.
     * - On socket message, scan in the magic byte and
     *   distribute the buffer to the respective events.
     *   The events are `ReceivePing`, `ReceiveMessage`.
     * - On `ReceivePing`, respond with a ping to server.
     * - On `ReceiveMessage`, scan in integer in 7-bit
     *   notation, which corresponds to the message type
     *   and distribute the buffer rest to the `receive()`
     *   event emitter.
     * - On socket close, emit `Close`.
     * - On socket errors, or unexpected response when
     *   connecting, emit `Error` with the error message.
     */
    private registerEvents() {
        /**
         * @event Socket.Open
         *
         * On socket opened.
         */
        this.#socket.on('open', () => {
            this.emit('Open');
        });

        /**
         * @event Socket.Message
         *
         * Receive a binary buffer from server. This function
         * preprocesses the array buffer that is received to a
         * buffer reader and distributes the message based on
         * the first magic byte identified.
         *
         * The distribution can either be the `ReceivePing` or
         * `ReceiveMessage` events.
         */
        this.#socket.on('message', (message) => {
            const buffer = BufferReader.from(
                message as WithImplicitCoercion<ArrayBuffer>
            );

            if (buffer.length == 0) return;
            const magicByte = buffer.readUInt8();

            for (const e of Object.keys(MagicByte).filter(isNaN as any)) {
                const header = e as keyof typeof MagicByte;
                const byte = MagicByte[header];
                if (byte != magicByte) continue;
                return this.emit(`Receive${header}`, buffer);
            }

            this.error(
                `Received unidentified magic byte from server: ${buffer
                    .at(0)
                    .toString(16)}`
            );
        });

        /**
         * @event Connection.ReceivePing
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
            this.send(Connection.MagicByte.Ping);
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

            this.receive().emit(`*`, event_name, ...data);
            (this.receive().emit as any)(event_name, ...data);
        });

        /**
         * @event Socket.Close
         *
         * On socket is closed.
         */
        this.#socket.on('close', (code, reason) => {
            this.emit('Close', code, reason.toString('ascii'));
            this.disconnect();
        });

        /**
         * @event Socket.Error
         *
         * Disconnect on connection error.
         */
        this.#socket.on('error', (error) => {
            this.error(error);
            this.disconnect();
        });

        /**
         * @event Socket.UnexpectedResponse
         *
         * Got an unexpected response from the server.
         */
        this.#socket.on('unexpected-response', (request, message) => {
            this.error(
                `Received an unexpected response.\nRequest ${request.method} "${request.host}/${request.path}" was received by response:\n(${message.statusCode}) ${message.statusMessage}`
            );
            this.disconnect();
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
     * Retrieve the event manager for sending signals to
     * the server. Listening on `send()` will emit all
     * message requests that the client is sending.
     *
     * @example
     *
     * ```ts
     * client.connection.send().emit('PlayerInit');
     * ```
     */
    public send(...args: (Buffer | number[] | number)[]): this {
        const processed = args.map((b) => {
            if (b instanceof Buffer) return b;
            if (typeof b == 'number') return Buffer.from([b]);
            return Buffer.from(b);
        });
        this.#socket.send(Buffer.concat(processed));
        return this;
    }

    /**
     * Retrieve the event manager for receiving signals
     * from the server. Listening on `receive()` will emit
     * all incoming message requests that the server is
     * sending.
     *
     * @example
     *
     * ```ts
     * client.connection.receive().on('PlayerInit',
     *   (...args) =>
     *     console.log(args));
     * ```
     */
    public receive() {
        return this.#receive;
    }

    /**
     * Emit an error.
     */
    private error(err: string | Error) {
        if (err instanceof Error) return this.emit('Error', err);
        return this.emit('Error', new Error(err));
    }

    /**
     * Initialize the connection with the
     */
    public init(socket: WebSocket): Connection<true> {
        this.#socket = socket as any;
        this.#socket.binaryType = 'arraybuffer';

        this.registerEvents();

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
