
import 'dotenv/config'
import Client from '../../../dist/index.js'

process.on('SIGINT', () => {
    process.on('SIGINT', () => {
        process.exit(1)
    })    
})

const client = new Client({ token: process.env.TOKEN })
export default client

import * as Map from './map.js'
import * as Game from './game.js'
import * as Ban from './bans.js'
import * as Players from './players.js'

client
    .on('player:join', ([p]) => p.god(true)) // Give everyone god mode
    .once('start', ([self]) => self.set_god(true)) // Self should not be part of players in game.
    .include(Map)
    .include(Game)
    .include(Players)
    .include(Ban)
    .connect(process.env.WORLD_ID)
