
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

client
    .on('player:join', ([p]) => p.god(true))
    .include(Map)
    .include(Game)
    .include(Ban)
    .connect(process.env.WORLD_ID)
