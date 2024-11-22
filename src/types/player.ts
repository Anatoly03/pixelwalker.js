/**
 * A player id as defined per
 */
export type PlayerType = {
    id: number;
    cuid: string;

    username: Uppercase<string>;
    isAdmin: boolean;
    isSelf: boolean;
    face: number;

    x: number;
    y: number;
    velX: number;
    velY: number;

    isInGod: boolean;
    isInMod: boolean;
    canUseGod: boolean;
    canUseEdit: boolean;

    crown: boolean;
    win: boolean;
    team: number;

    coins: number;
    blueCoins: number;
    deaths: number;
    checkpoint?: { x: number; y: number };
};

export type SelfPlayer = PlayerType & {
    isSelf: true;
    tickId: number;
};

export default PlayerType;
