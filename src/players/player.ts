import EventEmitter from 'events';
import Client from '../protocol/client.js';
import { PublicProfile } from '../types/public-profile.js';

import { BlockMappingsReverse } from '../data/block-mappings.js';
import PixelWalkerClient from '../protocol/client.js';
import { PlayerArrayEvents } from './player-manager.js';
import { ConnectionReceiveEvents } from '../protocol/connection.js';
import {
    EffectId,
    IsPlayerAdmin,
    PlayerEditRights,
    PlayerGodRights,
    TeamId,
} from '../types/events.js';

export type PlayerEvents = {
    [Ev in keyof PlayerArrayEvents]: PlayerArrayEvents[Ev] extends [
        infer A,
        ...infer V
    ]
        ? A extends number
            ? (...args: V) => void
            : never
        : never;
};

export default class Player implements PlayerType, PlayerEvents {
    /**
     * The numeric Player identifier. It is unique per world.
     */
    public readonly id: number;

    /**
     * The string Player identifier. It is unique per profile.
     */
    public readonly cuid: string;

    /**
     * The username of the Player. It is mostly assumed to be
     * unique per profile, but it's not guaranteed to be persistant.
     */
    public readonly username: string;

    /**
     *
     */
    public readonly isAdmin: boolean;

    /**
     *
     */
    public readonly isSelf: boolean;

    /**
     *
     */
    public face: number = 0;

    /**
     * Is true, if the player has a gold crown. There is only one
     * player instance that can wear the gold crown per world. If
     * a player touches the crown,the player who wore it before
     * loses the rights to it.
     */
    public hasCrown: boolean = false;

    /**
     * Is true, if the player has a silver crown. Any player who
     * touches the trophy block will get a silver crown. If the
     * player has a gold crown, but won, this will still be true.
     */
    public isWinner: boolean = false;

    /**
     *
     */
    public teamId: TeamId = 0;

    /**
     *
     */
    public coins: number = 0;

    /**
     *
     */
    public blueCoins: number = 0;

    /**
     *
     */
    public deathCount: number = 0;

    /**
     *
     */
    constructor() {
        this.registerEvents();
    }

    private registerEvents() {
        /**
         * Initialise the player state upon join.
         */
        this.once(
            'PlayerJoined',
            (cuid, username, face, isAdmin, hasEditRights, hasGodRights) => {
                this.#cuid = cuid;
                this.#username = username;
            }
        );

        /**
         * Update the player state upon touch block.
         *
         * - If the player touches the gold crown, it
         *   should get possession rights to the gold
         *   crown assigned. Additionally, the previous
         *   holder loses the posession.
         * - If the player touches the silver trophy, it
         *   should get possession rights to the silver
         *   crown assigned.
         */
        this.on('PlayerTouchBlock', (x, y, bid) => {
            switch (BlockMappingsReverse[bid]) {
                case 'crown_gold':
                    {
                        const previous = this.client.players.crown;

                        // Re-assign crown posession.
                        if (previous) previous.#hasCrown = false;
                        this.#hasCrown = true;

                        // Broadcast to client
                        this.client.emit('PlayerCrown', this, previous);
                    }
                    break;
                case 'crown_silver':
                    {
                        // Re-assign silver crown posession.
                        this.#hasSilverCrown = true;

                        // Broadcast to client
                        this.client.emit('PlayerWin', this);
                    }
                    break;
            }
        });
    }

    //
    // Methods
    //

    /**
     * Returns a promise, that awaits the public profile of the
     * player.
     */
    public async profile(): Promise<PublicProfile> {
        return this.client.profiles().getFirstListItem(`cuid~${this.cuid}`);
    }

    //
    // Events
    //

    public UpdateRights (canEdit: PlayerEditRights, canGod: PlayerGodRights): void {
        
    }

    PlayerMoved: never;
    PlayerTeleported: (args_0: number, args_1: number) => void;
    PlayerFace: (
        args_0: number
    ) => void;
    PlayerGodMode: (args_0: boolean) => void;
    PlayerModMode: (args_0: boolean) => void;
    PlayerRespawn: (args_0: number, args_1: number) => void;
    PlayerReset;
    PlayerTouchBlock: (args_0: number, args_1: number, args_2: number) => void;
    PlayerTouchPlayer: (args_0: number, args_1: 0 | 1) => void;
    PlayerRemoveEffect: (args_0: EffectId) => void;
    PlayerResetEffects: (args_0: boolean) => void;
    PlayerTeam: (args_0: 0 | 1 | 2 | 3 | 4 | 5 | 6) => void;
    PlayerCounters: (args_0: number, args_1: number, args_2: number) => void;
    PlayerLocalSwitchChanged: (args_0: number, args_1: 0 | 1) => void;
    PlayerLocalSwitchReset: (args_0: 0 | 1) => void;
}
