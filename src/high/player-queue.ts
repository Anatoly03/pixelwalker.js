import { GameClient, GamePlayer } from "..";

type DisqualifyReason = "leave" | "death" | "flying" | "reset";

/**
 * This is a player cache that overseas an in-game player queue
 *
 * @since 1.4.9
 */
export default abstract class PlayerQueue {
    /**
     * The data of the players.
     */
    private players: GamePlayer[] = [];

    /**
     * The track of players having sent movement packets.
     */
    private movedPlayers: GamePlayer[] = [];

    /**
     * If the round if in running state or not.
     */
    public running: boolean = false;

    public constructor(protected game: GameClient) {
        this.addListeners();
    }

    //
    //
    // GETTERS
    //
    //

    /**
     * The length of the saved players.
     *
     * @since 1.4.9
     */
    public get length(): number {
        return this.players.length;
    }

    //
    //
    // EVENTS
    //
    //

    /**
     * This method is invoked on construction of the connection
     * and adds the required listeners to the receiver.
     *
     * @since 1.4.9
     */
    private addListeners() {
        this.game.players.listen("Leave", (player) => {
            this.internalOnDisqualify(player, "leave");
        });

        this.game.players.listen("Death", (player) => {
            this.internalOnDisqualify(player, "death");
        });

        this.game.players.listen("FlyOn", (player) => {
            this.internalOnDisqualify(player, "flying");
        });

        this.game.players.listen('Reset', (player) => {
            this.internalOnDisqualify(player, 'reset');
        });

        this.game.connection.listen('playerMovedPacket', (pkt) => {
            const player = this.game.players[pkt.playerId!];
            if (!player) return;
            if (this.movedPlayers.includes(player)) return;

            this.movedPlayers.push(player);
        });
    }

    //
    //
    // INTERNAL METHODS
    //
    //

    /**
     * // TODO document
     */
    private internalOnGameStart(): void {
        this.running = true;
    }

    /**
     * // TODO document
     */
    private internalOnGameEnd(): void {
        this.running = false;
    }

    /**
     * The wrapper for {@link PlayerQueue.onDisqualify} which
     * also removes the player from the queue and calls the win
     * methods.
     *
     * This will be fired for every player so sanitization for
     * players in the round occurs here.
     */
    private internalOnDisqualify(player: GamePlayer, reason: DisqualifyReason): void {
        const idx = this.players.indexOf(player);
        if (idx === -1) return;
        this.players.splice(idx, 1);

        // Call the onDisqualify method.
        this.onDisqualify(player, reason);

        // Check if the player was the last standing player.
        if (this.players.length === 1) {
            this.onLastStanding(this.players[0]);
            this.internalOnGameEnd();
        }
    }

    //
    //
    // CALLBACKS
    //
    //

    /**
     * @description Fired when a player was eliminated.
     *
     * @since 1.4.9
     */
    protected abstract onDisqualify(player: GamePlayer, reason: DisqualifyReason): void;

    /**
     * Fired when a player is the last standing player (i.e. all
     * other players have been disqualified).
     *
     * @since 1.4.9
     */
    protected abstract onLastStanding(player: GamePlayer): void;

    //
    //
    // METHODS
    //
    //

    public start() {
        this.internalOnGameStart();
    }

    public awaitEnd(): Promise<void> {
        // TODO implement: this returns a promise that will resolve when the game ends.
        return Promise.resolve();
    }
}
