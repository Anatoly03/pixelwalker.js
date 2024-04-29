import Block, { WorldPosition } from "../types/block"
import Player from "../types/player"

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

export interface LibraryEvents {
    'error': [[Error]]
    'close': [[number, string]]
    'start': [[Player]]
    'player:join': [[Player]]
    'player:leave': [[Player]]
    'chat': [[Player, string]]
    'cmd:': [[Player, ...any]] // This is mainly used for type hinting/ auto complete.
    [key: `cmd:${string}`]: [[Player, ...any]]
    'player:face': [[Player, number, number]]
    'player:god': [[Player]]
    'player:mod': [[Player]]
    'player:crown': [[Player, Player | null]]
    'player:coin': [[Player, number]]
    'player:coin:blue': [[Player, number]]
    'player:death': [[Player, number]]
    'player:block': [[Player, WorldPosition, Block]]
    'world:clear': [[]]
}

export interface RawGameEvents {
    'init':                     [[number, string, string, number, boolean, number, number, boolean, boolean, string, number, string, Uint8Array, number, number, Uint8Array]],
    'updateRights':             [[boolean, boolean]],
    'worldMetadata':            [[string, number, string]],
    'worldCleared':             [[]],
    'worldReloaded':            [[Uint8Array]],
    'placeBlock':               [[number, number, number, 0 | 1, number, ...any]],
    'chatMessage':              [[number, string]],
    'systemMessage':            [[string, string, boolean]],
    'playerJoined':             [[number, string, string, number, boolean, number, number, number, number, number, boolean, boolean, boolean, Uint8Array]],
    'playerLeft':               [[number]],
    'playerMoved':              [[number, number, number, number, number, number, number, -1 | 0 | 1, -1 | 0 | 1, boolean, boolean, number]],
    'playerFace':               [[number, number]],
    'playerGodMode':            [[number, boolean]],
    'playerModMode':            [[number, boolean]],
    'playerCheckpoint':         [[number, number]],
    'playerRespawn':            [[number, number, number]],
    'playerReset':              [[number, number, number]],
    'crownTouched':             [[number]],
    'keyPressed':               [[number]],
    'playerStatsChanged':       [[number, number, number, number]],
    'playerWin':                [[number]], // CURRENTLY NOT IMPLEMENTED IN THE GAME
    'localSwitchChange':        [[number, number, number]],
    'localSwitchReset':         [[number, number]],
    'globalSwitchChange':       [[number, number]],
    'globalSwitchReset':        [[number, number]],
}

export const MessageType = {
    'init':                     0,
    'updateRights':             1,
    'worldMetadata':            2,
    'worldCleared':             3,
    'worldReloaded':            4,
    'placeBlock':               5,
    'chatMessage':              6,
    'systemMessage':            7,
    'playerJoined':             8,
    'playerLeft':               9,
    'playerMoved':              10,
    'playerFace':               11,
    'playerGodMode':            12,
    'playerModMode':            13,
    'playerCheckpoint':         14,
    'playerRespawn':            15,
    'playerReset':              16,
    'crownTouched':             17,
    'keyPressed':               18,
    'playerStatsChanged':       19,
    'playerWin':                20,
    'localSwitchChange':        21,
    'localSwitchReset':         22,
    'globalSwitchChange':       23,
    'globalSwitchReset':        24,
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
