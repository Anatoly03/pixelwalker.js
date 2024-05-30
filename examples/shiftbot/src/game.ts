
import Client, { Player, SolidBlocks, Util } from '../../../dist/index.js'

import { is_bot_admin, storedPlayers } from './shift.js'
import { TOP_LEFT, build_map, clear_map, close_door, create_win_zone, height, open_door, remove_spawn, set_spawn, width } from './map.js'
import { StoredPlayer } from './storage.js'

export function module(client: Client) {
    const gameRound = new Util.GameRound(client)
    
    client.include(gameRound)

    let GAME_HALT_FLAG = false
    let START_TIME = 0
    let ROUND = 0
    let POSITION_CHECKED: Player[] = []
    let PLAYER_QUEUE: Player[] = []
    let END_ROUND: ReturnType<typeof Util.Breakpoint<boolean, string>>
    let SIGNUP_LOCK: ReturnType<typeof Util.Breakpoint>

    function accept_to_next_round([player, player_before]: [Player, Player | null]) {
        const isActive = gameRound.players.findIndex(p => p.id == player.id) >= 0
        const isActiveWinner = PLAYER_QUEUE.findIndex(p => p.id == player.id) >= 0

        if (!isActive || isActiveWinner) return

        if (POSITION_CHECKED.findIndex(v => player.id == v.id) == -1) {
            // We deal with someone who touched the crown despite "never" being in the game frame.
            return disqualify(player, 'invalid')
        }

        const TIME = (performance.now() - START_TIME) / 1000
        const TOO_FEW_PLAYERS_CONDITIONS = gameRound.players.length < 3
        const PLAYER_LIMIT_CONDITION = gameRound.players.length / 2 < PLAYER_QUEUE.length

        if (PLAYER_QUEUE.length == 0 && !TOO_FEW_PLAYERS_CONDITIONS) {
            const TIME_LEFT = 30
            client.say(`${player.username} finished! ${TIME_LEFT}s left!`)
            END_ROUND.time(TIME_LEFT * 1000, true)
        }

        const user_data = storedPlayers.byCuid(player.cuid) as StoredPlayer

        PLAYER_QUEUE.push(player)
        
        console.log(`${PLAYER_QUEUE.length}. ${TIME.toFixed(1)}s\t${player.username}`)
        player.pm(`${PLAYER_QUEUE.length}. ${TIME.toFixed(1)}s`)

        user_data.rounds = user_data.rounds + 1
        user_data.time = user_data.time + TIME

        if (PLAYER_QUEUE.length == 1)
            user_data.gold = user_data.gold + 1
        else if (PLAYER_QUEUE.length == 2)
            user_data.silver = user_data.silver + 1
        else if (PLAYER_QUEUE.length == 3)
            user_data.bronze = user_data.bronze + 1

        if (TOO_FEW_PLAYERS_CONDITIONS) {
            END_ROUND.accept(false)

            return client.say(`${player.username} won!`)
        }
        
        if (PLAYER_LIMIT_CONDITION)
            return END_ROUND.accept(true)
    }

    function disqualify(player: Player, code: 'left' | 'god' | 'kill' | 'invalid') {
        const wasActive = gameRound.players.findIndex(p => p.id == player.id) >= 0

        PLAYER_QUEUE = PLAYER_QUEUE.filter(p => p.id != player.id)
        gameRound.players = gameRound.players.filter(p => p.id != player.id)

        if (!wasActive) return

        const TIME = (performance.now() - START_TIME) / 1000
        const user_data = storedPlayers.byCuid(player.cuid) as StoredPlayer

        user_data.rounds = user_data.rounds + 1
        user_data.time = user_data.time + TIME

        if (code == 'invalid') {
            console.warn(`[!] ${player.username} disqualified due to never being in the game.`)
            player.pm('Disqualified: You were never in the playing field. Did you tab out while the game was running?')
        }

        if (gameRound.players.length == 0) {
            client.say('Game over!')
            return END_ROUND.accept(false)
        }

        if (gameRound.players.length == 1) {
            client.say(`${gameRound.players[0].username} won!`)

            user_data.gold = user_data.gold + 1

            return END_ROUND.accept(false)
        }

        if (gameRound.players.length / 2 < PLAYER_QUEUE.length) {
            return END_ROUND.accept(true)
        }
    }

    gameRound.on('eliminate', disqualify)
    
    gameRound.setLoop(async () => {
        ROUND++
        PLAYER_QUEUE = []
    
        await clear_map()
    
        if (ROUND == 1) {
            const SPAWNPOINTS = client.world?.list('spawn_point') || []
            await Promise.all([set_spawn(), ...SPAWNPOINTS?.map(p => client.block(p[0], p[1], p[2], 0))])
            await gameRound.signup()
            gameRound.players.forEach(p => p.reset())
            await client.wait(4000)
            await gameRound.signup()
            // TODO SIGNUP_LOCK
            // await SIGNUP_LOCK
            await Promise.all([remove_spawn(), ...SPAWNPOINTS?.map(p => client.block(p[0], p[1], p[2], 'spawn_point'))])

            gameRound.players.forEach(player => {
                const user_data = storedPlayers.byCuid(player.cuid) as StoredPlayer
                user_data.games = user_data.games + 1
            })

            console.log('Active in Round: ' + gameRound.players.map(p => p.username).join(' '))
        } else {
            await client.wait(4000)
        }

        // Rounds bump here?
    
        const meta = await build_map()
        console.log(`Round ${ROUND} - ${meta.name}`)
        client.say(`"${meta.name}" by ${meta.creator}`)
    
        await client.wait(2000)
        POSITION_CHECKED = []
    
        await open_door()
        START_TIME = performance.now()

        END_ROUND = Util.Breakpoint()
        END_ROUND.time(360 * 1000, true) // A total limit of 6 minutes per round

        client.on('player:crown', accept_to_next_round)

        await client.wait(3000)
        await create_win_zone()

        if (!await END_ROUND.wait() || PLAYER_QUEUE.length < 2) {
            ROUND = 0
            if (GAME_HALT_FLAG) {
                GAME_HALT_FLAG = false
                gameRound.stop()
            }
        }
        
        await close_door()
        client.off('player:crown', accept_to_next_round)

        gameRound.players = PLAYER_QUEUE
    })   
    
    client.on('player:move', ([p]) => {
        if (p.god_mode || p.mod_mode) return
        if (POSITION_CHECKED.findIndex(v => v.id == p.id) >= 0) return
        if (p.x < TOP_LEFT.x + 3 || p.y < TOP_LEFT.y + 3 || p.x > TOP_LEFT.x + width - 3 || p.y > TOP_LEFT.y + height - 4) return
        POSITION_CHECKED.push(p)
    })

    client.onCommand('start', is_bot_admin, () => {
        GAME_HALT_FLAG = false
        gameRound.start()
    })

    client.onCommand('continue', is_bot_admin, () => {
        END_ROUND.accept(PLAYER_QUEUE.length > 1)
    })

    client.onCommand('halt', is_bot_admin, () => {
        gameRound.stop()
    })

    client.onCommand('last', is_bot_admin, () => {
        GAME_HALT_FLAG = true
    })

    return client
}
