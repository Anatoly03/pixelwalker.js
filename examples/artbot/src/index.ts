
import 'dotenv/config'
import Client, { Modules } from '../../../dist/index.js'

process.on('SIGINT', () => {
    process.on('SIGINT', () => {
        process.exit(1)
    })    
})

const client = await Client.new({ token: process.env.TOKEN as string })
export default client

import * as Checkpoint from './checkpoint.js'
import * as Files from './files.js'
import * as Fill from './fill.js'
import * as History from './history.js'
import * as Settings from './settings.js'

// ANATOLY: you can place custom checkpoints in the world with !checkpoint
// GOSHA: select area with block (crown)
// GOSHA: all translation/rotation commands
// GOSHA: copy/paste rotate/mirror
// GOSHA: !sphere radius
// GOSHA: etc

client
    .on('player:join', ([p]) => p.god_rights(true)) // Give everyone god mode
    .once('start', ([self]) => self.set_god(true)) // Self should not be part of players in game.
    .on('player:join', ([player]) => console.log(`${player.username} joined: ${player.cuid}`))
    .include(Client.HelpCommand('help'))
    .include(Checkpoint)
    .include(Files)
    .include(Fill)
    .include(History)
    .include(Settings)
    .include(new Modules.BanModule('bans.yaml'))
    // .include(Modules.Debug(['*']))
    .connect(process.env.WORLD_ID as string)
