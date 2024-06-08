

import 'dotenv/config'
import Client, { Block, BlockMappings, Modules, Player, Structure } from '../../../dist/index.js'
import { RULE, Rule } from './settings.js'

export function module (client: Client) {
    client.onCommand('fill', p => p.cuid == client.self?.cuid, async ([p, _, block, x1, y1, x2, y2]) => {
        let xl = parseInt(x1),
            yu = parseInt(y1),
            xr = parseInt(x2),
            yd = parseInt(y2)

        if (!BlockMappings[block])
            return 'Could not find block!'
        if (!Number.isInteger(xl) || !Number.isInteger(yu) || !Number.isInteger(xr) || !Number.isInteger(yd))
            return "Expected Numbers!"

        const TLX = Math.min(xr, xl),
            TLY = Math.min(yu, yd),
            width = Math.abs(xl - xr) + 1,
            height = Math.abs(yu - yd) + 1

        const structure = new Structure(width, height)
        structure.clear(false)

        for (let x = 0; x < width; x++)
            for (let y = 0; y < height; y++) {
                structure.foreground[x][y] = new Block(block as keyof typeof BlockMappings)
            }

        await client.fill(TLX, TLY, structure)

        return `Filled ${width * height} blocks.`
    })

    return client
}
