import Client from "../client.js"
import { BlockMappingsReverse } from "../data/mappings.js"
import { GamePlayerArray } from "../types/list/player.js"
import Player from "../types/player/player.js"

export function GamePlayerModule(players: GamePlayerArray<true>) {
    return (client: Client) => {
        /**
         * On player join, create a player object with data
         * and emit `player:join` with said object.
         */
        client.raw.on('PlayerJoined', async ([id, cuid, username, face, isAdmin, can_edit, can_god, x, y, color, coins, blue_coins, deaths, collected, god, mod, crown, win, team, switches]) => {
            const player = new Player({
                client,
                id,
                cuid,
                username,
                face,
                isSelf: false,
                isAdmin,
                x: x / 16,
                y: y / 16,
                god,
                mod,
                crown,
                win,
                coins,
                blue_coins,
                deaths,
                can_edit,
                can_god,
                team,
            })
            players.push(player)
            client.emit('player:join', [player])
        })

        /**
         * On player leave, send the object of the player
         * and destroy it.
         */
        client.raw.on('PlayerLeft', async ([id]) => {
            const removedPlayers = players.remove_all(p => p.id == id)
            removedPlayers.forEach(player => client.emit('player:leave', [player]))
        })

        return client
    }
}

