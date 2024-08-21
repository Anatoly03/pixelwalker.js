import {
    PlayerConnectUserId,
    PlayerId,
    PlayerUsername,
    TeamId,
} from './events.js';

/**
 * A player id as defined per
 */
export type Player = {
    id: PlayerId;
    cuid: PlayerConnectUserId;

    username: PlayerUsername;
    isAdmin: boolean;
    isSelf: boolean;
    face: number;

    pos: { x: number; y: number };
    vel: { x: number; y: number };

    isInGod: boolean;
    isInMod: boolean;
    canUseGod: boolean;
    canUseEdit: boolean;

    crown: boolean;
    win: boolean;
    team: TeamId;

    coins: number;
    blue_coins: number;
    deaths: number;
    checkpoint?: { x: number; y: number };
};

export type SelfPlayer = Player & {
    isSelf: true;
    tickId: number;
};

export default Player;
