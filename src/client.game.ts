import EventEmitter from "events";

import CONFIG from "./config";

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
 */
export default class GameClient {
    private socket?: WebSocket;

    /**
     * // TODO document
     *
     * @param joinKey
     */
    public constructor(private joinKey: string) {}

    /**
     * // TODO document
     */
    public bind() {
        let url = CONFIG.GAME_SERVER_SOCKET + "/room/" + this.joinKey;

        // TODO append join data to url

        this.socket = new WebSocket(url);
        this.socket.binaryType = "arraybuffer";

        this.socket.onopen = (event) => {};

        this.socket.onmessage = (event) => {
            const buffer = Buffer.from(event.data as WithImplicitCoercion<ArrayBuffer>);
            console.log(buffer);
        };

        this.socket.onclose = (event) => {};

        this.socket.onerror = (event) => {};
    }
}
