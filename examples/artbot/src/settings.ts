
import 'dotenv/config'
import Client, { Modules, Player } from '../../../dist/index.js'
import client from './index.js'
import YAML from 'yaml'
import fs from 'fs'

const SETTINGS_PATH = 'settings.yaml'
let SETTINGS = {}

export const RULE = {
    EVERYONE_EDIT: 'everyone-edit',
    EVERYONE_GOD: 'everyone-god',
}

if (!fs.existsSync(SETTINGS_PATH))
    fs.writeFileSync(SETTINGS_PATH, YAML.stringify(SETTINGS))

export function Rule(key: string) {
    SETTINGS = YAML.parse(fs.readFileSync(SETTINGS_PATH).toString('ascii'))
    return SETTINGS[key]
}

function IS_ADMIN(p: Player) {
    return client.self?.cuid == p.cuid
}

export function module (client: Client) {
    client.onCommand('rule', IS_ADMIN, ([p, _, r, v]) => {
        let value: string | boolean | number = v, tmp: any

        if (v.toLowerCase() == 'true') value = true
        if (v.toLowerCase() == 'false') value = false
        if (!Number.isNaN(tmp = parseFloat(v))) value = tmp

        SETTINGS = YAML.parse(fs.readFileSync(SETTINGS_PATH).toString('ascii'))
        SETTINGS[r] = value
        fs.writeFileSync(SETTINGS_PATH, YAML.stringify(SETTINGS))
    })

    client.onCommand('rule', IS_ADMIN, ([p, _, r, v]) => {
        if (r != RULE.EVERYONE_EDIT) return

        let affected = client.players.none()
        if (v == 'true') affected = client.players.forEach(p => p.edit(true))
        else if (v == 'false') affected = client.players.filter(p => !IS_ADMIN(p)).forEach(p => p.edit(false))
        else return

        return `${v == 'true' ? 'Gave' : 'Removed'} edit rights ${v == 'true' ? 'to' : 'from'} ${affected.length} players.`
    })

    client.onCommand('rule', IS_ADMIN, ([p, _, r, v]) => {
        if (r != RULE.EVERYONE_GOD) return
        if (v == 'true') return client.players.forEach(p => p.god(true))
        if (v == 'false') return client.players.filter(p => !IS_ADMIN(p)).forEach(p => p.god(false))
    })

    client.on('player:join', ([p]) => {
        if (Rule(RULE.EVERYONE_EDIT))
            p.edit(true)
        if (Rule(RULE.EVERYONE_GOD))
            p.god(true)
    })

    return client
}