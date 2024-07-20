import Client from "../client"
import { BlockMappingsReverse } from "../data/mappings.js"
import { PlayerArray, GamePlayerArray } from "../types/player-ds"
import Player, { PlayerBase } from "../types/player.js"

export function GamePlayerModule(players: GamePlayerArray<true>) {
    return (client: Client) => {
        /**
         * On player join, create a player object with data
         * and emit `player:join` with said object.
         */
        client.raw.on('PlayerJoined', async ([id, cuid, username, face, isAdmin, can_edit, can_god, x, y, color, coins, blue_coins, deaths, collected, god_mode, mod_mode, has_crown, win, num, switches]) => {
            const data = {
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
                has_crown,
                win,
                coins,
                blue_coins,
                deaths,
                can_edit,
                can_god,
                switches
            }
            
            const player = new Player(data)
            players.push(player)
            client.emit('player:join', [player])
        })

        /**
         * Update player rights.
         */
        client.raw.on('UpdateRights', async ([id, edit, god]) => {
            const player = players.byId<true>(id)
            player.can_edit = edit
            player.can_god = god
        })

        /**
         * On player leave, send the object of the player
         * and destroy it.
         */
        client.raw.on('PlayerLeft', async ([id]) => {
            const removedPlayers = players.remove_all(p => p.id == id)
            removedPlayers.forEach(player => client.emit('player:leave', [player]))
        })


        /**
         * TODO Player movement
         */
        client.raw.on('PlayerMoved', async ([id, x, y, speed_x, speed_y, mod_x, mod_y, horizontal, vertical, space_down, space_just_down, tick_id]) => {
            const player = players.byId(id)
            if (!player) return

            player.x = x / 16
            player.y = y / 16

            // TODO
            client.emit('player:move', [player])
        })

        /**
         * Teleport player and reset movement
         */
        client.raw.on('PlayerTeleported', async ([id, x, y]) => {
            const player = players.byId<true>(id)

            player.x = x / 16
            player.y = y / 16

            // TODO momentum changes?
        })

        /**
         * When player changes face, update.
         */
        client.raw.on('PlayerFace', async ([id, face]) => {
            const player = players.byId<true>(id)
            const old_face = player.face
            player.face = face
            client.emit('player:face', [player, face, old_face])
        })

        /**
         * TODO When player changes god mode, update.
         */
        client.raw.on('PlayerGodMode', async ([id, god_mode]) => {
            const player = players.byId<true>(id)
            const old_mode = player.god_mode
            player.god_mode = god_mode
            client.emit('player:god', [player])
        })

        /**
         * TODO When player changes mod mode, update.
         */
        client.raw.on('PlayerModMode', async ([id, mod_mode]) => {
            const player = players.byId<true>(id)
            const old_mode = player.mod_mode
            player.mod_mode = mod_mode
            client.emit('player:mod', [player])
        })

        /**
         * TODO
         */
        client.raw.on('PlayerTouchBlock', async ([id, x, y, bid]) => {
            const player = players.byId<true>(id)
            const block_name = BlockMappingsReverse[bid]

            if (!block_name)
                return console.warn('[WARN] Unknown block id: ' + bid)
            
            if (block_name.startsWith('key_'))
                return client.emit('world:key', [player, block_name.substring(4)])

            switch (block_name) {
                case 'crown_gold':
                    const old_crown = players.find(p => p.has_crown)
                    client.players.forEach((p) => p.has_crown = p.id == id)
                    return client.emit('player:crown', [player, old_crown || null])
                case 'checkpoint':
                    const old_checkpoint = player.checkpoint
                    player.checkpoint = [x, y]
                    return client.emit('player:checkpoint', [player, player.checkpoint, old_checkpoint])
                case 'trophy':
                    return client.emit('player:win', [player])
                case 'god_mode_activator':
                case 'reset_point':
                    return // TODO Event
            }
        })

        /**
         * TODO
         */
        client.raw.on('PlayerCounters', async ([id, gold_coins, blue_coins, death_count]) => {
            const player = players.byId<true>(id)

            const old_coins = player.coins
            const old_blue_coins = player.blue_coins
            const old_death_count = player.deaths

            player.coins = gold_coins
            player.blue_coins = blue_coins
            player.deaths = death_count

            if (old_coins < gold_coins) client.emit('player:coin', [player, old_coins])
            if (old_blue_coins < blue_coins) client.emit('player:coin:blue', [player, old_blue_coins])
            if (old_death_count < death_count) client.emit('player:death', [player, old_death_count])
        })

        client.raw.on('PlayerReset', ([id, x, y]) => {
            const player = players.byId<true>(id)
            player.x = x / 16
            player.y = y / 16
            // TODO
            client.emit('player:reset', [player])
        })

        client.raw.on('PlayerRespawn', ([id, x, y]) => {
            const player = players.byId<true>(id)
            player.x = x / 16
            player.y = y / 16
            client.emit('player:respawn', [player])
        })

        return client
    }
}

