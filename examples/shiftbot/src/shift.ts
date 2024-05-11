

import 'dotenv/config'
import Client from '../../../dist/index.js'
import * as Map from './map.js'

const client = new Client({ token: process.env.TOKEN })

export default await client
    .on('player:join', ([p]) => p.god(true))
    .include(Map)
    .connect(process.env.WORLD_ID)

