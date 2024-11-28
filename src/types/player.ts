import * as Protocol from "../network/pixelwalker_pb.js";

/**
 * A player id as defined per
 */
export type Player = {
    properties: Protocol.PlayerProperties;
    state: Protocol.PlayerWorldState;
    movement?: Protocol.PlayerMovedPacket;
};

export default Player;
