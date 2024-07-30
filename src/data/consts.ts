import Block from "../types/world/block/block.js"
import Player from "../types/player/player.js"
import SelfPlayer from "../types/player/self.js"
import { MessageTypes } from "./message_types.js"
import { WorldPosition } from "../types/index.js"
import { TeamId } from "../types/events.js"

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
    'start': [[SelfPlayer]]
    'player:join': [[Player]]
    'player:leave': [[Player]]
    'chat': [[Player, string]]
    'chat:pm': [[Player, string]]
    [key: `cmd:${string}`]: [[Player, ...string[]]]
    'player:face': [[Player, number, number]]
    'player:god': [[Player]]
    'player:mod': [[Player]]
    'player:crown': [[Player, Player | null]]
    'player:win': [[Player]]
    'player:checkpoint': [[Player, [number, number], [number, number] | null]]
    'player:coin': [[Player, number]]
    'player:coin:blue': [[Player, number]]
    'player:death': [[Player, number]]
    'player:block': [[Player, WorldPosition, Block]]
    'player:move': [[Player]]
    'player:respawn': [[Player]]
    'player:reset': [[Player]]
    'world:clear': [[]]
    'world:key': [[Player, string]]
}

export interface RawGameEvents {
    '*':                        [[((typeof MessageTypes)[number]), ...any[]]],
    'PlayerInit':               [[number, string, string, number, boolean, number, number, number, boolean, boolean, string, number, string, Buffer, number, number, Buffer]],
    'UpdateRights':             [[number, boolean, boolean]],
    'WorldMetadata':            [[string, number, string]],
    'WorldCleared':             [],
    'WorldReloaded':            [[Buffer]],
    'WorldBlockPlaced':         [[number, Buffer, 0 | 1, number, ...any]],
    'ChatMessage':              [[number, string]],
    'OldChatMessages':          any[],
    'SystemMessage':            [[string, string, boolean]],
    'PlayerJoined':             [[number, string, string, number, boolean, boolean, boolean, number, number, number, number, number, number, Uint8Array, boolean, boolean, boolean, boolean, TeamId, Buffer]],
    'PlayerLeft':               [[number]],
    'PlayerMoved':              [[number, number, number, number, number, number, number, -1 | 0 | 1, -1 | 0 | 1, boolean, boolean, number]],
    'PlayerTeleported':         [[number, number, number]],
    'PlayerFace':               [[number, number]],
    'PlayerGodMode':            [[number, boolean]],
    'PlayerModMode':            [[number, boolean]],
    'PlayerRespawn':            [[number, number, number]],
    'PlayerReset':              [[number, number, number]],
    'PlayerTouchBlock':         [[number, number, number, number]],
    'PlayerTouchPlayer':        [[number, number, 0 | 1]],
    'PlayerEffect':             any[],
    'PlayerRemoveEffect':       [[number, number]], 
    'PlayerResetEffects':       [[number]],
    'PlayerTeam':               [[number, number]],
    'PlayerCounters':           [number[]],
    'PlayerLocalSwitchChanged': [[number, number, number]],
    'PlayerLocalSwitchReset':   [[number, number]],
    'GlobalSwitchChanged':      [[number, number, number]],
    'GlobalSwitchReset':        [[number, number]],
    'PlayerPrivateMessage':     [[number, string]],
}

export const SpecialBlockData: {[keys: string]: HeaderTypes[]} = {
    'coin_gold_gate':           [HeaderTypes.Int32],
    'coin_blue_gate':           [HeaderTypes.Int32],
    'coin_gold_door':           [HeaderTypes.Int32],
    'coin_blue_door':           [HeaderTypes.Int32],
    
    'hazard_death_gate':        [HeaderTypes.Int32],
    'hazard_death_door':        [HeaderTypes.Int32],

    'portal':                   [HeaderTypes.Int32, HeaderTypes.Int32, HeaderTypes.Int32],
    'portal_invisible':         [HeaderTypes.Int32, HeaderTypes.Int32, HeaderTypes.Int32],
    'portal_world':             [HeaderTypes.String],
    
    'spikes':                   [HeaderTypes.Int32],
    
    'sign_normal':              [HeaderTypes.String],
    'sign_red':                 [HeaderTypes.String],
    'sign_green':               [HeaderTypes.String],
    'sign_blue':                [HeaderTypes.String],
    'sign_gold':                [HeaderTypes.String],

    'effects_jump_height':      [HeaderTypes.Int32],
    'effects_fly':              [HeaderTypes.Boolean],
    'effects_speed':            [HeaderTypes.Int32],
    'effects_invulnerability':  [HeaderTypes.Boolean],
    'effects_curse':            [HeaderTypes.Int32],
    'effects_zombie':           [HeaderTypes.Int32],
    'effects_gravityforce':     [HeaderTypes.Int32],
    'effects_multi_jump':       [HeaderTypes.Int32],

    'switch_local_toggle':      [HeaderTypes.Int32],
    'switch_local_activator':   [HeaderTypes.Int32, HeaderTypes.Byte],
    'switch_local_resetter':    [HeaderTypes.Byte],
    'switch_local_door':        [HeaderTypes.Int32],
    'switch_local_gate':        [HeaderTypes.Int32],

    'switch_global_toggle':     [HeaderTypes.Int32],
    'switch_global_activator':  [HeaderTypes.Int32, HeaderTypes.Byte],
    'switch_global_resetter':   [HeaderTypes.Byte],
    'switch_global_door':       [HeaderTypes.Int32],
    'switch_global_gate':       [HeaderTypes.Int32],
}

