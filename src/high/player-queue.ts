import { GameClient, GamePlayer } from "..";

type DisqualifyReason = "leave" | "death" | "flying" | "reset";

/**
 * This is a player cache that overseas an in-game player queue
 *
 * @since 1.4.9
 */
export default abstract class PlayerQueue {
    /**
     * If the round if in running state or not.
     */
    public running: boolean = false;

    /**
     * The data of the players.
     */
    public players: GamePlayer[] = [];

    /**
     * The track of players having sent movement packets.
     */
    private movedPlayers: GamePlayer[] = [];

    /**
     * The round timeout tracking.
     */
    private internalTimeout: NodeJS.Timeout | null = null;

    //
    //
    // SETTINGS
    //
    //

    /**
     * The round timeout in milliseconds, or null if no timeout
     * should be set.
     *
     * @since 1.4.9
     */
    protected ROUND_TIME: number | null = null;

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

        this.game.players.listen("Reset", (player) => {
            this.internalOnDisqualify(player, "reset");
        });

        this.game.connection.listen("playerMovedPacket", (pkt) => {
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
    private async internalOnGameStart(): Promise<void> {
        this.running = true;

        // Get the players.
        const players = await this.onSignUp();
        if (!players) throw new Error("TODO: could not sign up");

        this.players = players;
        this.movedPlayers = [];

        // Call the onAfterSignUp method.
        await this.onAfterSignUp();

        // Start the timer.
        if (this.ROUND_TIME) {
            this.internalTimeout = setTimeout(() => {
                this.internalOnGameEnd("timeout");
            }, this.ROUND_TIME);
        }
    }

    /**
     * // TODO document
     */
    private async internalOnGameEnd(reason: "timeout" | "force" | "win"): Promise<void> {
        this.running = false;

        // End the timer.
        if (this.internalTimeout) {
            clearTimeout(this.internalTimeout);
            this.internalTimeout = null;
        }

        // Call the respective callback.
        switch (reason) {
            case "timeout":
                this.onRoundTimeout();
                break;
            case "force":
                this.onPrematurelyEnded();
                break;
        }
    }

    /**
     * The wrapper for {@link PlayerQueue.onDisqualify} which
     * also removes the player from the queue and calls the win
     * methods.
     *
     * This will be fired for every player so sanitization for
     * players in the round occurs here.
     */
    private async internalOnDisqualify(player: GamePlayer, reason: DisqualifyReason): Promise<void> {
        const idx = this.players.indexOf(player);
        if (idx === -1) return;
        this.players.splice(idx, 1);

        // Call the onDisqualify method.
        await this.onDisqualify(player, reason);

        // Check if the player was the last standing player.
        if (this.players.length === 1) {
            await this.onLastStanding(this.players[0]);
            await this.internalOnGameEnd("win");
        }
    }

    //
    //
    // CALLBACKS
    //
    //

    /**
     * @description Fired prior the round start, here you have to
     * define which players are signed up into the round.
     *
     * The default implement signs up everyone who is not flying,
     * i.e. not in god mode or mod mode.
     *
     * @since 1.4.9
     */
    protected async onSignUp(): Promise<GamePlayer[] | undefined> {
        return this.game.players.filter((player) => !player.state || (!player.state.godmode && !player.state.modmode));
    }

    /**
     * @description Fired immediately before a round starts, here you
     * can teleport players to a game area or do other setup.
     *
     * @since 1.4.9
     */
    protected abstract onAfterSignUp(): Promise<void>;

    /**
     * @description Fired when a player was eliminated.
     *
     * @since 1.4.9
     */
    protected abstract onDisqualify(player: GamePlayer, reason: DisqualifyReason): Promise<void>;

    /**
     * @description Fired when a player is the last standing player (i.e. all
     * other players have been disqualified).
     *
     * @since 1.4.9
     */
    protected abstract onLastStanding(winner: GamePlayer): Promise<void>;

    /**
     * @description Fired when a round has been externally force-ended before
     * the winner was selected or the timeout was called.
     *
     * @since 1.4.9
     */
    protected abstract onPrematurelyEnded(): Promise<void>;

    /**
     * @description Fired when a round has ended due to timeout/ round time limit.
     * This will only be called if {@link ROUND_TIME} is set.
     *
     * @since 1.4.9
     */
    protected async onRoundTimeout(): Promise<void> {}

    //
    //
    // METHODS
    //
    //

    public start() {
        return this.internalOnGameStart();
    }

    public awaitEnd(): Promise<void> {
        // TODO implement: this returns a promise that will resolve when the game ends.
        return Promise.resolve();
    }
}
