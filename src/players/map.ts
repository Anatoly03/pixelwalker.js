import { Protocol } from "../index.js";
import { create } from "@bufbuild/protobuf";

import GameClient from "../game.js";
import GamePlayer from "../types/game-player.js";

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
        });

        // Listen for player leave packets to collect garbage players
        // from the map. The JS object will not be removed while there
        // are external references to the object.
        connection.listen('playerLeftPacket', pkt => {
            const player = this[pkt.playerId]!;

            if (player.state?.hasGoldCrown)
                this.crownPlayer = undefined;

            this.players.delete(pkt.playerId);
        })
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