// export type SystemMessageEvents = {
//     'help': [[string]],
//     'receivePm': [[string, string]],
//     'sendPm': [[string, string]],
//     'noPm': [[]],
//     'playerMute': [[string]],
//     'playerUnmute': [[string]],
//     'alreadyGodMode': [[string]],
//     'noMoreGodMode': [[string]],
//     'givenGodMode': [[string]],
//     'alreadyEdit': [[string]],
//     'noMoreEdit': [[string]],
//     'givenEdit': [[string]],
//     'playerTeleported': [[string, number]],
//     'multiplePlayersTeleported': [[number, number, number]],
//     'playerNotTeleported': [[]],
//     'noChangesToSave': [[]],
//     'savingWorld': [[]],
//     'worldSaved': [[]],
//     'reloadingWorld': [[]],
//     'worldReloaded': [[]],
//     'worldCleared': [[]],
//     'titleChanges': [[string]],
//     'titleNotChanged': [[]],
//     'worldVisibility': [['PUBLIC' | 'PRIVATE' | 'UNLISTED']],
//     'onKick': [[string]],
//     'onKickWithReason': [[string, string]],
//     'onSelfKicked': [[string]],
//     'playerNotFound': [[]],
//     'cantMuteYourself': [[]],
// }

// export const SystemMessageFormat = {
//     'help': ['* SYSTEM', 'Available commands:%s'],
//     'receivePm': ['* %p > YOU', '%s'],
//     'sendPm': [ '* YOU > %p', '%s' ],
//     'noPm': ['* SYSTEM', 'You must specify a player and a message.'],
//     'playerMute': ['* SYSTEM', '%p was muted.'],
//     'playerUnmute': ['* SYSTEM', '%p was unmuted.'],
//     'alreadyGodMode': ['* SYSTEM', '%p already has god mode rights.'],
//     'noMoreGodMode': [ '* SYSTEM', "%p's god mode rights were taken away."],
//     'givenGodMode': [ '* SYSTEM', '%p was given god mode rights.' ],
//     'alreadyEdit': [ '* SYSTEM', '%p already has editing rights.' ],
//     'noMoreEdit': [ '* SYSTEM', "%p's editing rights were taken away." ],
//     'givenEdit': [ '* SYSTEM', '%p was given editing rights.' ],
//     'playerTeleported': ['* SYSTEM', 'Teleported %p to %n, %n.'],
//     'multiplePlayersTeleported': ['* SYSTEM', 'Teleported %n players to %n, %n.'],
//     'playerNotTeleported': ['* SYSTEM', 'You need to specify a player to teleport and the coordinates.'],
//     'noChangesToSave': ['* SYSTEM', 'There are no unsaved changes to save.'],
//     'savingWorld': ['* SYSTEM', 'Saving world...'],
//     'worldSaved': ['* SYSTEM', 'World saved!'],
//     'reloadingWorld': ['* SYSTEM', 'Reloading world...'],
//     'worldReloaded': ['* SYSTEM', 'World reloaded!'],
//     'worldCleared': ['* SYSTEM', 'World cleared!'],
//     'titleChanges': ['* SYSTEM', 'Title changed to "%s".'],
//     'titleNotChanged': ['* SYSTEM', 'You must specify an alphanumeric title.'],
//     'worldVisibility': ['* SYSTEM', 'World visibility set to %s.'],
//     'onKick': [ '* SYSTEM', '%p was kicked.' ],
//     'onKickWithReason': [ '* SYSTEM', '%p was kicked: %s' ],
//     'onSelfKicked': [ 'You were kicked!', 'Reason: %s' ],
//     'playerNotFound': [ '* SYSTEM', 'Player not found.' ],
//     'cantMuteYourself': [ '* SYSTEM', "You can't mute yourself." ]
// }
