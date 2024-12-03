import Scheduler from "./base";

import GameConnection from "../game.connection";
import { WorldBlockPlacedPacket } from "../network/pixelwalker_pb";

export default class BlockScheduler extends Scheduler<WorldBlockPlacedPacket> {
    override LOOP_FREQUENCY = 25
    override ELEMENTS_PER_TICK = 200
    override INBETWEEN_DELAY = 2
    override RETRY_FREQUENCY = 500
    
    constructor(connection: GameConnection) {
        super(connection);
        
        connection.listen('worldBlockPlacedPacket', message => {
            this.receive(this.createKey(message));
        })
    }
    
    protected createKey({ layer, positions, blockId }: WorldBlockPlacedPacket): string {
        const { x, y } = positions[0];
        return `${layer}-${x}-${y}-${blockId}`
    }

    public override trySend(message: WorldBlockPlacedPacket): void {
        this.connection.send('worldBlockPlacedPacket', message);

        // {
        //     isFillOperation: false,
        //     extraFields: block.serialize_args(),
        //     positions: [{ $typeName: 'WorldPackets.PointInteger', x: x + xt, y:y + yt }],
        //     layer,
        //     blockId: blockId,
        // }
    }
}