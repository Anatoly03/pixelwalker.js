import PocketBase from "pocketbase";

/**
 * The API Client is responsible for communication with the
 * {@link https://api.pixelwalker.net/ PixelWalker API Server}.
 * The API server uses {@link https://pocketbase.io/ PocketBase}
 * and manages account authentication, and retrieving storage.
 *
 * To compare it with how users sign up, the API Client is
 * the "lobby" from which you can access the open game rooms
 * or join a world.
 */
export default class APIClient {
    /**
     * The PocketBase instance used to communicate with the API
     * server. This allows for custom requests to the server if
     * this software kit is deemed not enough.
     */
    public readonly pocketbase: PocketBase;

    /**
     * Create an authenticated instance of the API Client. If the
     * provided token is invalid, undefined is returned instead.
     *
     * @param token The token to use for authentication. You can
     * access this token from the the website with developer tools.
     *
     * Note, you cannot use `this.pocketbase.model` properly this
     * way as it will always default the "default value". If you
     * wish to read the contents of the cookie, you should use the
     * {@link https://www.npmjs.com/package/jwt-decode jwt-decode}\
     * module.
     *
     * @example
     *
     * ```typescript
     * import 'dotenv/config';
     * import { APIClient } from 'pixelwalker';
     *
     * const client = APIClient.withToken(process.env.TOKEN!);
     * ```
     *
     * Note, in this example the environment variable `TOKEN!`
     * follows an exclamation. This symbol is used in TypeScript
     * to mark a possibly undefined value as strictly defined.
     * This is a compiler hint and can be omitted in JavaScript
     * environment.
     *
     * @returns Authenticated instance of the API Client.
     */
    public static withToken(token: string): APIClient | undefined {
        const client = new this();
        client.pocketbase.authStore.save(token, { verified: true });

        // Return undefined if the token is invalid.
        if (!client.pocketbase.authStore.isValid) return;

        // Return the api client if the token is valid.
        return client;
    }

    /**
     * // TODO document
     */
    protected constructor() {
        this.pocketbase = new PocketBase("https://api.pixelwalker.net/");
    }
}
