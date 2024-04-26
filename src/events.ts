import Client from "./client.js";
import Player from "./types/player.js";

export default (client: Client) => {

    /**
     * On player join, create a player object with data
     * and emit `player:join` with said object.
     */
    client.raw.on('playerJoined', async (
        [id, cuid, username, face, isAdmin, x, y, god_mode, mod_mode, has_crown]:
            [number, string, string, number, boolean, number, number, boolean, boolean, boolean]
    ) => {
        const player = new Player({
            client,
            id,
            cuid,
            username,
            face,
            isAdmin,
            x: x / 16,
            y: y / 16,
            god_mode,
            mod_mode,
            has_crown
        })

        client.players.set(id, player)
        client.emit('player:join', [player])
    })

    /**
     * On player leave, send the object of the player
     * and destroy it.
     */
    client.raw.on('playerLeft', async ([id]: [number]) => {
        const player = await client.wait_for(() => client.players.get(id))
        client.emit('player:leave', [player])
        client.players.delete(id)
    })

}