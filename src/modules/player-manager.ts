import Client from "../client";
import Player, { PlayerBase } from "../types/player.js";

/**
 * This module generates a module function that will log certain events.
 */
export default function Module(client: Client): Client {
    

    /**
     * On player join, create a player object with data
     * and emit `player:join` with said object.
     */
    client.raw.on('playerJoined', async ([id, cuid, username, face, isAdmin, can_edit, can_god, x, y, coins, blue_coins, deaths, god_mode, mod_mode, has_crown]) => {
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
            coins,
            blue_coins,
            deaths,
            can_edit,
            can_god
        }
        
        const player = new Player(data)
        const player_base = new PlayerBase(data)

        client.players.set(id, player)
        client.globalPlayers.set(cuid, player_base)
        client.emit('player:join', [player])
    })

    /**
     * Update player rights.
     */
    client.raw.on('updateRights', async ([id, edit, god]) => {
        const player = client.players.get(id)
        if (!player)  return
        player.can_edit = edit
        player.can_god = god
    })

    /**
     * On player leave, send the object of the player
     * and destroy it.
     */
    client.raw.on('playerLeft', async ([id]) => {
        const player = client.players.get(id)
        if (!player)  return
        client.emit('player:leave', [player])
        client.players.delete(id)
    })


    /**
     * TODO Player movement
     */
    client.raw.on('playerMoved', async ([id, x, y, speed_x, speed_y, mod_x, mod_y, horizontal, vertical, space_down, space_just_down, tick_id]) => {
        const player = client.players.get(id)
        if (!player)  return

        player.x = x / 16
        player.y = y / 16

        // TODO
        // client.emit('player:move', [player])
    })

    /**
     * Teleport player and reset movement
     */
    client.raw.on('playerTeleported', async ([id, x, y]) => {
        const player = client.players.get(id)
        if (!player)  return

        player.x = x / 16
        player.y = y / 16

        // TODO momentum changes?
    })

    /**
     * When player changes face, update.
     */
    client.raw.on('playerFace', async ([id, face]) => {
        const player = client.players.get(id)
        if (!player)  return
        const old_face = player.face
        player.face = face
        client.emit('player:face', [player, face, old_face])
    })

    /**
     * TODO When player changes god mode, update.
     */
    client.raw.on('playerGodMode', async ([id, god_mode]) => {
        const player = client.players.get(id)
        if (!player)  return
        const old_mode = player.god_mode
        player.god_mode = god_mode
        client.emit('player:god', [player])
    })

    /**
     * TODO When player changes mod mode, update.
     */
    client.raw.on('playerModMode', async ([id, mod_mode]) => {
        const player = client.players.get(id)
        if (!player)  return
        const old_mode = player.mod_mode
        player.mod_mode = mod_mode
        client.emit('player:mod', [player])
    })

    /**
     * TODO
     */
    client.raw.on('crownTouched', async ([id]) => {
        const { players } = client
        if (!players)  return
        const player: Player = players.get(id) as Player
        if (!player)  return
        const old_crown = Array.from(players.values()).find(p => p.has_crown)
        players.forEach((p) => p.has_crown = p.id == id)
        client.emit('player:crown', [player, old_crown || null])
    })

    /**
     * TODO
     */
    client.raw.on('playerStatsChanged', async ([id, gold_coins, blue_coins, death_count]) => {
        const player = client.players.get(id)
        if (!player)  return

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

    return client
}

