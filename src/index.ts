//
// Static Data & Variables retrieved from the server.
//

export { BlockMappings, BlockMappingsReverse } from './data/block-mappings.js';
export { default as MessageTypes } from './data/message-types.js';
export { default as PaletteFix } from './data/message-types.js';
export { default as RoomTypes } from './data/room-types.js';

// Client

export { default as default, default as PixelWalkerClient } from './protocol/client.js';
export { default as Connection } from './protocol/connection.js';

// Localhost Exports

export { default as LocalhostPixelWalkerClient } from './protocol/client.local.js';
