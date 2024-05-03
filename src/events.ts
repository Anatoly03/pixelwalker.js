
import Client from "./client.js"
import { MessageType } from "./data/consts.js"
import { Magic, Bit7 } from "./types.js"
import Player from "./types/player.js"
import World from "./types/world.js"

/**
 * Event Initialiser for Client
 */
export default function init_events (client: Client) {
    /**
     * On init, set everything up
     */
    client.raw.once('init', async ([id, cuid, username, face, isAdmin, x, y, can_edit, can_god, title, plays, owner, global_switch_states, width, height, buffer]) => {
        await client.send(Magic(0x6B), Bit7(MessageType['init']))

        client.world = new World(width, height)
        client.world.init(buffer)

        client.ping_modules(c => c.world = client.world)

        client.self = new Player({
            client,
            id,
            cuid,
            username,
            face,
            isAdmin,
            x: x / 16,
            y: y / 16,
        })

        client.players.set(id, client.self)
        client.emit('start', [client.self])
    })

    /**
     * On player join, create a player object with data
     * and emit `player:join` with said object.
     */
    client.raw.on('playerJoined', async ([id, cuid, username, face, isAdmin, can_edit, can_godmode, x, y, coins, blue_coins, deaths, god_mode, mod_mode, has_crown]) => {
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
            has_crown,
            coins,
            blue_coins,
            deaths
        })

        client.players.set(id, player)
        client.emit('player:join', [player])
    })

    /**
     * On player leave, send the object of the player
     * and destroy it.
     */
    client.raw.on('playerLeft', async ([id]) => {
        const player = await client.wait_for(() => client.players.get(id))
        client.emit('player:leave', [player])
        client.players.delete(id)
    })

    /**
     * When receiving a chat message, if it is a command,
     * emit command, otherwise emit chat message
     */
    client.raw.on('chatMessage', async ([id, message]) => {
        const player = await client.wait_for(() => client.players.get(id))

        client.emit('chat', [player, message])

        if (!message) return

        const prefix = client.cmdPrefix.find(v => message.toLowerCase().startsWith(v))

        if (!prefix) return

        const slice = message.substring(prefix.length)
        const arg_regex = /"(\\\\|\\"|[^"])*"|'(\\\\|\\'|[^'])*'|[^\s]+/gi
        const args: [Player, ...any] = [player]
        for (const match of slice.matchAll(arg_regex)) args.push(match[0])
        if (args.length < 2) return

        const cmd = args[1].toLowerCase()

        client.emit(`cmd:${cmd}`, args)
    })

    /**
     * TODO Player movement
     */
    client.raw.on('playerMoved', async ([id, x, y, speed_x, speed_y, mod_x, mod_y, horizontal, vertical, space_down, space_just_down, tick_id]) => {
        const player = await client.wait_for(() => client.players.get(id))

        player.x = x / 16
        player.y = y / 16

        // TODO if (player.mod_x != undefined && player.mod_x != mod_x) // hit key right or left
        // TODO if (player.mod_y != undefined && player.mod_y != mod_y) // hit key up or down
        // TODO hit space

        // TODO
        // client.emit('player:move', [player])

        player.horizontal = horizontal
        player.vertical = vertical
        player.space_down = space_down
        player.space_just_down = space_just_down
    })

    /**
     * Teleport player and reset movement
     */
    client.raw.on('playerTeleported', async ([id, x, y]) => {
        const player = await client.wait_for(() => client.players.get(id))

        player.x = x / 16
        player.y = y / 16

        // TODO
    })

    /**
     * When player changes face, update.
     */
    client.raw.on('playerFace', async ([id, face]) => {
        const player = await client.wait_for(() => client.players.get(id))
        const old_face = player.face
        player.face = face
        client.emit('player:face', [player, face, old_face])
    })

    /**
     * TODO When player changes god mode, update.
     */
    client.raw.on('playerGodMode', async ([id, god_mode]) => {
        const player = await client.wait_for(() => client.players.get(id))
        const old_mode = player.god_mode
        player.god_mode = god_mode
        client.emit('player:god', [player])
    })

    /**
     * TODO When player changes mod mode, update.
     */
    client.raw.on('playerModMode', async ([id, mod_mode]) => {
        const player = await client.wait_for(() => client.players.get(id))
        const old_mode = player.god_mode
        player.mod_mode = mod_mode
        client.emit('player:mod', [player])
    })

    /**
     * TODO
     */
    client.raw.on('crownTouched', async ([id]) => {
        const players = await client.wait_for(() => client.players)
        const player: Player = players.get(id) as Player
        const old_crown = Array.from(players.values()).find(p => p.has_crown)
        players.forEach((p) => p.has_crown = p.id == id)
        client.emit('player:crown', [player, old_crown || null])
    })

    /**
     * TODO
     */
    client.raw.on('playerStatsChanged', async ([id, gold_coins, blue_coins, death_count]) => {
        const player = await client.wait_for(() => client.players.get(id))

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

    /**
     * TODO
     */
    client.raw.on('placeBlock', async ([id, x, y, layer, bid, ...args]) => {
        if (client.scheduler == null) return

        const player = await client.wait_for(() => client.players.get(id))
        const world = await client.wait_for(() => client.world)
        const [position, block] = world.place(x, y, layer, bid, args)
        
        const key: `${number}.${number}.${0|1}` = `${x}.${y}.${layer}`
        const entry = client.scheduler.block_queue.get(key)

        // console.log('receive', block.name)

        if (entry) {
            client.scheduler.block_queue.delete(key)
        }
        // if (client.self && entry && client.self.id == id) {
        //     if (client.scheduler.block_queue.get(key)?.isSameAs(block)) {
        //         client.scheduler.block_queue.delete(key)
        //     }
        // }

        client.emit('player:block', [player, position, block])
    })

    /**
     * TODO
     */
    client.raw.on('worldCleared', async ([]) => {
        console.debug('World Reload not yet implemented.')
        const world = await client.wait_for(() => client.world)
        world.clear(true)
        client.emit('world:clear', [])
    })

    /**
     * Reload world with new buffer.
     */
    client.raw.on('worldReloaded', async ([buffer]) => {
        const world = await client.wait_for(() => client.world)
        world.init(buffer)
    })
}
