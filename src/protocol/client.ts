import PocketBase, { RecordService } from 'pocketbase';
import { APIServerLink } from './client.local';

export default class PixelWalkerClient {
    /**
     * The PixelWalker backend consists of several servers, and the API
     * server uses [PocketBase](https://pocketbase.io/) as its' base.
     */
    public readonly pocketbase: PocketBase = new PocketBase(
        `https://${APIServerLink}`
    );

    /**
     * Create a new Client instance, by logging in with a token. If the
     * token is invalid, it will return null.
     *
     * @param {string} token The object holding the token which is used
     * to sign into pocketbase.
     *
     * @example
     *
     * This is a standard way of creating a new Client instance
     *
     * ```ts
     * import 'dotenv/config'
     * const client = Client.new({ token: process.env.TOKEN as string })
     * const client2 = Client.new(process.env.TOKEN)
     * ```
     */
    public static withToken(token: string): PixelWalkerClient | null {
        const client = new PixelWalkerClient();
        client.pocketbase.authStore.save(token, { verified: true });

        if (!client.pocketbase.authStore.isValid)
            return null;

        return client;
    }

    protected constructor() {

    }
}
