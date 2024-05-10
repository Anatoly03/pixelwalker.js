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
    [key: `cmd:${string}`]: [[Player, ...string[]]]
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
    '*':                        [any[]],
    'init':                     [[number, string, string, number, boolean, number, number, boolean, boolean, string, number, string, Buffer, number, number, Buffer]],
    'updateRights':             [[boolean, boolean]],
    'worldMetadata':            [[string, number, string]],
    'worldCleared':             [[]],
    'worldReloaded':            [[Buffer]],
    'placeBlock':               [[number, number, number, 0 | 1, number, ...any]],
    'chatMessage':              [[number, string]],
    'systemMessage':            [[string, string, boolean]],
    'playerJoined':             [[number, string, string, number, boolean, boolean, boolean, number, number, number, number, number, boolean, boolean, boolean, Buffer]],
    'playerLeft':               [[number]],
    'playerMoved':              [[number, number, number, number, number, number, number, -1 | 0 | 1, -1 | 0 | 1, boolean, boolean, number]],
    'playerTeleported':         [[number, number, number]],
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
    'globalSwitchChange':       [[number, number, number]],
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
    'playerTeleported':         11,
    'playerFace':               12,
    'playerGodMode':            13,
    'playerModMode':            14,
    'playerCheckpoint':         15,
    'playerRespawn':            16,
    'playerReset':              17,
    'crownTouched':             18,
    'keyPressed':               19,
    'playerStatsChanged':       20,
    'playerWin':                21,
    'localSwitchChange':        22,
    'localSwitchReset':         23,
    'globalSwitchChange':       24,
    'globalSwitchReset':        25,
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
    'local_switch_activator':   [HeaderTypes.Int32, HeaderTypes.Byte],
    'local_switch_resetter':    [HeaderTypes.Byte],
    'local_switch_door':        [HeaderTypes.Int32],
    'local_switch_gate':        [HeaderTypes.Int32],

    'global_switch':            [HeaderTypes.Int32],
    'global_switch_activator':  [HeaderTypes.Int32, HeaderTypes.Byte],
    'global_switch_resetter':   [HeaderTypes.Byte],
    'global_switch_door':       [HeaderTypes.Int32],
    'global_switch_gate':       [HeaderTypes.Int32],
}

export type SystemMessageEvents = {
    'help': [[string]],
    'receivePm': [[string, string]],
    'sendPm': [[string, string]],
    'noPm': [[]],
    'playerMute': [[string]],
    'playerUnmute': [[string]],
    'alreadyGodMode': [[string]],
    'noMoreGodMode': [[string]],
    'givenGodMode': [[string]],
    'alreadyEdit': [[string]],
    'noMoreEdit': [[string]],
    'givenEdit': [[string]],
    'playerTeleported': [[string, number]],
    'multiplePlayersTeleported': [[number, number, number]],
    'playerNotTeleported': [[]],
    'noChangesToSave': [[]],
    'savingWorld': [[]],
    'worldSaved': [[]],
    'reloadingWorld': [[]],
    'worldReloaded': [[]],
    'worldCleared': [[]],
    'titleChanges': [[string]],
    'titleNotChanged': [[]],
    'worldVisibility': [['PUBLIC' | 'PRIVATE' | 'UNLISTED']],
    'onKick': [[string]],
    'onKickWithReason': [[string, string]],
    'onSelfKicked': [[string]],
    'playerNotFound': [[]],
    'cantMuteYourself': [[]],
}

export const SystemMessageFormat = {
    'help': ['* SYSTEM', 'Available commands:%s'],
    'receivePm': ['* %p > YOU', '%s'],
    'sendPm': [ '* YOU > %p', '%s' ],
    'noPm': ['* SYSTEM', 'You must specify a player and a message.'],
    'playerMute': ['* SYSTEM', '%p was muted.'],
    'playerUnmute': ['* SYSTEM', '%p was unmuted.'],
    'alreadyGodMode': ['* SYSTEM', '%p already has god mode rights.'],
    'noMoreGodMode': [ '* SYSTEM', "%p's god mode rights were taken away."],
    'givenGodMode': [ '* SYSTEM', '%p was given god mode rights.' ],
    'alreadyEdit': [ '* SYSTEM', '%p already has editing rights.' ],
    'noMoreEdit': [ '* SYSTEM', "%p's editing rights were taken away." ],
    'givenEdit': [ '* SYSTEM', '%p was given editing rights.' ],
    'playerTeleported': ['* SYSTEM', 'Teleported %p to %n, %n.'],
    'multiplePlayersTeleported': ['* SYSTEM', 'Teleported %n players to %n, %n.'],
    'playerNotTeleported': ['* SYSTEM', 'You need to specify a player to teleport and the coordinates.'],
    'noChangesToSave': ['* SYSTEM', 'There are no unsaved changes to save.'],
    'savingWorld': ['* SYSTEM', 'Saving world...'],
    'worldSaved': ['* SYSTEM', 'World saved!'],
    'reloadingWorld': ['* SYSTEM', 'Reloading world...'],
    'worldReloaded': ['* SYSTEM', 'World reloaded!'],
    'worldCleared': ['* SYSTEM', 'World cleared!'],
    'titleChanges': ['* SYSTEM', 'Title changed to "%s".'],
    'titleNotChanged': ['* SYSTEM', 'You must specify an alphanumeric title.'],
    'worldVisibility': ['* SYSTEM', 'World visibility set to %s.'],
    'onKick': [ '* SYSTEM', '%p was kicked.' ],
    'onKickWithReason': [ '* SYSTEM', '%p was kicked: %s' ],
    'onSelfKicked': [ 'You were kicked!', 'Reason: %s' ],
    'playerNotFound': [ '* SYSTEM', 'Player not found.' ],
    'cantMuteYourself': [ '* SYSTEM', "You can't mute yourself." ]
}
