import EventEmitter from 'events';
import PixelWalkerClient from '../protocol/client.js';
import { PlayerEvents } from './player.js';
import PlayerArray from './array.js';

export type PlayerArrayEvents = {
    [K in keyof PlayerEvents]: [number, ...PlayerEvents[K]];
};

export default class PlayerManager extends PlayerArray {
    /**
     *
     */
    #players: [] = [];

    /**
     *
     * @param client
     */
    #events: EventEmitter<PlayerArrayEvents> = new EventEmitter();

    constructor(private client: PixelWalkerClient) {
        super()

        const events = [
            'UpdateRights',
            'ChatMessage',
            'PlayerMoved',
            'PlayerTeleported',
            'PlayerFace',
            'PlayerGodMode',
            'PlayerModMode',
            'PlayerRespawn',
            'PlayerReset',
            'PlayerTouchBlock',
            'PlayerTouchPlayer',
            'PlayerEffect',
            'PlayerRemoveEffect',
            'PlayerResetEffects',
            'PlayerTeam',
            'PlayerCounters',
            'PlayerLocalSwitchChanged',
            'PlayerLocalSwitchReset',
        ] as const;

        events.forEach((event) => {
            client.listen(event, (...args) => {
                this.emit(event, ...(args as any));
            });

            this.on(event, (id, ...args) => {
                console.log(
                    `Broadcast ${event} to ${this.#players.length} players`
                );
                console.log(this[id])
            });
        });
    }

    /**
     * @ignore
     */
    public on<K extends keyof PlayerArrayEvents>(
        event: K,
        callback: (...args: PlayerArrayEvents[K]) => void
    ): this {
        this.#events.on(event, callback as any);
        return this;
    }

    /**
     * @ignore
     */
    public once<K extends keyof PlayerArrayEvents>(
        event: K,
        callback: (...args: PlayerArrayEvents[K]) => void
    ): this {
        this.#events.once(event, callback as any);
        return this;
    }

    /**
     * @ignore
     */
    public emit<K extends keyof PlayerArrayEvents>(
        event: K,
        ...args: PlayerArrayEvents[K]
    ): this {
        this.#events.emit(event, ...(args as any));
        return this;
    }
}
