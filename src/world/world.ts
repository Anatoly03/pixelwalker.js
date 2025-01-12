import EventEmitter from "events";

import GameClient from "../client.game.js";

/**
 * // TODO
 */
type Events = {
    Clear: [];
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
 * @since 1.4.2
 */
export default class GameWorld {
    /**
     * The event emitter is used to emit events when the
     * socket receives a message. The events are then
     * distributed to the listeners.
     */
    private receiver = new EventEmitter<Events>();

    /**
     * // TODO document
     */
    public constructor(private game: GameClient) {
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
     * @since 1.4.2
     */
    private addListeners() {
        const { connection } = this.game;

        // Upon world clearing, remove all blocks and leave only a
        // gray border in the foreground layer behind.
        this.game.connection.listen("worldClearedPacket", () => {
            this.receiver.emit("Clear");
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
     * @since 1.4.2
     */
    public listen<Event extends keyof Events>(eventName: Event, callback: (...e: Events[Event]) => void): this {
        this.receiver.on(eventName as any, callback as any);
        return this;
    }

    //
    //
    // METHODS
    //
    //

    /**
     * Requests to clear the world.
     */
    public async clear() {
        this.game.sendChat("/clearworld");
    }
}
