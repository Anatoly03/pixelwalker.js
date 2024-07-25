

import 'dotenv/config'
import Client, { Block, BlockMappings, Structure } from '../../../dist/index.js'
import { RULE, Rule } from './settings.js'
import fs from 'node:fs'

export function module (client: Client) {
    client.onCommand('ls', p => p.cuid == client.self?.cuid, async ([p, _, file]) => {
        if (!fs.existsSync(file)) return 'File does not exist.'
        if (!fs.statSync(file).isDirectory()) return 'File is not a directory.'
        return fs.readdirSync(file).join()
    })

    client.onCommand('readfile', p => p.cuid == client.self?.cuid, async ([p, _, file, x, y]) => {
        const xu = parseInt(x),
            yu = parseInt(y)

        if (!fs.existsSync(file)) return 'File does not exist.'
        if (!Number.isInteger(xu) || !Number.isInteger(xu)) return "Expected Numbers!"

        const structure = Structure.fromString(fs.readFileSync(file).toString('ascii'))

        await client.fill(xu, xu, structure)

        return `Filled ${structure.width * structure.height} blocks.`
    })

    return client
}
