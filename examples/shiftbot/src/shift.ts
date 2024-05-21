
import 'dotenv/config'
import Client, { Modules, Player } from '../../../dist/index.js'

process.on('SIGINT', () => {
    process.on('SIGINT', () => {
        process.exit(1)
    })    
})

const client = new Client({ token: process.env.TOKEN })
export default client

import * as Map from './map.js'
import * as Game from './game.js'
import * as Players from './players.js'
import { is_bot_admin } from './admin.js'

// client.command('test', (p: Player) => { console.log('Player Check: ' + p.username); return true }, async (args) => {
//     console.log(args.slice(1))
// })

// client.command('test2', (p: Player) => { console.log('Player Check: ' + p.username); return false }, async (args) => {
//     console.log(args.slice(1))
// })

// client.command('test3', async (args) => {
//     console.log(args.slice(1))
//     return 'Hello, You!'
// })

client
    .on('player:join', ([p]) => p.god(true)) // Give everyone god mode
    .once('start', ([self]) => self.set_god(true)) // Self should not be part of players in game.
    .on('player:join', ([player]) => console.log(`@ ${player.username} → ${player.cuid}`))
    .include(Map)
    .include(Game)
    .include(Players)
    .include(Modules.BanModule('bans.yaml', is_bot_admin))
    .connect(process.env.WORLD_ID)
