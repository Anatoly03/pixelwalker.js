import * as Protocol from "../protocol/world_pb.js";

/**
 * A player id as defined with received data.
 *
 * @since 1.4.1
 */
export type GamePlayer = {
    properties: Protocol.PlayerProperties;
    state?: Protocol.PlayerWorldState;
    movement?: Protocol.PlayerMovedPacket;
};

export default GamePlayer;
