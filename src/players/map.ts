import EventEmitter from "events";

import { Block, Protocol } from "../index.js";
import { create } from "@bufbuild/protobuf";

import GameClient from "../game.js";
import GamePlayer from "../types/game-player.js";

/**
 * // TODO document, expand events
 *
 * @since 1.4.8
 */
type Events = {
    Add: [GamePlayer];
    OldAdd: [GamePlayer];
    NewAdd: [GamePlayer];
    Leave: [GamePlayer];

    Crown: [GamePlayer, GamePlayer | undefined];
    Trophy: [GamePlayer];
    CoinGold: [GamePlayer];
    CoinBlue: [GamePlayer];
    Team: [GamePlayer, typeof Teams[number], typeof Teams[number]];
};

/**
 * @since 1.4.8
 */
const Teams = ["none", "red", "green", "blue", "cyan", "magenta", "yellow"] as const;

/**
 *
 * @since 1.4.1
 */
export default class PlayerMap {
    readonly [id: number]: GamePlayer | undefined;

    /**
     * The internal data structure to manage players.
     */
    protected players: Map<number, GamePlayer> = new Map();

    /**
     * The event emitter is used to emit events when the
     * socket receives a message. The events are then
     * distributed to the listeners.
     */
    private receiver = new EventEmitter<Events>();

    /**
     * The self player is the player that is controlled by the client.
     * It is added to the map when the player is initialized.
     */
    public selfPlayer: GamePlayer | undefined;

    /**
     * The crown player is the player that currently holds the crown.
     * There is only one such player in the world.
     */
    public crownPlayer: GamePlayer | undefined;

    /**
     * The constructor is a proxy to allow for array-like access to
     * the player map. This branches numeric access to the internal
     * map and string and symbols to the class itself.
     */
    constructor() {
        return new Proxy(this, {
            get: (target, prop: string) => {
                if (!isNaN(+prop)) return target.players.get(+prop);
                return target[prop as any];
            },
        }) as PlayerMap;
    }

    //
    //
    // EVENTS
    //
    //

    public addListeners(client: GameClient) {
        const { connection } = client;

        // Listen for player init packets to add self player to the
        // map. Since the player doesn't have much data, the player
        // world state is created empty.
        connection.listen("playerInitPacket", (pkt) => {
            const selfPlayer = {
                properties: pkt.playerProperties!,
                state: create(Protocol.PlayerWorldStateSchema),
            };

            this.players.set(pkt.playerProperties!.playerId, selfPlayer);
            this.selfPlayer = selfPlayer;
        });

        // Listen for player joined packets to add other players to
        // the map. The player is added to the map with the player id
        // as the key.
        connection.listen("playerJoinedPacket", (pkt) => {
            const player = {
                properties: pkt.properties!,
                state: pkt.worldState!,
            };

            this.players.set(player.properties.playerId, player);

            // We use the fact here, that the player is incremently
            // assigned, starting with one.
            const isNewAdd = this.selfPlayer!.properties.playerId < player.properties.playerId;

            // Broadcast the event to the listeners
            this.receiver.emit(isNewAdd ? "NewAdd" : "OldAdd", player);
            this.receiver.emit("Add", player);
        });

        // Listen for player leave packets to collect garbage players
        // from the map. The JS object will not be removed while there
        // are external references to the object.
        connection.listen("playerLeftPacket", (pkt) => {
            const player = this[pkt.playerId];
            if (!player) return;

            // Broadcast the event to the listeners
            this.receiver.emit("Leave", player);

            // Remove the player from the crowned players, if the player
            // has the crown.
            if (player.state?.hasGoldCrown) this.crownPlayer = undefined;

            this.players.delete(pkt.playerId);
        });

        // Listen for player touch block packets: Crown, Trophy, Keys,
        // and other block interactions.
        //
        // @since 1.4.8
        connection.listen("playerTouchBlockPacket", (pkt) => {
            const player = this[pkt.playerId!];
            if (!player) return;

            // The block mapping is used to determine the block type.
            const mapping = Block.fromId(pkt.blockId).mapping;

            // The block coordinates.
            // const { x, y } = pkt.position!;

            switch (mapping) {
                default:
                    console.debug('Unknown block touch event:', mapping);
                case 'crown_gold':
                    const oldCrownPlayer = this.crownPlayer;
                    this.crownPlayer = player;

                    oldCrownPlayer!.state!.hasGoldCrown = false;
                    player.state!.hasGoldCrown = true;

                    this.receiver.emit('Crown', player, oldCrownPlayer);
                    break;
                case 'crown_silver':
                    player.state!.hasSilverCrown = true;

                    this.receiver.emit('Trophy', player);
                    break;
                case 'coin_gold':
                    // TODO for coins: test count, and decide emit order.
                    this.receiver.emit('CoinGold', player);
                    break;
                case 'coin_blue':
                    this.receiver.emit('CoinBlue', player);
                    break;
                case 'key_red':
                case 'key_green':
                case 'key_blue':
                case 'key_cyan':
                case 'key_magenta':
                case 'key_yellow':
                    // TODO
                    break;
                case 'team_effect_none':
                case 'team_effect_red':
                case 'team_effect_green':
                case 'team_effect_blue':
                case 'team_effect_cyan':
                case 'team_effect_magenta':
                case 'team_effect_yellow':
                    const teamName = mapping.substring('team_effect_'.length);
                    const oldTeamName = Teams[player.state!.teamId];
                    const teamId = Teams.indexOf(teamName as any);
                    const newTeamName = Teams[teamId];

                    player.state!.teamId = teamId;

                    this.receiver.emit('Team', player, newTeamName, oldTeamName);
                    break;
                case 'tool_checkpoint':
                    // TODO problem: no checkpoint value in networking
                    break;
                case 'tool_god_mode_activator':
                    player.properties.rights!.canGod = true;
                    break;
                case 'tool_activate_minimap':
                    player.properties.rights!.canToggleMinimap = true;
                    break;
            }
        });
    }

    /**
     * Adds the listener function to the end of the listeners array for the
     * event named `eventName`. No checks are made to see if the listener has
     * already been added. Multiple calls passing the same combination of
     * `eventNameand` listener will result in the listener being added, and
     * called, multiple times.
     *
     * | Event Name         | Description |
     * |--------------------|-------------|
     * | `OldAdd`           | The player joined the world before the bot connected.
     * | `NewAdd`           | The player joined the world after the bot connected.
     * | `Add`              | The player joined the world, either prior before the bot connected, or afterwards.
     * | `Leave`            | The player left the world.
     * | `CoinGold`         | The player touched a gold coin.
     * | `CoinBlue`         | The player touched a blue coin.
     * | `Crown`            | The player touched the gold crown. The second argument is the previous crown holder.
     * | `Trophy`           | The player touched the silver crown.
     * | `Team`             | The player changed their team. The second argumentis the new team name. The third argument is the old team name.
     *
     * @since 1.4.8
     */
    public listen<Event extends keyof Events>(eventName: Event, callback: (...e: Events[Event]) => void): this {
        this.receiver.on(eventName, callback as any);
        return this;
    }

    //
    //
    // METHODS
    //
    //

    /**
     * Returns an array representation snapshot of the map. This array
     * will not be updated or synced with the game.
     *
     * **Side Effects**: Since players share a mutual reference to the
     * synced map object, the array couldbe updated while processing.
     * To avoid this, clone player data which you need.
     *
     * @since 1.4.1
     */
    public toArray() {
        return [...this.players.values()];
    }
}
