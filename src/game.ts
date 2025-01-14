import EventEmitter from "events";

import GameConnection from "./connection.js";
import PlayerMap from "./players/map.js";
import GameWorld from "./world/world.js";

/**
 *
 */
type Events = {
    Init: [];
};

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
 * This is a wrapper for the {@link GameConnection} class that
 * manages the connection to the game server on a lower level
 * where as this class is more focused on implementation of
 * logic.
 *
 * @since 1.4.0
 */
export default class GameClient {
    /**
     * The event emitter is used to emit events when the
     * socket receives a message. The events are then
     * distributed to the listeners.
     * 
     * @since 1.4.0
     */
    private receiver = new EventEmitter<Events>();

    /**
     * @since 1.4.0
     */
    public connection: GameConnection;

    /**
     * The player map is a map of all players in the world. This
     * is synced with the server and is used to manage the world
     * players. If you want to get a snapshot of players without
     * interference use {@link PlayerMap.toArray}
     * 
     * @since 1.4.1
     */
    public players = new PlayerMap();

    /**
     * // TODO document
     * 
     * @since 1.4.2
     */
    public world: GameWorld;

    /**
     * @returns `true` if the connection to the server is running.
     * 
     * @since 1.4.0
     */
    public get connected(): boolean {
        return this.connection.connected;
    }

    /**
     * // TODO document
     */
    public constructor(joinKey: string) {
        this.connection = new GameConnection(joinKey);
        this.world = new GameWorld(this);
        this.players.addListeners(this);
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
        // Upon player init received, send init.
        this.connection.listen("playerInitPacket", () => {
            this.receiver.emit("Init");
        });
    }

    /**
     * Adds the listener function to the end of the listeners array for the
     * event named `eventName`. No checks are made to see if the listener has
     * already been added. Multiple calls passing the same combination of
     * `eventName` and listener will result in the listener being added, and
     * called, multiple times.
     *
     * | Event Name         | Description |
     * |--------------------|-------------|
     * | `Init`             | Game emit `Init` after processing all inits synchronously: {@link PlayerMap}, {@link GameWorld}
     *
     * @since 1.4.0
     */
    public listen<Event extends keyof Events>(eventName: Event, callback: (...e: Events[Event]) => void): this {
        this.receiver.on(eventName as any, callback as any);
        return this;
    }

    /**
     * Sends a chat message to the game server. Internally this invokes
     * the `playerChatPacket` event.
     * 
     * @since 1.4.1
     */
    public sendChat(message: string) {
        this.connection.send("playerChatPacket", { message });
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
     * @since 1.4.0
     */
    public bind() {
        this.connection.bind();
    }

    /**
     * Closes the socket connection to the game server.
     *
     * @since 1.4.0
     */
    public close() {
        this.connection.close();
    }
}
