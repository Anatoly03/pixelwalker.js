
import Client, { Player, SolidBlocks, Structure, Util } from '../../../dist/index.js'

import { is_bot_admin } from './worm.js'
import { TOP_LEFT, build_map, width, height } from './map.js'
import { StoredPlayer } from './storage.js'

export function module(client: Client) {
    const gameRound = new Util.GameRound(client)
    
    client.include(gameRound)

    let TICK = 0
    let STRUCTURE: Structure | undefined
    let WORMER = null
    let GAME_IS_STARTING = false
    let GAME_HALT_FLAG = false
    let START_TIME = 0
    let SIGNUP_LOCK: ReturnType<typeof Util.Breakpoint>
    let WORM: [number, number][] = []
    let WORM_DIRECTION: 0 | 1 | 2 | 3 = 0

    function elect_bomber(player?: Player) {
        if (!player) player = gameRound.players[Math.floor(gameRound.players.length * Math.random())]
        if (!STRUCTURE) return
        const [[x, y]] = STRUCTURE.list('crown')
        return player.teleport(TOP_LEFT.x + x, TOP_LEFT.y + y)
    }

    function push_worm(x?: number, y?: number) {
        const [CROWN_COORDINATE] = STRUCTURE?.list('crown') as [number, number, number][] || [10, 10]

        if (WORM.length == 0) {
            [x, y] = CROWN_COORDINATE
            y -= 2
        }

        if (x == undefined || y == undefined)
            [x, y] = WORM[WORM.length - 1]

        const dx = (WORM_DIRECTION / 2 - .5) * 2,
              dy = ((WORM_DIRECTION - 1) / 2 - .5) * 2

        if (WORM_DIRECTION % 2 == 0) y += dx
        if (WORM_DIRECTION % 2 == 1) x += dy

        if (x <= 0) x += width - 2
        if (y <= 0) y += height - 2
        if (x >= width) x -= width - 2
        if (y >= height) y -= height - 2

        WORM.push([x, y])

        if (x < 1 || y < 1 || x > width - 2 || y > height - 2) return Promise.resolve(true) // Outside
        if (Math.abs(CROWN_COORDINATE[0] - x) <= 1 && Math.abs(CROWN_COORDINATE[1] - y) <= 1) return Promise.resolve(true) // Crown Box

        return client.block(TOP_LEFT.x + x, TOP_LEFT.y + y, 1, 'basic_blue')
    }

    function pop_worm() {
        const w = WORM.shift() as [number, number]
        if (!w) return Promise.resolve(true)

        const [CROWN_COORDINATE] = STRUCTURE?.list('crown') as [number, number, number][] || [10, 10]
        const [x, y] = w

        if (x < 1 || y < 1 || x > width - 2 || y > height - 2) return Promise.resolve(true) // Outside
        if (Math.abs(CROWN_COORDINATE[0] - x) <= 1 && Math.abs(CROWN_COORDINATE[1] - y) <= 1) return Promise.resolve(true) // Crown Box

        return Promise.all([
            client.block(TOP_LEFT.x + x, TOP_LEFT.y + y, 1, 'gravity_dot'),
            client.block(TOP_LEFT.x + x, TOP_LEFT.y + y, 0, 0),
        ])
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
            TICK = 0

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

        const promises: Promise<any>[] = [push_worm()]
        if (WORM.length > 10) promises.push(pop_worm())
        await Promise.all(promises)

        // if (TICK % 15 == 0) WORM_DIRECTION = Math.floor(Math.random() * 4) as typeof WORM_DIRECTION
        if (TICK % 15 == 0) WORM_DIRECTION = (Math.abs(WORM_DIRECTION + [-1, 1][+(Math.random() > .5)])) % 4
        
        await client.wait(130)
        TICK += 1
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
