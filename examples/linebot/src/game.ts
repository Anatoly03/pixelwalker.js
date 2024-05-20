
import Client, { Player, SolidBlocks, Util } from '../../../dist/index.js'
import { create_empty_arena, advance_one_piece, plan_to_queue, set_max_size, reset_everything, JOINT, LEFT_JOINT, TOP_LEFT, WIDTH, HORIZONTAL_BORDER, PLATFORM_SIZE, set_speed, SPEED } from './map.js'
import { is_bot_admin } from './admin.js'

export let GAME_RUNNING = false
export let GAME_IS_STARTING = true
export let GAME_HALT_FLAG = false
let START_TIME = 0

let TILES = 0
let LINES = 0

export function module(client: Client) {
    const gameRound = new Util.GameRound(client)

    client.include(gameRound)

    let SIGNUP_LOCK: ReturnType<typeof Util.Breakpoint> | undefined

    function disqualify(player: Player, code: 'left' | 'god' | 'kill') {
        if (!GAME_RUNNING) return

        const SURVIVAL_TIME = Math.floor((performance.now() - START_TIME) / 100) / 10
        console.log(`${gameRound.players.length + 1}. ${player.username} (${SURVIVAL_TIME})`)
        player.pm(`[BOT ]${gameRound.players.length + 1}. ${SURVIVAL_TIME}s`)

        if (gameRound.players.length == 0) {
            client.say('[BOT] Game over!')
            GAME_IS_STARTING = true
            GAME_RUNNING = false
        }

        if (gameRound.players.length == 1) {
            client.say(`[BOT] ${gameRound.players[0].username} won!`)
            GAME_IS_STARTING = true
            GAME_RUNNING = false
        }

        gameRound.players = gameRound.players.filter(p => p.id != player.id)
    }

    gameRound.on('eliminate', disqualify)
    
    gameRound.setLoop(async () => {
        if (GAME_IS_STARTING) {
            GAME_RUNNING = false
            
            if (GAME_HALT_FLAG) {
                GAME_HALT_FLAG = false
                return gameRound.stop()
            }

            reset_everything()
            GAME_IS_STARTING = false
            const walkable_positions = await create_empty_arena(30)

            await client.wait(3000)

            // Try to sign up players
            await gameRound.signup()
            while (gameRound.players.length < 1) {
                console.log('Starting to wait...')
                SIGNUP_LOCK = Util.Breakpoint()
                await SIGNUP_LOCK.wait()
                await gameRound.signup()
            }

            gameRound.players
                .filter(p => Math.abs(p.y - JOINT.y) > 3 || p.x < LEFT_JOINT.x || p.x > JOINT.x)
                .forEach(p => {
                    const [x, y] = walkable_positions[Math.floor(Math.random() * walkable_positions.length)]
                    return p.teleport(x, y)
                })

            await client.wait(500)

            SIGNUP_LOCK = undefined
            console.log('Active in Round: ' + gameRound.players.map(p => p.username).join(' '))

            set_max_size(45)
            set_speed(300)
            TILES = 0
            LINES = 0

            START_TIME = performance.now()
            GAME_RUNNING = true

            plan_to_queue()
        }

        if (await advance_one_piece()) {
            plan_to_queue()
            TILES += 1
        }

        LINES += 1

        // TODO Adjust for great gameplay.

        if (LINES % 50 == 0 && PLATFORM_SIZE > 20) {
            set_max_size(PLATFORM_SIZE - 1)
        }

        if (LINES % 5 == 0 && SPEED >= 100) {
            set_speed(SPEED - 1)
        }

        if (TILES % 5 == 0 && SPEED >= 100) {
            set_speed(SPEED - 5)
        }

        console.log(PLATFORM_SIZE, ' size', SPEED, ' ms per line')
    })

    client.on('player:join', ([p]) => SIGNUP_LOCK?.accept())
    client.on('player:god', ([p]) => {if (!p.god_mode) SIGNUP_LOCK?.accept()})

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

    client.on('cmd:continue', ([player, _, name]) => {
        if (!is_bot_admin(player)) return
        gameRound.start()
    })

    client.on('player:move', ([player]) => {
        if (!gameRound.players.includes(player)) return
        if (player.x < TOP_LEFT.x + WIDTH - HORIZONTAL_BORDER + 5) return
        player.teleport(player.x - (WIDTH - 2 * HORIZONTAL_BORDER), player.y)
    })

    return client
}
