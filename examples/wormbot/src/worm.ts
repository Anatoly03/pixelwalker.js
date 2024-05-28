
import 'dotenv/config.js'
import Client, { Modules, Player } from '../../../dist/index.js'

process.on('SIGINT', () => {
    process.on('SIGINT', () => {
        process.exit(1)
    })    
})

const client = new Client({ token: process.env.TOKEN })
export default client

import * as Map from './map.js'
// import * as Game from './game.js'
import { StoredPlayer } from './storage.js'

export function is_bot_admin(player: Player) {
    return player.cuid == client.self?.cuid
}

client
    .on('player:join', ([p]) => p.god(true)) // Give everyone god mode
    .once('start', ([self]) => self.set_god(true)) // Self should not be part of players in game.
    .on('player:join', ([player]) => console.log(`@ ${player.username} → ${player.cuid}`))
    .setChatPrefix('[BOT]')
    .registerHelpCommand('help')
    .include(Map)
    // .include(Game)
    .include(Modules.BanModule('bans.yaml', is_bot_admin))
    .include(new Modules.StorageModule('players.yaml', StoredPlayer))
    .connect(process.env.WORLD_ID)
