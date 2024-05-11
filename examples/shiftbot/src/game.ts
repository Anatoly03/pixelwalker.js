
import Client, { Player, Util } from '../../../dist/index.js'

import { is_bot_admin } from './admin.js'
import { build_map, clear_map, close_door, create_win_zone, open_door, remove_spawn, set_spawn } from './map.js'

export function module(client: Client) {
    const gameRound = new Util.GameRound(client)

    let START_TIME = 0
    let ROUND = 0
    let PLAYER_QUEUE: Player[] = []
    let END_ROUND: ReturnType<typeof Util.Breakpoint>
    let SIGNUP_LOCK: ReturnType<typeof Util.Breakpoint>

    function accept_to_next_round([player, player_before]: [Player, Player | null]) {
        const TIME = (performance.now() - START_TIME) / 1000
        PLAYER_QUEUE.push(player)
        console.log(`${PLAYER_QUEUE.length}. ${TIME.toFixed(1)}s\t${player.username}`)
        END_ROUND.accept()
    }

    function disqualify(player: Player, code: 'left' | 'god' | 'kill') {
        PLAYER_QUEUE = PLAYER_QUEUE.filter(p => p.id != player.id)
    }

    gameRound.on('eliminate', disqualify)
    
    gameRound.setLoop(async () => {
        ROUND++
        PLAYER_QUEUE = []
    
        await clear_map()
    
        const SPAWNPOINTS = client.world?.list('spawn_point') || []
        await Promise.all([set_spawn(), ...SPAWNPOINTS?.map(p => client.block(p[0], p[1], p[2], 0))])
        await gameRound.signup()
        gameRound.forEachPlayer(p => p.reset())
        await client.wait(4000)
    
        await gameRound.signup()
        // TODO SIGNUP_LOCK
        // await SIGNUP_LOCK
        await Promise.all([remove_spawn(), ...SPAWNPOINTS?.map(p => client.block(p[0], p[1], p[2], 'spawn_point'))])
    
        const meta = await build_map()
        console.log(`Round ${ROUND} - ${meta.name}`)
        client.say(`[BOT] "${meta.name}" by ${meta.creator}`)
    
        await client.wait(2000)
    
        await open_door()
        START_TIME = performance.now()

        END_ROUND = Util.Breakpoint()
        END_ROUND.time(120 * 1000)

        client.on('player:crown', accept_to_next_round)

        await client.wait(3000)
        await create_win_zone()

        await END_ROUND.wait()
        await close_door()

        client.off('player:crown', accept_to_next_round)

        gameRound.setPlayers(PLAYER_QUEUE)

    })    

    client.on('cmd:start', ([player, _, name]) => {
        if (!is_bot_admin(player)) return
        gameRound.start()
    })

    client.on('cmd:last', ([player, _, name]) => {
        if (!is_bot_admin(player)) return
        gameRound.stop()
    })

    return client
}
