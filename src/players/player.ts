import EventEmitter from 'events';
import Client from '../protocol/client.js';
import { PublicProfile } from '../types/public-profile.js';
// import { BlockMappingsReverse } from '../world/block/mappings.js';
// import palette_fix from '../world/block/palette_fix.js';

import {
    IsPlayerAdmin,
    PlayerConnectUserId,
    PlayerId,
    PlayerUsername,
    TeamId,
    TeamIdentifier,
} from '../types/events.js';

export type PlayerEvents = {
    UpdateRights: [boolean, boolean];
    ChatMessage: [string];
    PlayerMoved: [
        number,
        number,
        number,
        number,
        number,
        number,
        -1 | 0 | 1,
        -1 | 0 | 1,
        boolean,
        boolean,
        number
    ];
    PlayerTeleported: [number, number];
    PlayerFace: [number];
    PlayerGodMode: [boolean];
    PlayerModMode: [boolean];
    PlayerRespawn: [number, number];
    PlayerReset: [number | undefined, number | undefined];
    PlayerTouchBlock: [number, number, number];
    PlayerTouchPlayer: [number, 0 | 1];
    PlayerEffect: any[];
    PlayerRemoveEffect: [number];
    PlayerResetEffects: [];
    PlayerTeam: [TeamId];
    PlayerCounters: [number, number, number];
    PlayerLocalSwitchChanged: [number, number];
    PlayerLocalSwitchReset: [number];
};

export default class Player extends EventEmitter<PlayerEvents> {
    
}
