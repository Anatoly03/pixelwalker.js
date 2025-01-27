import EventEmitter from "events";

import { Protocol } from "./index.js";
import { toBinary, fromBinary, create } from "@bufbuild/protobuf";

import CONFIG from "./config.js";
import JoinData from "./types/join-data.js";

// The following TypoeScript dark magic is used to extract the
// event types. The author of theses is Anatoly and if you want
// to know more about them, you can ask him. They are used to
// create a intelisense for the events that can be emitted by
// the game manager.
type WorldEventNames = Protocol.WorldPacket["packet"]["case"];
type WorldEventData<Name extends WorldEventNames> = Protocol.WorldPacket["packet"] & { case: Name };
type Events = { [K in WorldEventNames & string]: [WorldEventData<K>["value"]] };

// // Allowed world sizes.
// // TODO this type system should be refactored to be used runtime or abandoned
// type AllowedWidth = 636 | 400 | 375 | 350 | 325 | 300 | 275 | 250 | 225 | 200 | 175 | 150 | 125 | 100 | 75 | 50;
// type AllowedHeight = 400 | 375 | 350 | 325 | 300 | 275 | 250 | 225 | 200 | 175 | 150 | 125 | 100 | 75 | 50;

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
     * Optional join data that can be sent to the game server
     * upon connection. This can be used to load an unsaved
     * world.
     * 
     * @since 1.4.4
     */
    private joinData: JoinData = {};

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

        if (globalThis.process)
            this.addNodeJSListeners();
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
    }

    /**
     * Adds NodeJS listeners to the process. This is done to allow
     * sigint to close the socket connection, and close depending
     * promises.
     * 
     * @since 1.4.5
     */
    private addNodeJSListeners() {
        // If running in Node environment, close the socket when
        // the process is interrupted.
        globalThis.process?.on("SIGINT", (signals) => {
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
     * Set the unsaved world flag, the connection should create a new
     * world, i.e. join the world if it does not exist.
     * 
     * // TODO security: set unsaved world flag, abort the connection as error if the joined world is not unsaved
     * 
     * @since 1.4.4
     */
    public addJoinData(joinData: JoinData): this {
        // Input Validation. World Height has to be special value or incremental of 25.
        // TODO input validation for special world 636x400 soon not to be possible
        const allowedHeight = [400, 375, 350, 325, 300, 275, 250, 225, 200, 175, 150, 125, 100, 75, 50];
        const allowedWidth = [636, ...allowedHeight];

        if (joinData.world_height && !allowedHeight.includes(joinData.world_height)) {
            throw new Error(`Invalid world height: ${joinData.world_height}, expected one of ${allowedHeight.join(", ")}`);
        }

        if (joinData.world_width && !allowedWidth.includes(joinData.world_width)) {
            throw new Error(`Invalid world width: ${joinData.world_width}, expected one of ${allowedWidth.join(", ")}`);
        }

        this.joinData = { ...this.joinData, ...joinData };

        return this;
    }

    /**
     * Set the unsaved world flag, the connection should create a new
     * world, i.e. join the world if it does not exist.
     * 
     * // TODO security: set unsaved world flag, abort the connection as error if the joined world is not unsaved
     * 
     * @since 1.4.4
     */
    public unsaved(world_title: string, world_width: number, world_height: number): this {
        this.addJoinData({ world_title, world_width, world_height });
        return this;
    }

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

        // If join data is set, append it to the url.
        if (Object.keys(this.joinData).length) {
            // Encode the join data to base64 and append it to the url.
            // This is how the server accepts the join data.
            url += `?joinData=${btoa(JSON.stringify(this.joinData))}`;
        }

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
