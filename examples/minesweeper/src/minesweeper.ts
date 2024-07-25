

import 'dotenv/config'
import Client, { Block, BlockMappings, Structure } from '../../../dist/index.js'

export let Mines: boolean[][] = []
export let Numbers: number[][] = []
export let Eliminated: string[]

function Bomb(x : number, y : number, w : number, h : number) {
    const cx = Math.floor(w / 2),
        cy = Math.floor(h / 2)
    
    if ((x - cx) ** 2 + (y - cy) ** 2 < 4 ** 2) return false
    return Math.random() < (10 / 64)
}

async function StartGame(client: Client) {
    Eliminated = []

    client.say(`/takeedit @a[id!=${client.self?.id??0}]`)
    client.say('/givegod @a')

    let totalBombs = 0
    Mines = client.world!.background.map((e, x) => e.map((b, y) => Bomb(x, y, client.world!.width, client.world!.height) && ++totalBombs > 0))
    Numbers = client.world!.background.map(e => e.map(b => 0))
    Mines.forEach((a, x) => a.forEach((b, y) => {
        const NEARBY = [
            x > 0 && y > 0 && Mines[x - 1][y - 1], // Top Left
            y > 0 && Mines[x][y - 1], // Top
            x < Mines.length - 1 && y > 0 && Mines[x + 1][y - 1], // Top Right
            x > 0 && Mines[x - 1][y], // Center Left
            x < Mines.length - 1 && Mines[x + 1][y], // Center Right
            x > 0 && y < Mines[x].length - 1 && Mines[x - 1][y + 1], // Bottom Left
            y < Mines[x].length - 1 && Mines[x][y + 1], // Bottom
            x < Mines.length - 1 && y < Mines[x].length - 1 && Mines[x + 1][y + 1], // Bottom Right
        ]

        const count = NEARBY.filter(a => a).length
        Numbers[x][y] = count
        
        client.block(x, y, 1, 'generic_black_transparent')
        // if (x < 0 || y < 0 || x > 99 || y > 99) console.log(x, y)
    }))
    
    await client.wait(200)
    console.log('Waiting for the queue to be emptied!')

    await client.wait_block_queue()

    await client.block(Math.floor(client.world!.width / 2), Math.floor(client.world!.height / 2), 1, 'gravity_slow_dot')
    await client.wait(500)
    await client.block(Math.floor(client.world!.width / 2), Math.floor(client.world!.height / 2), 1, 'tool_spawn_lobby')
    client.say('/giveedit @a')
    client.say(`There are a total of ${totalBombs} bombs this round.`)
}

export function module (client: Client) {
    client.on('start', () => {
        console.log('Starting...')
        StartGame(client)
    })

    client.on('player:join', ([player]) => {
        if (!Eliminated.includes(player.cuid)) player.edit_rights(true)
    })

    client.onCommand('colors', () => {
        return 'Industrial = 0, Neon -> Cyan - 1, Green - 2, Yellow - 3, Orange - 4, Magenta - 5, Canvas Red - 6, Lava Light - 7, Lava Dark - 8'
    })

    client.on('player:block', ([player, [x, y, l], block]) => {
        if (player.id === client.self!.id && block.name !== 'gravity_slow_dot') return

        let background = 'basic_black_bg'

        switch (Numbers[x][y]) {
            case 0: background = 'industrial_plate_gray_plain_bg'; break
            case 1: background = 'neon_cyan_bg'; break
            case 2: background = 'neon_green_bg'; break
            case 3: background = 'neon_yellow_bg'; break
            case 4: background = 'neon_orange_bg'; break
            case 5: background = 'neon_magenta_bg'; break
            case 6: background = 'canvas_red_bg'; break
            case 7: background = 'lava_orange_bg'; break
            case 8: background = 'lava_dark_red_bg'; break
        }

        if ((block.id !== 0 && block.name !== 'gravity_slow_dot') || l !== 1) return

        client.block(x, y, 0, Mines[x][y] ? 'pirate_skeleton_flag_bg' : background as any)
        client.block(x, y, 1, 'gravity_slow_dot')

        if (Mines[x][y] && player.id !== client.self!.id) {
            Eliminated.push(player.cuid)

            client.say(`${player.username} died! Shame! At ${x} ${y}`)
            player.edit_rights(false)
            player.god_rights(true)
            player.reset()
            // player.kick('You stepped on a mine.')
            // client.say('/forgive ' + player.username)

            if (client.players.filter(p => p.can_edit && player.id !== client.self!.id).length == 0) {
                client.say('Everybody dead. Game ends.')
                setTimeout(() => StartGame(client), 10000)
            }
        }

        if (Numbers[x][y] !== 0) return

        x > 0 && y > 0 && client.world!.foreground[x - 1][y - 1].id !== 0 && client.block(x - 1, y - 1, 1, 'gravity_slow_dot')
        y > 0 && client.world!.foreground[x][y - 1].id !== 0 && client.block(x, y - 1, 1, 'gravity_slow_dot')
        x < Mines.length - 1 && y > 0 && client.world!.foreground[x + 1][y - 1].id !== 0 && client.block(x + 1, y - 1, 1, 'gravity_slow_dot')
        x > 0 && client.world!.foreground[x - 1][y].id !== 0 && client.block(x - 1, y, 1, 'gravity_slow_dot')
        x < Mines.length - 1 && client.world!.foreground[x + 1][y].id !== 0 && client.block(x + 1, y, 1, 'gravity_slow_dot')
        x > 0 && y < Mines[x].length - 1 && client.world!.foreground[x - 1][y + 1].id !== 0 && client.block(x - 1, y + 1, 1, 'gravity_slow_dot')
        y < Mines[x].length - 1 && client.world!.foreground[x][y + 1].id !== 0 && client.block(x, y + 1, 1, 'gravity_slow_dot')
        x < Mines.length - 1 && y < Mines[x].length - 1 && client.world!.foreground[x + 1][y + 1].id !== 0 && client.block(x + 1, y + 1, 1, 'gravity_slow_dot')
        
        // x > 0 && y > 0 && client.world!.foreground[x - 1][y - 1].id !== 0 && client.block(x - 1, y - 1, 1, 'gravity_slow_dot')
        // y > 0 && client.world!.foreground[x][y - 1].id !== 0 && client.block(x, y - 1, 1, 'gravity_slow_dot')
        // x < Mines.length - 1 && y > 0 && client.world!.foreground[x + 1][y - 1].id !== 0 && client.block(x + 1, y - 1, 1, 'gravity_slow_dot')
        // x > 0 && client.world!.foreground[x - 1][y].id !== 0 && client.block(x - 1, y, 1, 'gravity_slow_dot')
        // x < Mines.length - 1 && client.world!.foreground[x + 1][y].id !== 0 && client.block(x + 1, y, 1, 'gravity_slow_dot')
        // x > 0 && y < Mines[x].length - 1 && client.world!.foreground[x - 1][y + 1].id !== 0 && client.block(x - 1, y + 1, 1, 'gravity_slow_dot')
        // y < Mines[x].length - 1 && client.world!.foreground[x][y + 1].id !== 0 && client.block(x, y + 1, 1, 'gravity_slow_dot')
        // x < Mines.length - 1 && y < Mines[x].length - 1 && client.world!.foreground[x + 1][y + 1].id !== 0 && client.block(x + 1, y + 1, 1, 'gravity_slow_dot')
    })

    return client
}
