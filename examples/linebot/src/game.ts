
import Client, { Player, SolidBlocks, Util } from '../../../dist/index.js'
import { create_empty_arena, build_platform, advance_one_piece, plan_to_queue } from './map.js'
import { is_bot_admin } from './admin.js'

export function module(client: Client) {
    const gameRound = new Util.GameRound(client)

    client.include(gameRound)

    let GAME_IS_STARTING = true
    let GAME_HALT_FLAG = false
    let START_TIME = 0
    let PLAYER_QUEUE: Player[] = []

    let END_ROUND: ReturnType<typeof Util.Breakpoint<boolean, string>>
    let SIGNUP_LOCK: ReturnType<typeof Util.Breakpoint>

    function disqualify(player: Player, code: 'left' | 'god' | 'kill') {
        const wasActive = gameRound.players.findIndex(p => p.id == player.id) >= 0

        PLAYER_QUEUE = PLAYER_QUEUE.filter(p => p.id != player.id)
        gameRound.players = gameRound.players.filter(p => p.id != player.id)

        if (!wasActive) return

        if (gameRound.players.length == 0) {
            client.say('[BOT] Game over!')
            return END_ROUND.accept(false)
        }

        if (gameRound.players.length == 1) {
            client.say(`[BOT] ${gameRound.players[0].username} won!`)
            return END_ROUND.accept(false)
        }

        if (gameRound.players.length / 2 < PLAYER_QUEUE.length) {
            return END_ROUND.accept(true)
        }
    }

    gameRound.on('eliminate', disqualify)
    
    gameRound.setLoop(async () => {
        if (GAME_IS_STARTING) {
            GAME_IS_STARTING = false
            await create_empty_arena()
            const walkable_positions = await build_platform(30)
            await gameRound.signup()
            // TODO SIGNUP_LOCK
            // await SIGNUP_LOCK
            gameRound.players.forEach(p => {const [x, y] = walkable_positions[Math.floor(Math.random() * walkable_positions.length)]; return p.teleport(x, y)})

            for (let i = 0; i < 10; i++) plan_to_queue()
        }

        plan_to_queue()
        await advance_one_piece()
    })

    client.on('cmd:start', ([player, _, name]) => {
        if (!is_bot_admin(player)) return
        GAME_HALT_FLAG = false
        GAME_IS_STARTING = true
        gameRound.start()
    })

    client.on('cmd:last', ([player, _, name]) => {
        if (!is_bot_admin(player)) return
        GAME_HALT_FLAG = true
    })

    client.on('cmd:stop', ([player, _, name]) => {
        if (!is_bot_admin(player)) return
        gameRound.stop()
    })

    return client
}
