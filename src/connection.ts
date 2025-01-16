import EventEmitter from "events";

import { Protocol } from "./index.js";
import { toBinary, fromBinary, create } from "@bufbuild/protobuf";

import CONFIG from "./config.js";

// The following TypoeScript dark magic is used to extract the
// event types. The author of theses is Anatoly and if you want
// to know more about them, you can ask him. They are used to
// create a intelisense for the events that can be emitted by
// the game manager.
type WorldEventNames = Protocol.WorldPacket["packet"]["case"];
type WorldEventData<Name extends WorldEventNames> = Protocol.WorldPacket["packet"] & { case: Name };
type Events = { [K in WorldEventNames & string]: [WorldEventData<K>["value"]] };

/**
 * The Game Client is responsible for communication with the
 * {@link https://game.pixelwalker.net/ PixelWalker Game Server}.
 * The Game server has acustom implementation and is mostly
 * responsible for managing the online game worlds and running
 * socket connection.
 *
 * To compare it with how users sign up, the API Client is
 * the "lobby" from which you can access the open game rooms
 * or join a world. Then you join a world and let the Game
 * Client take over.
 * 
 * This class is very low level in managing the connection to
 * the game server. It only provides listening and send logic
 * but does not save a 'world state' unlike {@link GameClient}
 * which you probably want to use instead.
 * 
 * @since 1.4.1
 */
export default class GameConnection {
    /**
     * An **optional** instance of the websocket. It is
     * instantiated when the `bind` method is called and
     * dropped on disconnect.
     * 
     * @since 1.4.1
     */
    private socket?: WebSocket;

    /**
     * The event emitter is used to emit events when the
     * socket receives a message. The events are then
     * distributed to the listeners.
     * 
     * @since 1.4.1
     */
    private receiver = new EventEmitter<Events>();

    /**
     * @returns `true` if the socket is connected to the server.
     * 
     * @since 1.4.1
     */
    public get connected(): boolean {
        return this.socket !== undefined && this.socket.readyState === WebSocket.OPEN;
    }

    /**
     * // TODO document
     *
     * @param joinKey
     */
    public constructor(private joinKey: string) {
        this.addListeners();
    }

    //
    //
    // EVENTS
    //
    //

    /**
     * This method is invoked on construction of the connection
     * and adds the required listeners to the receiver.
     * 
     * @since 1.4.1
     */
    private addListeners() {
        // Send the player init received event when the player
        // init packet is received. This is required by the game
        // server and it will disconnect all players after some
        // time who do not send this packet.
        this.listen("playerInitPacket", () => {
            this.send("playerInitReceived");
        });

        // Send the ping event when the ping packet is received.
        // This is required by the game server and it will disconnect
        // all players after some time who do not send this packet.
        this.listen("ping", () => {
            this.send("ping");
        });

        // If running in Node environment, close the socket when
        // the process is interrupted.
        process?.on("SIGINT", (signals) => {
            this.close();
        });
    }

    /**
     * Adds the listener function to the end of the listeners array for the
     * event named `eventName`. No checks are made to see if the listener has
     * already been added. Multiple calls passing the same combination of
     * `eventNameand` listener will result in the listener being added, and
     * called, multiple times.
     *
     * | Event Name         | Description |
     * |--------------------|-------------|
     * | `playerInitPacket` | The message event is received when the client opens the connection.
     *
     * @since 1.4.1
     */
    public listen<Event extends keyof Events>(eventName: Event, callback: (e: Events[Event][0]) => void): this {
        this.receiver.on(eventName as any, callback as any);
        return this;
    }

    /**
     * Alternative call to {@link listen}. The difference is that
     * {@link prependListen} will add the listener to the beginning of the
     * listeners array. In general you should use this method when you want
     * to ensure the game manager hasn't processed the event yet, like
     * player leaving the world or world operations.
     *
     * @since 1.4.1
     */
    public prependListen<Event extends keyof Events>(eventName: Event, callback: (e: Events[Event][0]) => void): this {
        this.receiver.prependListener(eventName as any, callback as any);
        return this;
    }

    /**
     * Sends a message to the game server without any body. Only two events, `ping` and
     * `playerInitReceived` can be sent without any body.
     *
     * ### Events
     *
     * | Event Name           | Description |
     * |----------------------|-------------|
     * | `ping`               | The message has to be sent for every `ping` received from the server.
     * | `playerInitReceived` | The message has to be sent when the client receives `playerInitPacket`.
     *
     * @since 1.4.1
     */
    public send<Event extends keyof Events>(eventName: Event): void;

    /**
     * Sends a message to the game server, evaluating the header bytes and argument
     * format based on `eventName`.
     *
     * ### Events
     *
     * | Event Name           | Description |
     * |----------------------|-------------|
     * | `playerInitReceived` | The message has to be sent when the client receives `playerInitPacket`.
     *
     * @since 1.4.1
     */
    public send<Event extends keyof Events>(eventName: Event, value: Events[Event][0]): void;

    /**
     * Sends a message to the game server, evaluating the header bytes and argument
     * format based on `eventName`. *You can optionally omit the `$typeName` and `playerId`
     * fields from the message.*
     *
     * ### Events
     *
     * | Event Name           | Description |
     * |----------------------|-------------|
     * | `playerInitReceived` | The message has to be sent when the client receives `playerInitPacket`.
     *
     * @since 1.4.1
     */
    public send<Event extends keyof Events>(eventName: Event, value: Omit<Events[Event][0], "$typeName" | "playerId">): void;

    public send<Event extends keyof Events>(eventName: Event, value: Events[Event][0] = <any>{}) {
        const message = create(Protocol.WorldPacketSchema, { packet: { case: eventName, value } } as any);
        const buffer = toBinary(Protocol.WorldPacketSchema, message);

        if (!this.socket) {
            this.close();
            return;
        }

        this.socket.send(buffer);
    }

    //
    //
    // METHODS
    //
    //

    /**
     * Binds the socket connection to the game server. The method
     * will create a new WebSocket instance and connect to the
     * game room. It will also start processing the incoming
     * messages and emit events.
     *
     * @since 1.4.1
     */
    public bind() {
        let url = CONFIG.GAME_SERVER_SOCKET + "/room/" + this.joinKey;

        // TODO append join data to url

        this.socket = new WebSocket(url);
        this.socket.binaryType = "arraybuffer";

        // Create the socket on message handler. It will parse
        // incoming binaries and using https://protobuf.dev/
        // and emits the events.
        this.socket.onmessage = (event) => {
            const buffer = Buffer.from(event.data as WithImplicitCoercion<ArrayBuffer>);
            const packet = fromBinary(Protocol.WorldPacketSchema, buffer);
            this.receiver.emit(packet.packet.case as any, packet.packet.value);
        };

        // TODO handle errors
        this.socket.onerror = (event) => {
            console.error(event);
        };
    }

    /**
     * Closes the socket connection to the game server.
     *
     * @since 1.4.1
     */
    public close() {
        this.socket?.close();
        this.socket = undefined;
    }
}
