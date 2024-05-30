
import Client, { Player, SolidBlocks, Structure, Util, Modules, Block } from '../../../dist/index.js'

import { is_bot_admin, storedPlayers } from './worm.js'
import { TOP_LEFT, build_map, width, height } from './map.js'
import { StoredPlayer } from './storage.js'

export function module(client: Client) {
    const gameRound = new Util.GameRound(client)
    
    client.include(gameRound)

    let TICK = 0
    let STRUCTURE: Structure | undefined
    let WORMER: Player | undefined
    let GAME_IS_STARTING = false
    let GAME_IS_RUNNING = false
    let GAME_HALT_FLAG = false
    let START_TIME = 0
    let SIGNUP_LOCK: ReturnType<typeof Util.Breakpoint>
    let WORM: [number, number][] = []
    let WORM_DIRECTION: 0 | 1 | 2 | 3 = 0
    // let WORM_SPEED = 50
    // let WORM_LENGTH = 37
    let WORM_SPEED = 150
    let WORM_LENGTH = 10
    let OBSTACLE_BLOCKS = [
        new Block('gravity_up'),
        new Block('gravity_down'),
        new Block('gravity_left'),
        new Block('gravity_right'),
        new Block('gravity_slow_dot'),
        new Block('hazard_stripes'),
        new Block('dark_hazard_stripes'),
    ] 

    function elect_bomber(player?: Player) {
        const choices = gameRound.players.filter(p => !WORMER || WORMER.id != p.id)

        if (choices.length == 0) return // Unexpected

        player = player || choices[Math.floor(choices.length * Math.random())]

        if (WORMER) {
            // const positions = STRUCTURE?.list('gravity_dot', 'gravity_slow_dot') || []
            // const [x, y] = positions[Math.floor(positions.length * Math.random())]
            WORMER.teleport(Math.floor(player.x), Math.floor(player.y))
        }

        WORMER = player

        if (!STRUCTURE) return

        const [[x, y]] = STRUCTURE.list('crown')

        if (player) return player.teleport(TOP_LEFT.x + x, TOP_LEFT.y + y)
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
        if (x >= width - 1) x -= width - 2
        if (y >= height - 1) y -= height - 2

        WORM.push([x, y])

        if (x < 1 || y < 1 || x > width - 2 || y > height - 2) return Promise.resolve(true) // Outside
        if (Math.abs(CROWN_COORDINATE[0] - x) <= 1 && Math.abs(CROWN_COORDINATE[1] - y) <= 1) return Promise.resolve(true) // Crown Box

        return Promise.all([
            client.block(TOP_LEFT.x + x, TOP_LEFT.y + y, 1, 'spikes_center'),
            client.block(TOP_LEFT.x + x, TOP_LEFT.y + y, 0, 'basic_blue_bg'),
        ])
    }

    function pop_worm() {
        const w = WORM.shift() as [number, number]
        if (!w) return Promise.resolve(true)
        if (WORM.findIndex(([x, y]) => w[0] == x && w[1] == y) != -1) return Promise.resolve(true) // The Worm is very huge, it spans over the entire field and became a modulo.

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
        // const wasActive = gameRound.players.find(p => p.id == player.id) != undefined
        // gameRound.players = gameRound.players.filter(p => p.id != player.id)
        // if (!wasActive) return

        const TIME = (performance.now() - START_TIME) / 1000

        console.log(`${gameRound.players.length + 1}. ${player.username} ${TIME.toFixed(1)}s`)

        if (WORMER?.id == player.id) {
            elect_bomber()
        } else if (WORMER) {
            const wormerData = storedPlayers.byCuid(WORMER.cuid) as StoredPlayer
            wormerData.kills = wormerData.kills + 1
        }

        player.pm(`${gameRound.players.length + 1}. ${TIME.toFixed(1)}s`)

        const playerData = storedPlayers.byCuid(player.cuid) as StoredPlayer
        playerData.rounds = playerData.rounds + 1
        playerData.time = playerData.time + TIME

        // console.log(playerData)

        if (gameRound.players.length == 1) {
            const winner = gameRound.players[0]

            const winnerData = storedPlayers.byCuid(winner.cuid) as StoredPlayer
            winnerData.rounds = winnerData.rounds + 1
            winnerData.wins = winnerData.wins + 1
            winnerData.time = winnerData.time + TIME

            GAME_IS_STARTING = true
        } else if (gameRound.players.length == 0){
            GAME_IS_STARTING = true
        }
    }

    gameRound.on('eliminate', disqualify)
    
    gameRound.setLoop(async () => {
        const TIME = (performance.now() - START_TIME) / 1000

        if (GAME_IS_STARTING) {
            GAME_IS_RUNNING = false
            if (GAME_HALT_FLAG) return gameRound.stop()

            WORM = []
            TICK = 0

            WORM_SPEED = 150
            WORM_LENGTH = 10

            STRUCTURE = await build_map()
            const positions = STRUCTURE.list('gravity_dot', 'gravity_slow_dot')
            console.log(`Round Start - ${STRUCTURE.meta.name}`)

            await client.wait(2000)

            // Try to sign up players
            await gameRound.signup()
            while (gameRound.players.length < 1) {
                console.log('Starting to wait...')
                SIGNUP_LOCK = Util.Breakpoint()
                await SIGNUP_LOCK.wait()
                await gameRound.signup()
            }

            gameRound.players.forEach(p => {
                const [x, y] = positions[Math.floor(positions.length * Math.random())]
                p.teleport(TOP_LEFT.x + x, TOP_LEFT.y + y)
            })

            await client.wait(2000)

            console.log('Active in Round: ' + gameRound.players.map(p => p.username).join(' '))

            GAME_IS_STARTING = false
            START_TIME = performance.now()

            await elect_bomber()
            GAME_IS_RUNNING = true
        }

        if (TIME >= 300) {
            gameRound.players.forEach(pl => {
                const player = storedPlayers.byCuid(pl.cuid) as StoredPlayer
                player.wins = player.wins + 1
                player.rounds = player.rounds + 1
                player.time = player.time + 300
            })
            GAME_IS_STARTING = true
            return
        }

        const promises: Promise<any>[] = [push_worm()]
        if (WORM.length > WORM_LENGTH) promises.push(pop_worm())
        await Promise.all(promises)

        // if (TICK % 15 == 0) WORM_DIRECTION = Math.floor(Math.random() * 4) as typeof WORM_DIRECTION
        // if (TICK % 15 == 0) WORM_DIRECTION = (Math.abs(WORM_DIRECTION + [-1, 1][+(Math.random() > .5)])) % 4

        if (TICK % 100 == 99) elect_bomber()
        if (WORM_SPEED > 25 && TICK % 2 == 0) WORM_SPEED --
        if (TICK % 25 == 0) WORM_LENGTH ++

        if (TICK % 2 == 0) {
            await (() => {
                const x = Math.floor(Math.random() * (width - 2)) + 1,
                    y = Math.floor(Math.random() * (height - 2)) + 1,
                    [CROWN_COORDINATE] = STRUCTURE?.list('crown') as [number, number, number][] || [10, 10],
                    block = OBSTACLE_BLOCKS[Math.floor(OBSTACLE_BLOCKS.length * Math.random())]

                if (gameRound.players.some(v => (v.x - (TOP_LEFT.x + x)) ** 2 + (v.y - (TOP_LEFT.y + y)) ** 2 < 6 ** 2)) return

                if (Math.abs(CROWN_COORDINATE[0] - x) <= 1 && Math.abs(CROWN_COORDINATE[1] - y) <= 1) return

                return client.block(TOP_LEFT.x + x, TOP_LEFT.y + y, 1, block)
            })()
        }
        
        await client.wait(WORM_SPEED)

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
        GAME_IS_RUNNING = false
        gameRound.stop()
    })

    client.onCommand('*elect', is_bot_admin, () => {
        elect_bomber()
    })

    client.onCommand('last', is_bot_admin, () => {
        GAME_HALT_FLAG = true
    })

    client.include(Modules.PlayerKeyManager(event =>
        event.on('left:down', player => {
            if (!WORMER || WORMER?.id != player.id) return
            WORM_DIRECTION = 1
        })
        .on('up:down', player => {
            if (!WORMER || WORMER?.id != player.id) return
            WORM_DIRECTION = 0
        })
        .on('right:down', player => {
            if (!WORMER || WORMER?.id != player.id) return
            WORM_DIRECTION = 3
        })
        .on('down:down', player => {
            if (!WORMER || WORMER?.id != player.id) return
            WORM_DIRECTION = 2
        })
    ))

    client.on('player:god', () => SIGNUP_LOCK?.accept(true))
    client.on('player:join', () => SIGNUP_LOCK?.accept(true))

    client.on('player:join', ([p]) => {
        if (GAME_IS_RUNNING) p.pm(`Game with ${gameRound.players.length} currently running. Please wait a moment.`)
    })

    return client
}
