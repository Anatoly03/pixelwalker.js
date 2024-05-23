

import 'dotenv/config'
import Client, { Modules, Player } from '../../../dist/index.js'
import YAML from 'yaml'
import fs from 'fs'

const HISTORY_PATH = 'history.yaml'
let HISTORY = []

if (!fs.existsSync(HISTORY_PATH))
    fs.writeFileSync(HISTORY_PATH, YAML.stringify(HISTORY))

export function module (client: Client) {

    return client
}
