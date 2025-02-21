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

    Reset: [GamePlayer];

    CoinGold: [GamePlayer];
    CoinBlue: [GamePlayer];
    Death: [GamePlayer];

    Team: [GamePlayer, (typeof Teams)[number], (typeof Teams)[number]];
    TouchKey: [GamePlayer, (typeof Keys)[number]];

    Fly: [GamePlayer, boolean];
    FlyOn: [GamePlayer];
    FlyOff: [GamePlayer];
    God: [GamePlayer, boolean];
    GodOn: [GamePlayer];
    GodOff: [GamePlayer];
    Mod: [GamePlayer, boolean];
    ModOn: [GamePlayer];
    ModOff: [GamePlayer];
};

/**
 * @since 1.4.8
 */
const Teams = ["none", "red", "green", "blue", "cyan", "magenta", "yellow"] as const;

/**
 * @since 1.4.8
 */
const Keys = ["red", "green", "blue", "cyan", "magenta", "yellow"] as const;

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
    public self: GamePlayer | undefined;

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
    // GETTERS
    //
    //

    /**
     * Get the amount of players in the array.
     *
     * @since 1.4.8
     */
    public get length(): number {
        return this.toArray().length;
    }

    /**
     * Get the id of the self player (the connected instance)
     *
     * @since 1.4.8
     */
    public get selfId(): number {
        return this.self!.properties.playerId;
    }

    /**
     * Get the id of the self player (the connected instance)
     *
     * @since 1.4.8
     */
    public get selfAccountId(): string {
        return this.self!.properties.accountId;
    }

    /**
     * Get the amount of players that have the trophy/ silver crown.
     *
     * @deprecated write your own method instead
     * @since 1.4.8
     */
    // TODO determine which getters we need
    public get totalWins(): number {
        return this.reduce((acc, p) => acc + +p.state!.hasSilverCrown, 0);
    }

    /**
     * Get the amount of players who are not in god or mod mode. This
     * is useful to determine the amount of players that are playing,
     * and not spectating.
     *
     *
     * @deprecated this method needs a better name
     * @since 1.4.8
     */
    // TODO rename
    public get totalNotFlying(): number {
        return this.reduce((acc, p) => acc + +p.state!.hasSilverCrown, 0);
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
            this.self = selfPlayer;
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
            const isNewAdd = this.self!.properties.playerId < player.properties.playerId;

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

        // ignored: PlayerChatPacket

        // Listen for player rights packets to update the player rights.
        connection.listen("playerUpdateRightsPacket", (pkt) => {
            const player = this[pkt.playerId!];
            if (!player) return;

            // const oldRights = player.properties.rights;
            player.properties.rights = pkt.rights;

            // TODO handle rights change
        });

        // Listen for player movement packets to update the player
        // movement state.
        connection.listen("playerMovedPacket", (pkt) => {
            const player = this[pkt.playerId!];
            if (!player) return;

            // const oldMovement = player.movement;
            player.movement = pkt;

            // TODO handle movement change
        });

        // Listen for player face packets to update the player face,
        // and clear visual effects.
        connection.listen("playerFacePacket", (pkt) => {
            const player = this[pkt.playerId!];
            if (!player) return;

            // const oldFace = player.properties.face;
            player.properties.face = pkt.faceId;

            // TODO handle face change
        });

        // Listen for the player god mode.
        connection.listen("playerGodModePacket", (pkt) => {
            const player = this[pkt.playerId!];
            if (!player) return;

            player.state!.godmode = pkt.enabled;

            this.receiver.emit(pkt.enabled ? "GodOn" : "GodOff", player);
            this.receiver.emit("God", player, pkt.enabled);

            if (pkt.enabled && !player.state?.modmode) {
                // Mod mode is off, and god mode is now true -> Fly On
                this.receiver.emit("FlyOn", player);
                this.receiver.emit("Fly", player, true);
            } else if (!pkt.enabled && !player.state?.modmode) {
                // Mod is off, and god mode isnow false -> Fly Off
                this.receiver.emit("FlyOff", player);
                this.receiver.emit("Fly", player, false);
            }
        });

        // Listen for the player god mode.
        connection.listen("playerModModePacket", (pkt) => {
            const player = this[pkt.playerId!];
            if (!player) return;

            player.state!.godmode = pkt.enabled;

            this.receiver.emit(pkt.enabled ? "ModOn" : "ModOff", player);
            this.receiver.emit("Mod", player, pkt.enabled);

            if (pkt.enabled && !player.state?.godmode) {
                // God mode is off, and mod mode is now true -> Fly On
                this.receiver.emit("FlyOn", player);
                this.receiver.emit("Fly", player, true);
            } else if (!pkt.enabled && !player.state?.godmode) {
                // God is off, and mod mode is now false -> Fly Off
                this.receiver.emit("FlyOff", player);
                this.receiver.emit("Fly", player, false);
            }
        });

        // TODO PlayerRespawnPacket

        // TODO PlayerResetPacket
        connection.listen("playerResetPacket", (pkt) => {
            const player = this[pkt.playerId!];
            if (!player) return;

            // TODO implement
            // player.state!.coinsGold = 0;
            // player.state!.coinsBlue = 0;
            // player.state!.deaths = 0;
            // player.state!.hasGoldCrown = false;
            // player.state!.hasSilverCrown = false;
            // player.state!.godmode = false;
            // player.state!.modmode = false;
            // player.state!.teamId = 0;

            // TODO
            if (pkt.position && player.movement) {
                player.movement.position!.x = pkt.position.x;
                player.movement.position!.y = pkt.position.y;
            }

            this.receiver.emit("Reset", player);
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
                    console.debug("Unknown block touch event:", mapping);
                case "secret_appear":
                case "secret_disappear":
                    break;
                case "crown_gold":
                    const oldCrownPlayer = this.crownPlayer;
                    this.crownPlayer = player;

                    player.state!.hasGoldCrown = true;

                    if (oldCrownPlayer) {
                        oldCrownPlayer.state!.hasGoldCrown = false;
                    }

                    this.receiver.emit("Crown", player, oldCrownPlayer);
                    break;
                case "crown_silver":
                    player.state!.hasSilverCrown = true;

                    this.receiver.emit("Trophy", player);
                    break;
                case "coin_gold":
                    // TODO for coins: test count, and decide emit order.
                    // this.receiver.emit("CoinGold", player);
                    break;
                case "coin_blue":
                    // this.receiver.emit("CoinBlue", player);
                    break;
                case "key_red":
                case "key_green":
                case "key_blue":
                case "key_cyan":
                case "key_magenta":
                case "key_yellow":
                    const keyName = mapping.substring("key_".length);
                    this.receiver.emit("TouchKey", player, keyName as any);
                    break;
                case "team_effect_none":
                case "team_effect_red":
                case "team_effect_green":
                case "team_effect_blue":
                case "team_effect_cyan":
                case "team_effect_magenta":
                case "team_effect_yellow":
                    const teamName = mapping.substring("team_effect_".length);
                    const oldTeamName = Teams[player.state!.teamId];
                    const teamId = Teams.indexOf(teamName as any);
                    const newTeamName = Teams[teamId];

                    player.state!.teamId = teamId;

                    this.receiver.emit("Team", player, newTeamName, oldTeamName);
                    break;
                case "tool_checkpoint":
                    // TODO problem: no checkpoint value in networking, add custom attribute
                    break;
                case "tool_god_mode_activator":
                    player.properties.rights!.canGod = true;
                    break;
                case "tool_activate_minimap":
                    player.properties.rights!.canToggleMinimap = true;
                    break;
            }
        });

        // TODO PlayerAddEffectPacket

        // TODO PlayerRemoveEffectPacket

        // TODO PlayerResetEffectsPacket

        // TODO PlayerTeamUpdatePacket

        // Listen for player counters.
        connection.listen("playerCountersUpdatePacket", (pkt) => {
            const player = this[pkt.playerId!];
            if (!player) return;

            const oldCoins = player.state!.coinsGold;
            const oldBlueCoins = player.state!.coinsBlue;
            const oldDeaths = player.state!.deaths;

            const newCoins = (player.state!.coinsGold = pkt.coins!);
            const newBlueCoins = (player.state!.coinsBlue = pkt.blueCoins!);
            const newDeaths = (player.state!.deaths = pkt.deaths!);

            if (newCoins > oldCoins) {
                this.receiver.emit("CoinGold", player);
            }

            if (newBlueCoins > oldBlueCoins) {
                this.receiver.emit("CoinBlue", player);
            }

            if (newDeaths > oldDeaths) {
                this.receiver.emit("Death", player);
            }
        });

        // TODO PlayerLocalSwitchChangedPacket

        // TODO PlayerLocalSwitchResetPacket

        // ignored: PlayerDirectMessagePacket

        // TODO PlayerTouchPlayerPacket

        // TODO PlayerTeleportedPacket

        // TODO WorldReloadedPacket

        // TODO GlobalSwitchChangedPacket

        // TODO GlobalSwitchResetPacket
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
     * | `God`, `Mod`       | The player toggled god mode or mod mode. Alternatively, use event `Fly` if you don't care about the mode type. Comes with event variations `On` and `Off`
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
     * Maps all players to a regular array with a callback function.
     *
     * @since 1.4.8
     */
    public map<Z>(callback: (p: GamePlayer) => Z): Z[] {
        return this.toArray().map(callback);
    }

    /**
     * Iterate with callback over each player.
     *
     * @since 1.4.8
     */
    public forEach(callback: (p: GamePlayer) => void): this {
        for (const [_, p] of this.players.entries()) {
            callback(p);
        }

        return this;
    }

    /**
     * Run over all players and make sure all players satisfy a
     * conditional lambda.
     *
     * @since 1.4.8
     */
    public every(callback: (p: GamePlayer) => boolean): boolean {
        for (const p of this.players.values()) {
            if (!callback(p)) return false;
        }

        return true;
    }

    /**
     * Filter by keeping only players that satisfy the predicate.
     *
     * @example
     *
     * ```typescript
     * const playersExcludingSelf = client.players
     *     // .filter((p) => p.properties.playerId !== client.players.selfId);
     *     .filter((p) => p !== client.players.self);
     * ```
     *
     * @since 1.4.8
     */
    public filter(predicate: (value: GamePlayer, index: number) => boolean): GamePlayer[] {
        return this.toArray().filter(predicate);
    }

    /**
     * Find the first player that matches the predicate.
     *
     * @since 1.4.8
     */
    public find(callback: (p: GamePlayer) => boolean): GamePlayer | undefined {
        for (const p of this.players.values()) {
            if (callback(p)) return p;
        }

        return undefined;
    }

    /**
     * Accumulates a result over all player entries and returns.
     *
     * @since 1.4.8
     */
    public reduce<Z>(callback: (previousValue: Z, currentValue: GamePlayer, currentIndex: number) => Z, initialValue: Z): Z {
        return this.toArray().reduce<Z>(callback, initialValue);
    }

    /**
     * Accumulates a result over all player entries and returns,
     * starting from the right.
     *
     * @since 1.4.8
     */
    public reduceRight<Z>(callback: (previousValue: Z, currentValue: GamePlayer, currentIndex: number) => Z, initialValue: Z): Z {
        return this.toArray().reduceRight<Z>(callback, initialValue);
    }

    /**
     * Determines whether the specified callback function returns
     * true for any element of an array.
     *
     * @since 1.4.8
     */
    public some(callback: (p: GamePlayer) => boolean): boolean {
        for (const p of this.players.values()) {
            if (callback(p)) return true;
        }

        return false;
    }

    /**
     * Get a random player from selected array.
     *
     * @since 1.4.8
     */
    public random(): GamePlayer | undefined {
        const list = this.toArray();
        if (list.length == 0) return undefined;
        return list[Math.floor(list.length * Math.random())];
    }

    /**
     * @returns An iterator object that contains the values for each
     * index in the array.
     *
     * @since 1.4.8
     */
    [Symbol.iterator]() {
        let idx = 0,
            data = this.toArray();

        return {
            next: () => ({
                value: data[idx++],
                done: idx >= data.length,
            }),
        };
    }

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

    /**
     * Returns an array representation snapshot of the map, every player
     * in a random order. This array will not be updated or synced with
     * the game.
     *
     * **Side Effects**: Since players share a mutual reference to the
     * synced map object, the array couldbe updated while processing.
     * To avoid this, clone player data which you need.
     *
     * @since 1.4.8
     */
    public toShuffledArray() {
        const array = this.toArray();
        let currentIndex = array.length;

        // While there remain elements to shuffle...
        while (currentIndex != 0) {
            // Pick a remaining element...
            let randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            // And swap it with the current element.
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }

        return array;
    }
}
