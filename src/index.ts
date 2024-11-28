// Static Data & Variables retrieved from the server.

import BufferReader from "./util/buffer-reader.js";

export * as Protocol from "./network/pixelwalker_pb.js";

export const Type = {
    String: BufferReader.String,
    Byte: BufferReader.Byte,
    Int16: BufferReader.Int16,
    Int32: BufferReader.Int32,
    Int64: BufferReader.Int64,
    Float: BufferReader.Float,
    Double: BufferReader.Double,
    Boolean: BufferReader.Boolean,
    ByteArray: BufferReader.ByteArray,
}

export { default as LobbyClient, default as PixelWalkerClient } from "./lobby.js";
export { default as GameConnection } from "./game.connection.js";
export { default as GameClient } from "./game.js";

// export { default as PlayerMap } from "./players/map.js";

export { default as Block } from "./world/block.js";
export { default as Layer } from "./world/layer.js";
export { default as Structure } from "./world/structure.js";
// export { default as World } from "./world/world.js";

// export { default as Chat } from "./chat/chat.js";
