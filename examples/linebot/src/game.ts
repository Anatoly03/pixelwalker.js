
import Client, { Player, SolidBlocks, Util } from '../../../dist/index.js'
import { create_empty_arena, advance_one_piece, plan_to_queue, set_max_size, reset_everything, JOINT, LEFT_JOINT, TOP_LEFT, WIDTH, HORIZONTAL_BORDER, PLATFORM_SIZE, set_speed, SPEED } from './map.js'
import { is_bot_admin, storedPlayers } from './line.js'
import { StoredPlayer } from './storage.js'

const MINIMUM_PLAYERS = 3

export let GAME_SIGNUP = false
export let GAME_RUNNING = false
export let GAME_IS_STARTING = true
export let GAME_HALT_FLAG = false
export let GAME_IN_DEBUG = false

let START_TIME = 0
let PRACTICE_MODE = false

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
        player.pm(`[BOT] ${gameRound.players.length + 1}. ${SURVIVAL_TIME}s`)

        const user_data = storedPlayers.byCuid(player.cuid) as StoredPlayer
        user_data.rounds = user_data.rounds + 1
        user_data.time = user_data.time + SURVIVAL_TIME

        if (gameRound.players.length == 0) {
            // client.say('[BOT] Game over!')
            console.log('Game over!')
            GAME_IS_STARTING = true
            GAME_RUNNING = false
        }

        if (gameRound.players.length == 1) {
            const winner = gameRound.players[0]
            client.say(`[BOT] ${winner.username} won! Platform Time: ${SURVIVAL_TIME}s`)
            console.log(`1. ${player.username}`)
            gameRound.players[0].crown(true)
            GAME_IS_STARTING = true
            GAME_RUNNING = false

            const winner_data = storedPlayers.byCuid(winner.cuid) as StoredPlayer
            winner_data.wins = winner_data.wins + 1
            winner_data.rounds = winner_data.rounds + 1
            winner_data.time = winner_data.time + SURVIVAL_TIME
        }

        gameRound.players = gameRound.players.filter(p => p.id != player.id)
    }

    gameRound.on('eliminate', disqualify)
    
    gameRound.setLoop(async () => {
        if (GAME_IS_STARTING) {
            GAME_RUNNING = false
            GAME_SIGNUP = true
            
            if (GAME_HALT_FLAG) {
                GAME_HALT_FLAG = false
                return gameRound.stop()
            }

            GAME_IS_STARTING = false
            const walkable_positions = await create_empty_arena(30)

            reset_everything()
            plan_to_queue()
            if (GAME_IN_DEBUG) return

            await client.wait(3000)

            // Try to sign up players
            await gameRound.signup()
            while (gameRound.players.length < 1) {
                console.log('Starting to wait...')
                SIGNUP_LOCK = Util.Breakpoint()
                await SIGNUP_LOCK.wait()
                await gameRound.signup()
            }

            GAME_SIGNUP = false

            gameRound.players
                // Do not teleport players who are on the platform.
                .filter(p => Math.abs(p.y - (TOP_LEFT.y + JOINT.y)) > 3 || p.x < TOP_LEFT.x + LEFT_JOINT.x || p.x > TOP_LEFT.x + JOINT.x)
                .forEach(p => {
                    // console.log(`Teleport: ${p.x}, ${p.y}, Platform: Y = ${TOP_LEFT.y + JOINT.y}, LEFT X = ${TOP_LEFT.x + LEFT_JOINT.x}, RIGHT X = ${TOP_LEFT.x + JOINT.x}`)
                    const [x, y] = walkable_positions[Math.floor(Math.random() * walkable_positions.length)]
                    return p.teleport(x, y)
                })

            await client.wait(500)

            SIGNUP_LOCK = undefined

            if (gameRound.players.length == 0)
                return
            else if (gameRound.players.length < MINIMUM_PLAYERS)
                PRACTICE_MODE = true
            else
                PRACTICE_MODE = false

            console.log('Active in Round: ' + gameRound.players.map(p => p.username).join(' '))

            set_max_size(45)
            set_speed(300)
            
            TILES = 0
            LINES = 0

            START_TIME = performance.now()
            GAME_RUNNING = true

            // if (PRACTICE_MODE) {
            //     client.say(`Not enough players (${gameRound.players.length} of required ${MINIMUM_PLAYERS}). Practice Mode enabled. Data won't be saved.`)
            // }
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

        // console.log(PLATFORM_SIZE, ' size', SPEED, ' ms per line')
    })

    client.on('player:join', ([p]) => SIGNUP_LOCK?.accept())
    client.on('player:god', ([p]) => {if (!p.god_mode) SIGNUP_LOCK?.accept()})

    client.onCommand('start', is_bot_admin, ([player, _, name]) => {
        GAME_HALT_FLAG = false
        GAME_IS_STARTING = true
        gameRound.start()
    })

    client.onCommand('debug', is_bot_admin, ([player, _, name]) => {
        GAME_IN_DEBUG = !GAME_IN_DEBUG
        if (GAME_IN_DEBUG)
            gameRound.start()
        else
            gameRound.stop()
    })

    client.onCommand('last', is_bot_admin, ([player, _, name]) => {
        GAME_HALT_FLAG = true
    })

    client.onCommand('stop', is_bot_admin, ([player, _, name]) => {
        gameRound.stop()
    })

    client.onCommand('restart', is_bot_admin, ([player, _, name]) => {
        gameRound.stop()
        GAME_HALT_FLAG = false
        GAME_IS_STARTING = true
        gameRound.start()
    })

    client.onCommand('continue', is_bot_admin, ([player, _, name]) => {
        gameRound.start()
    })

    client.onCommand('speed', is_bot_admin, ([player, _, s]) => {
        set_speed(parseInt(s))
    })

    client.onCommand('size', is_bot_admin, ([player, _, s]) => {
        set_max_size(parseInt(s))
    })

    client.on('player:move', ([player]) => {
        if (!gameRound.players.includes(player) && !GAME_IN_DEBUG) return
        if (player.x < TOP_LEFT.x + WIDTH - HORIZONTAL_BORDER + 5 + (GAME_IN_DEBUG ? 5 : 0)) return
        player.teleport(player.x - (WIDTH - 2 * HORIZONTAL_BORDER), player.y)
    })

    return client
}
