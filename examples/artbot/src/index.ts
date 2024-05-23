
import 'dotenv/config'
import Client, { Modules } from '../../../dist/index.js'

process.on('SIGINT', () => {
    process.on('SIGINT', () => {
        process.exit(1)
    })    
})

const client = new Client({ token: process.env.TOKEN })
export default client

import * as Checkpoint from './checkpoint.js'
import * as History from './history.js'
import * as Settings from './settings.js'

client
    .on('player:join', ([p]) => p.god(true)) // Give everyone god mode
    .once('start', ([self]) => self.set_god(true)) // Self should not be part of players in game.
    .on('player:join', ([player]) => console.log(`${player.username} joined: ${player.cuid}`))
    .registerHelpCommand('help')
    .include(Checkpoint)
    .include(History)
    .include(Settings)
    .include(Modules.BanModule('bans.yaml'))
    // .include(Modules.Debug(['*']))
    .connect(process.env.WORLD_ID)
