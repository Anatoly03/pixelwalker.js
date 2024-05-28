
import Client, { Player, SolidBlocks, Structure, Util } from '../../../dist/index.js'

import { is_bot_admin } from './worm.js'
import { TOP_LEFT, build_map } from './map.js'
import { StoredPlayer } from './storage.js'

export function module(client: Client) {
    const gameRound = new Util.GameRound(client)
    
    client.include(gameRound)

    let STRUCTURE: Structure | undefined
    let WORMER = null
    let GAME_IS_STARTING = false
    let GAME_HALT_FLAG = false
    let START_TIME = 0
    let SIGNUP_LOCK: ReturnType<typeof Util.Breakpoint>
    let WORM = []

    function elect_bomber(player?: Player) {
        if (!player) player = gameRound.players[Math.floor(gameRound.players.length * Math.random())]
        if (!STRUCTURE) return
        const [[x, y]] = STRUCTURE.list('crown')
        return player.teleport(TOP_LEFT.x + x, TOP_LEFT.y + y)
    }

    function disqualify(player: Player, code: 'left' | 'god' | 'kill') {
        const wasActive = gameRound.players.findIndex(p => p.id == player.id) >= 0

        gameRound.players = gameRound.players.filter(p => p.id != player.id)

        if (!wasActive) return

        const TIME = (performance.now() - START_TIME) / 1000
        const user_data = StoredPlayer.players.byCuid(player.cuid) as StoredPlayer

        user_data.rounds = user_data.rounds + 1
        user_data.time = user_data.time + TIME
    }

    gameRound.on('eliminate', disqualify)
    
    gameRound.setLoop(async () => {    
        if (GAME_IS_STARTING) {
            WORM = []

            STRUCTURE = await build_map()
            const positions = STRUCTURE.list('gravity_dot', 'gravity_slow_dot')
            console.log(`Round Start - ${STRUCTURE.meta.name}`)

            await gameRound.signup()

            gameRound.players.forEach(p => {
                const [x, y] = positions[Math.floor(positions.length * Math.random())]
                p.teleport(TOP_LEFT.x + x, TOP_LEFT.y + y)
            })

            await client.wait(4000)

            // TODO SIGNUP_LOCK
            // await SIGNUP_LOCK

            console.log('Active in Round: ' + gameRound.players.map(p => p.username).join(' '))

            GAME_IS_STARTING = false
            START_TIME = performance.now()

            await elect_bomber()
        }
        
        await client.wait(200)
    })

    client.onCommand('start', is_bot_admin, () => {
        GAME_HALT_FLAG = false
        GAME_IS_STARTING = true
        gameRound.start()
    })

    // client.onCommand('continue', is_bot_admin, () => {
    //     END_ROUND.accept(PLAYER_QUEUE.length > 1)
    // })

    client.onCommand('halt', is_bot_admin, () => {
        gameRound.stop()
    })

    client.onCommand('last', is_bot_admin, () => {
        GAME_HALT_FLAG = true
    })

    return client
}
