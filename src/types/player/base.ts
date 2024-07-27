import Client from "../../client.js"

/**
 * @example
 * ```ts
 * const player = new PlayerBase({
 *     cuid: 'abcdef',
 *     username: 'USER'
 * })
 * ```
 */
export class PlayerBase {
    public readonly cuid: string
    public readonly username: string
    
    /**
     * Create a new base instance of a Player.
     */
    constructor(args: {
        cuid: string
        username: string
    }) {
        this.cuid = args.cuid
        this.username = args.username
    }

    public valueOf() {

    }

    /**
     * @returns Username of the player.
     */
    public toString(): string {
        return this.username
    }
}
