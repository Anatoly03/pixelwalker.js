
export const API_ACCOUNT_LINK = 'api.pixelwalker.net'
export const API_ROOM_LINK = 'game.pixelwalker.net'

export const enum HeaderTypes {
    String = 0,
    Byte = 1,
    Int16 = 2,
    Int32 = 3,
    Int64 = 4,
    Float = 5,
    Double = 6,
    Boolean = 7,
    ByteArray = 8
}

export const MessageType = {
    'init':             0,   // [0x6B, 0],
    'updateRights':     1,   // [0x6B, 1],
    'worldMetadata':    2,   // [0x6B, 2],
    'worldCleared':     3,   // [0x6B, 3],
    'chatMessage':      4,   // [0x6B, 4],
    'systemMessage':    5,   // [0x6B, 5],
    'playerJoined':     6,   // [0x6B, 6],
    'playerLeft':       7,   // [0x6B, 7],
    'playerMoved':      8,   // [0x6B, 8],
    'playerFace':       9,   // [0x6B, 9],
    'playerGodMode':    10,  // [0x6B, 10],
    'playerModMode':    11,  // [0x6B, 11],
    'playerCheckpoint': 12,  // [0x6B, 12],
    'playerRespawn':    13,  // [0x6B, 13],
    'placeBlock':       14,  // [0x6B, 14],
    'crownTouched':     15,  // [0x6B, 15],
    'keyPressed':       16,  // [0x6B, 16],

    'playerStatsChanged':       19,  // [0x6B, 19],
}

export const SpecialBlockData: {[keys: string]: HeaderTypes[]} = {
    'coin_gate':                [HeaderTypes.Int32],
    'blue_coin_gate':           [HeaderTypes.Int32],
    'coin_door':                [HeaderTypes.Int32],
    'blue_coin_door':           [HeaderTypes.Int32],
    
    'death_gate':               [HeaderTypes.Int32],
    'death_door':               [HeaderTypes.Int32],

    'portal':                   [HeaderTypes.Int32, HeaderTypes.Int32, HeaderTypes.Int32],
    'portal_invisible':         [HeaderTypes.Int32, HeaderTypes.Int32, HeaderTypes.Int32],

    'spikes':                   [HeaderTypes.Int32],

    'local_switch':             [HeaderTypes.Int32],
    'local_switch_activator':   [HeaderTypes.Int32, HeaderTypes.Boolean],
    'local_switch_resetter':    [HeaderTypes.Boolean],
    'local_switch_door':        [HeaderTypes.Int32],
    'local_switch_gate':        [HeaderTypes.Int32],

    'global_switch':            [HeaderTypes.Int32],
    'global_switch_activator':  [HeaderTypes.Int32, HeaderTypes.Boolean],
    'global_switch_resetter':   [HeaderTypes.Boolean],
    'global_switch_door':       [HeaderTypes.Int32],
    'global_switch_gate':       [HeaderTypes.Int32],
}
