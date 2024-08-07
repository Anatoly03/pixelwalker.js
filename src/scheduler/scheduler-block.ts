import Client from "../client.js"
import { HeaderTypes, SpecialBlockData } from "../data/consts.js"
import { Bit7, Boolean, Byte, Int32, Magic } from "../types/message-bytes.js"
import Block from "../types/block.js"
import BaseScheduler from "./base.js"

type BlockCoordinate = `${number}.${number}.${0|1}`

export default class BlockScheduler extends BaseScheduler<BlockCoordinate, Block> {
    override LOOP_FREQUENCY = 25
    override ELEMENTS_PER_TICK = 200
    override INBETWEEN_DELAY = 2
    override RETRY_FREQUENCY = 500

    constructor(client: Client) {
        super(client)

        client.raw.on('WorldBlockPlaced', ([_, x, y, layer, bid, ...data]) => {
            this.remove(`${x}.${y}.${layer}`)
        })

        // this.setMaxListeners(300 * 300 * 2) // max world width * world height * layers
    }

    protected async try_send(pos: `${number}.${number}.0` | `${number}.${number}.1`, block: Block): Promise<void> {
        const [x, y, layer] = pos.split('.').map(v => parseInt(v))

        const buffer: Buffer[] = [Magic(0x6B), Bit7(Client.MessageId('WorldBlockPlaced')), Int32(x), Int32(y), Int32(layer), Int32(block.id)]
        const arg_types: HeaderTypes[] = SpecialBlockData[block.name] || []

        for (let i = 0; i < arg_types.length; i++) {
            switch (arg_types[i]) {
                case HeaderTypes.Byte:
                    buffer.push(Byte(block.data[i]))
                // TODO other types
                case HeaderTypes.Int32:
                    buffer.push(Int32(block.data[i]))
                    break
                // TODO other types
                case HeaderTypes.Boolean:
                    buffer.push(Boolean(block.data[i]))
                    break
            }
        }

        return this.client.send(Buffer.concat(buffer))
    }
}