import { Client, Player } from "../../../dist"
import fs from 'node:fs'
import YAML from 'yaml'

const PATH = 'players.yaml'

type PlayerEntry = {
    readonly username: string,
    wins: [number, number, number],
    rounds: number,
    time: number
}

let SAVED_PLAYERS: {[keys: string]: PlayerEntry} = load()

function save() {
    fs.writeFileSync(PATH, YAML.stringify(SAVED_PLAYERS))
}

function load() {
    if (!fs.existsSync(PATH)) return {}
    return SAVED_PLAYERS = YAML.parse(fs.readFileSync(PATH).toString('ascii'))
}

export function getPlayerEntry(cuid: string) {
    return {
        get cuid() { return cuid },
        get username() { return SAVED_PLAYERS[cuid].username },
        get gold() { return SAVED_PLAYERS[cuid].wins[0] },
        get silver() { return SAVED_PLAYERS[cuid].wins[1] },
        get bronze() { return SAVED_PLAYERS[cuid].wins[2] },
        get rounds() { return SAVED_PLAYERS[cuid].rounds },
        get time() { return SAVED_PLAYERS[cuid].time },
        
        set gold(v) { SAVED_PLAYERS[cuid].wins[0] = v; save() },
        set silver(v) { SAVED_PLAYERS[cuid].wins[1] = v; save() },
        set bronze(v) { SAVED_PLAYERS[cuid].wins[2] = v; save() },
        set rounds(v) { SAVED_PLAYERS[cuid].rounds = v; save() },
        set time(v) { SAVED_PLAYERS[cuid].time = v; save() },
    }
}

export function module(client: Client) {
    client.on('player:join', ([{cuid, username}]) => {
        if (SAVED_PLAYERS[cuid]) return
        SAVED_PLAYERS[cuid] = {
            username,
            wins: [0, 0, 0],
            rounds: 0,
            time: 0
        }
        save()
    })

    client.on('cmd:wins', ([p]) => {
        const data = getPlayerEntry(p.cuid)
        p.pm(`[BOT] Your medals: Gold ${data.gold}, Silver ${data.silver}, Bronze ${data.bronze}`)
    })

    client.on('cmd:rounds', ([p]) => {
        const data = getPlayerEntry(p.cuid)
        p.pm(`[BOT] Rounds: ${data.rounds}`)
    })

    client.on('cmd:time', ([p]) => {
        const data = getPlayerEntry(p.cuid)
        p.pm(`[BOT] Total Time in Game: ${data.time}s`)
    })

    return client
}
