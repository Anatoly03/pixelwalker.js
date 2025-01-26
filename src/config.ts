export default {
    /**
     * This method allows you to check if the input is a NodeJS process,
     * which is useful for checking if the code is running in a NodeJS
     * environment.
     * 
     * @since 1.4.5
     */
    _IS_NODEJS_PROCESS(process: any): process is NodeJS.Process {
        return typeof process !== "undefined";
    },

    /**
     * The API server link is the link to the [PocketBase](https://pocketbase.io/)-
     * based server. This part of the PixelWalker backend architecture manages
     * accounts, and persistant storage.
     * 
     * @since 1.4.0
     */
    get API_SERVER_HTTP() {
        if (this._IS_NODEJS_PROCESS(process) && process.env.LOCALHOST) return "http://127.0.0.1:8090";
        return "https://api.pixelwalker.net";
    },

    /**
     * The Game server link is the link to the game server, which manages runtime
     * world connections.
     * 
     * @since 1.4.0
     */
    get GAME_SERVER_SOCKET() {
        if (this._IS_NODEJS_PROCESS(process) && process.env.LOCALHOST) return "ws://127.0.0.1:5148";
        return "wss://game.pixelwalker.net";
    },
    
    /**
     * The Game server link is the link to the game server, which manages runtime
     * world connections.
     * 
     * @since 1.4.0
     */
    get GAME_SERVER_HTTP() {
        if (this._IS_NODEJS_PROCESS(process) && process.env.LOCALHOST) return "http://localhost:5148";
        return "https://game.pixelwalker.net";
    },
};
