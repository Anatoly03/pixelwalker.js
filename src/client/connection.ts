import EventEmitter from "events"
import WebSocket from 'ws'
import Client from "./client.js"
import { API_ROOM_LINK, RawGameEvents } from "../data/consts.js"
import { Bit7, Magic, String } from '../types/message-bytes.js'
import { deserialise, read7BitInt } from "../types/math.js"
import { MessageTypes } from "../data/message_types.js"
import RoomTypes from "../data/room_types.js"
import util from 'util'

export type ConnectionEvents = {
    Send: [...Buffer[]],
    SendMessage: [...Buffer[]],
    Receive: [Buffer],
    ReceiveFormatted: any[],
    ReceivePing: [],
    Error: [Error],
    Close: [number, string],
    Disconnect: [],
    PromiseRejection: [Error],
    Debug: [string],
}

export enum MagicByte {
    Ping = 0x3F,
    Message = 0x6B,
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
export default class Connection<Ready extends boolean = false> {
    /**
     * Get an array of message typed sequenced integer → message name. Note,
     * that the array below is not full, 
     * 
     * @example
     * 
     * ```ts
     * import Client from 'pixelwalker.js'
     * console.log(Client.MessageTypes); // ["PlayerInit", "UpdateRights", ...]
     * ```
     */
    static MessageTypes = MessageTypes;

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
     * 
     */
    #debug: boolean

    /**
     * Socket that connects with the game
     */
    #socket!: Ready extends true ? WebSocket : never

    /**
     * 
     */
    #client: Client
    
    /**
     * 
     */
    #events = new EventEmitter<ConnectionEvents>()

    /**
     * 
     */
    private registerEvents() {
        /**
         * Report unhandled promises. This will log all unhandled
         * promise rejections to the event emitter.
         */
        process.on("unhandledRejection", error => {
            if (!(error instanceof Error))
                throw new Error('Receive unexpected type while logging unhandled rejections: ' + error)
            this.emit('PromiseRejection', error)
        });

        /**
         * Receive a binary buffer from server.
         */
        this.#socket.on('message', message => {
            const buffer = Buffer.from(message as WithImplicitCoercion<ArrayBuffer>)
            if (buffer.length == 0)
                return

            switch (buffer[0]) {
                case MagicByte.Message:
                    this.emit('Receive', buffer.subarray(1))
                    break
                case MagicByte.Ping:
                    this.emit('ReceivePing')
                    break
                default:
                    return this.emit('Error', new Error(`Received unidentified magic byte from server: expected any of ${Object.values(MagicByte).map((key: string | MagicByte) => `0x${key.toString(16)} (${key})`).join()}, but got 0x${buffer[0].toString(16)}`))
            }
        })

        /**
         * Check on connection error.
         */
        this.#socket.on('error', error => {
            try {
                this.emit('Error', error)
                this.disconnect()
            } catch (e) {
                this.emit('Error', new Error('An unexpected error occured while closing the websocket.'))
            }
        })

        /**
         * Got an unexpected response from the server.
         */
        this.#socket.on('unexpected-response', (request, message) => {
            this.emit('Error', new Error(`Received an unexpected response.\nRequest ${request.method} "${request.host}/${request.path}" was received by response:\n(${message.statusCode}) ${message.statusMessage}`))
            this.disconnect()
        })

        /**
         * On socket opened.
         */
        this.#socket.on('open', () => {
            this.emit('Debug', `Socket opened!`)
        })

        /**
         * On socket is closed.
         */
        this.#socket.on('close', (code, reason) => {
            this.emit('Close', code, reason.toString('ascii'))
            this.disconnect()
        })

        /**
         * Receive and process incoming message.
         */
        this.on('Receive', buffer => {
            const [event_id, offset] = read7BitInt(buffer, 0)
            const event_name = MessageTypes[event_id] as keyof RawGameEvents
            const data = deserialise(buffer, offset)

            if (event_name == undefined)
                return this.emit('Error', new Error(`Received unidentified protocol header 0x${event_id.toString(16)}. API may be out of date. Deserialised Data: ${data}`))

            this.#client.raw.emit('*', [event_name, ...data])
            this.#client.raw.emit(event_name, data as any)
            this.emit('ReceiveFormatted', event_name, ...data)
        })

        /**
         * Receive and process incoming pings.
         */
        this.on('ReceivePing', () => {
            this.emit('Send', Magic(MagicByte.Ping))
        })

        /**
         * Send a binary buffer to the server.
         */
        this.on('Send', (...buffer) => {
            const rawBuffer = Buffer.concat(buffer)
            this.#socket.send(rawBuffer, {}, error => this.emit('Error', error ?? new Error(`While trying to send ${buffer} an unknown error occured.`)))
            if (rawBuffer.length > 0 && rawBuffer[0] === MagicByte.Message)
                this.emit('SendMessage', rawBuffer)
        })
    }

    /**
     * @ignore
     */
    constructor(client: Client, debug = false) {
        this.#debug = debug
        this.#client = client
    }

    /**
     * Create a new socket connection.
     */
    public async start(world_id: string, room_type: typeof RoomTypes[0]) {
        const { token } = await this.#client.pocketbase().send(`/api/joinkey/${room_type}/${world_id}`, {})

        this.#socket = new WebSocket(`${this.url()}/room/${token}`) as any
        this.#socket.binaryType = 'arraybuffer'
        this.registerEvents()
        this.emit('Debug', `Connecting to room "${room_type}/${world_id}"`)

        return this
    }

    /**
     * Get the URL of the connection.
     */
    public url() {
        if (this.#debug)
            return `ws://localhost:5148`
        return `wss://${API_ROOM_LINK}`
    }

    /**
     * Is the current connection connected?
     */
    public connected(): this is Connection<true> {
        return this.#socket && this.#socket.readyState === this.#socket.OPEN
    }

    /**
     * When printing to the console, print formatted.
     */
    public [util.inspect.custom](): string {
        return `Connection ("${this.url()}", connected = ${this.connected()})`
    }

    //
    //
    // Event Code
    //
    //

    /**
     * @ignore
     */
    public on<K extends keyof ConnectionEvents>(event: K, callback: (...args: ConnectionEvents[K]) => void): this {
        this.#events.on(event, callback as any)
        return this
    }

    /**
     * @ignore
     */
    public once<K extends keyof ConnectionEvents>(event: K, callback: (...args: ConnectionEvents[K]) => void): this {
        this.#events.once(event, callback as any)
        return this
    }

    /**
     * @ignore
     */
    public oncePromise<K extends keyof ConnectionEvents, T>(event: K, callback: (...args: ConnectionEvents[K]) => T): Promise<T> {
        return new Promise((res, rej) => {
            const reject = () => rej('The client disconnected.')
            this.once('Close', reject)
            this.#events.once(event, ((...args: any[]) => {
                this.#events.removeListener('Close', reject)
                const output = (callback as any)(...args) as T
                res(output)
            }) as any)
        })
    }

    /**
     * @ignore
     */
    public emit<K extends keyof ConnectionEvents>(event: K, ...args: ConnectionEvents[K]): this {
        this.#events.emit(event, ...args as any)
        return this
    }

    //
    //
    // Methods
    //
    //

    /**
     * Disconnect the websocket.
     */
    public disconnect() {
        // Disconnect the socket
        if (this.connected())
            this.#socket.close()

        // Broadcast
        this.emit('Disconnect')
    }
}