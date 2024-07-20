
import 'dotenv/config'
import Client, { Player } from '../../../dist/index.js'
import { writeFileSync } from 'fs'

let success = false
const client = new Client({ token: process.env.TOKEN as string })
export default client

if (process.argv.length < 3) {
    console.warn(`Usage:
    npm run start "world id"`)
    process.exit(1)
}

function start([player]: [Player]) {
    if (!client.world) throw new Error('client.world was not loaded')
    writeFileSync('world.yaml', client.world.toString())
    console.log('Success')
    success = true
}

client
    .once('start', start)
    .once('close', () => {if (!success) throw new Error('Could not scan world. Is there a second instance of you already in the world?')})
    .on('chat', ([p, s]) => console.log(`${p}: ${s}`))
    .on('player:join', ([player]) => console.log(`${player.username} joined: ${player.cuid}`))
    .connect(process.argv[2] as string)
