import EventEmitter from 'events';
import Client from '../protocol/client.js';
import { PublicProfile } from '../types/public-profile.js';

import { BlockMappingsReverse } from '../data/block-mappings.js';
import PixelWalkerClient from '../protocol/client.js';
import { PlayerArrayEvents } from './manager.js';

export type PlayerEvents = {
    [Ev in keyof PlayerArrayEvents]: PlayerArrayEvents[Ev] extends [
        infer A,
        ...infer V
    ]
        ? A extends number
            ? V
            : never
        : never;
};

export default class Player {
    /**
     * The local event listener ofthe player. It  can be accessed
     * by the `Player` methods `on`, `once` and `emit`
     */
    #events: EventEmitter<PlayerEvents> = new EventEmitter();

    /**
     * The numeric Player identifier. It is unique per world.
     */
    public readonly id: number = 0;

    /**
     * The string Player identifier. It is unique per profile.
     */
    public get cuid() {
        return this.#cuid;
    }

    #cuid: string = 'unknown';

    /**
     * The username of the Player. It is mostly assumed to be
     * unique per profile, but it's not guaranteed to be persistant.
     */
    public get username() {
        return this.#username;
    }

    #username: string = 'unknown';

    /**
     * Is true, if the player has a gold crown. There is only one
     * player instance that can wear the gold crown per world. If
     * a player touches the crown,the player who wore it before
     * loses the rights to it.
     */
    public get hasCrown() {
        return this.#hasCrown;
    }

    #hasCrown: boolean = false;

    /**
     * Is true, if the player has a silver crown. Any player who
     * touches the trophy block will get a silver crown. If the
     * player has a gold crown, but won, this will still be true.
     */
    public get winner() {
        return this.#hasSilverCrown;
    }

    #hasSilverCrown: boolean = false;

    /**
     *
     */
    constructor(protected client: PixelWalkerClient) {
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
    // Events
    //

    /**
     * @ignore
     */
    public on<K extends keyof PlayerEvents>(
        event: K,
        callback: (...args: PlayerEvents[K]) => void
    ): this {
        this.#events.on(event, callback as any);
        return this;
    }

    /**
     * @ignore
     */
    public once<K extends keyof PlayerEvents>(
        event: K,
        callback: (...args: PlayerEvents[K]) => void
    ): this {
        this.#events.once(event, callback as any);
        return this;
    }

    /**
     * @ignore
     */
    public emit<K extends keyof PlayerEvents>(
        event: K,
        ...args: PlayerEvents[K]
    ): this {
        this.#events.emit(event, ...(args as any));
        return this;
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
}
