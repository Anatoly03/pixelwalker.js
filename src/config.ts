export default {
    /**
     * The API server link is the link to the [PocketBase](https://pocketbase.io/)-
     * based server. This part of the PixelWalker backend architecture manages
     * accounts, and persistant storage.
     */
    get API_SERVER_HTTP() {
        if (process?.env.LOCALHOST) return "http://127.0.0.1:8090";
        return "https://api.pixelwalker.net";
    },

    /**
     * The Game server link is the link to the game server, which manages runtime
     * world connections.
     */
    get GAME_SERVER_SOCKET() {
        if (process?.env.LOCALHOST) return "ws://127.0.0.1:5148";
        return "wss://game.pixelwalker.net";
    },
    
    /**
     * The Game server link is the link to the game server, which manages runtime
     * world connections.
     */
    get GAME_SERVER_HTTP() {
        if (process?.env.LOCALHOST) return "http://localhost:5148";
        return "https://game.pixelwalker.net";
    },
};
