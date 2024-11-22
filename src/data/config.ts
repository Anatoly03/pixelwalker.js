export default {
    /**
     * The API server link is the link to the [PocketBase](https://pocketbase.io/)-
     * based server. This part of the PixelWalker backend architecture manages
     * accounts, and persistant storage.
     */
    get APIServerLink() {
        if (process.env.LOCALHOST) return "127.0.0.1:8090";
        return "api.pixelwalker.net";
    },

    /**
     * The Game server link is the link to the game server, which manages runtime
     * world connections.
     */
    get GameServerLink() {
        if (process.env.LOCALHOST) return "localhost:5148";
        return "game.pixelwalker.net";
    },
};
