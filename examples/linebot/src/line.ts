

import 'dotenv/config'
import Client, { Modules, Player } from '../../../dist/index.js'

process.on('SIGINT', () => {
    process.on('SIGINT', () => {
        process.exit(1)
    })
})

const client = new Client({ token: process.env.TOKEN as string })
export default client

import * as Map from './map.js'
import * as Game from './game.js'
import { StoredPlayer, StoredPlayerManager } from './storage.js'

export function is_bot_admin(player: Player) {
    return player.cuid == client.self?.cuid
}

export const storedPlayers = new StoredPlayerManager('players.yaml', StoredPlayer)

client.raw.on('*', ([ev, ...args]) => {
    if (ev === 'PlayerMoved') return;
    if (ev === 'PlayerGodMode') return;
    if (ev === 'PlayerTouchPlayer') return;
    // if (ev === 'WorldBlockPlaced') return;
    // console.log(ev, args);
})

client
    .on('player:join', ([p]) => p.god_rights(true)) // Give everyone god mode
    .once('start', ([self]) => self.set_god(true)) // Self should not be part of players in game.
    .on('player:join', ([player]) => console.log(`${player.username} joined: ${player.cuid}`))
    .include(Client.HelpCommand('help'))
    .include(Map)
    .include(Game)
    .include(new Modules.BanModule('bans.yaml', is_bot_admin))
    .include(storedPlayers)
    .connect(process.env.WORLD_ID as string)
