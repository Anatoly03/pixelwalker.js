import EventEmitter from 'events';
import PixelWalkerClient from '../protocol/client.js';
import Player, { PlayerEvents } from './player.js';
import PlayerArray from './player-array.js';
import PixelwalkerEvents from '../types/events.js';

export const BroadcastEvents = [
    'PlayerInit',
    'UpdateRights',
    'ChatMessage',
    'PlayerJoined',
    'PlayerLeft',
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

export type PlayerArrayEvents = {
    [K in keyof PixelwalkerEvents &
        (typeof BroadcastEvents)[number]]: PixelwalkerEvents[K];
};

export default class PlayerManager extends PlayerArray {
    #events: EventEmitter<PlayerArrayEvents> = new EventEmitter();

    #selfPlayer!: Player;

    /**
     * Retrieves the player who wears the golden crown. If
     * no one wears the silver crown, returns `undefined`.
     */
    public get crown() {
        return this.players.find((p) => p.hasCrown);
    }

    /**
     * Returns the reference of the players' self. i.e. the
     * bot itself.
     */
    public get self() {
        return this.#selfPlayer;
    }

    /**
     *
     */
    constructor(protected client: PixelWalkerClient) {
        super();
        this.registerEvents();
    }

    /**
     * Register events.
     */
    private registerEvents() {
        this.client.raw().once('PlayerInit', (id, ...args) => {
            this[id] = new Player(this.client);
            this[id].emit('PlayerInit', ...args);
        });

        this.client.raw().on('PlayerJoined', (id, ...args) => {
            this[id] = new Player(this.client);
            this[id].emit('PlayerJoined', ...args);
        });

        BroadcastEvents.forEach((event) => {
            this.client.raw().on<any>(event, (...args) => {
                (this.emit as any)(event, ...args);
            });

            this.on<any>(event, (id: number, ...args: any[]) => {
                this[id].emit<any>(event, ...args);
            });
        });
    }

    //
    // Events
    //

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

    //
    // Methods
    //
}
