import Scheduler from "./base";

import GameConnection from "../game.connection";
import { WorldBlockPlacedPacket } from "../network/pixelwalker_pb";

type Change = {
    x: number;
    y: number;
    layer: number;
    blockId: number;
    extraFields: Uint8Array;
};

export default class BlockScheduler extends Scheduler<Change> {
    override LOOP_FREQUENCY = 25;
    override ELEMENTS_PER_TICK = 200;
    override INBETWEEN_DELAY = 2;
    override RETRY_FREQUENCY = 500;
    public BLOCKS_PER_TICK = 400;

    constructor(connection: GameConnection) {
        super(connection);

        connection.listen("worldBlockPlacedPacket", ({ positions, layer, blockId, extraFields }) => {
            for (const { x, y } of positions) {
                this.receive(
                    this.createKey({
                        x,
                        y,
                        layer,
                        blockId,
                        extraFields,
                    })
                );
            }

            // this.receive(this.createKey(message));
        });
    }

    protected override createKey({ layer, x, y, blockId, extraFields }: Change): string {
        return `${layer}-${x}-${y}-${blockId}-${extraFields}`;
    }

    public override trySend({ blockId, layer, extraFields, x, y }: Change): void {
        const args: WorldBlockPlacedPacket = {
            $typeName: "WorldPackets.WorldBlockPlacedPacket",
            isFillOperation: false,
            blockId,
            layer,
            extraFields,
            positions: [
                {
                    $typeName: "WorldPackets.PointInteger",
                    x,
                    y,
                },
            ],
        };

        this.entries()
            .filter(([key, entry]) => {
                if (entry.value.blockId !== blockId || entry.value.layer !== layer) return false;
                if (entry.value.extraFields.length !== extraFields.length) return false;

                for (let i = 0; i < extraFields.length; i++) {
                    if (entry.value.extraFields[i] !== extraFields[i]) return false;
                }

                return true;
            })
            .slice(0, this.BLOCKS_PER_TICK)
            .forEach(([_, entry]) => {
                entry.ignoreThisLoop = true;
                args.positions.push({
                    $typeName: "WorldPackets.PointInteger",
                    x: entry.value.x,
                    y: entry.value.y,
                });
            });

        this.connection.send("worldBlockPlacedPacket", args);

        // console.log("trySend", message, this.createKey(message));

        // this.connection.send('worldBlockPlacedPacket', message);

        // {
        //     isFillOperation: false,
        //     extraFields: block.serialize_args(),
        //     positions: [{ $typeName: 'WorldPackets.PointInteger', x: x + xt, y:y + yt }],
        //     layer,
        //     blockId: blockId,
        // }
    }
}
