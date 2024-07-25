
import 'dotenv/config'
import Client, { Modules } from '../../../dist/index.js'

process.on('SIGINT', () => {
    process.on('SIGINT', () => {
        process.exit(1)
    })    
})

const client = await Client.new({ token: process.env.TOKEN as string })
export default client

import * as MineSweeper from './minesweeper.js'

client
    .on('player:join', ([p]) => p.god_rights(true)) // Give everyone god mode
    .include(Client.HelpCommand('help'))
    .include(MineSweeper)
    .connect(process.env.WORLD_ID as string)
