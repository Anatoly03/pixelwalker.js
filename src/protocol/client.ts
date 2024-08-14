import PocketBase from 'pocketbase';

// import Connection from './connection.js';

export const APIServerLink = 'api.pixelwalker.net';
export const GameServerLink = 'game.pixelwalker.net';

export default class PixelWalkerClient {
    /**
     * The connection instance. It handles communication
     * with the server.
     */
    // protected connection = new Connection(this);

    /**
     * PocketBase API
     */
    protected pocketbase: PocketBase = new PocketBase(`https://${APIServerLink}`);

    /**
     * Create a new Client instance, by logging in with a token.
     * @param {{token:string}} args The object holding the token which is used to sign into pocketbase.
     * @example
     * This is a standart way of creating a new Client instance
     * ```ts
     * import 'dotenv/config'
     * const client = Client.new({ token: process.env.TOKEN as string })
     * const client2 = Client.new(process.env.TOKEN)
     * ```
     */
    public static token(token: string): PixelWalkerClient {
        const client = new PixelWalkerClient();
        client.pocketbase.authStore.save(token, { verified: true });

        if (!client.pocketbase.authStore.isValid)
            throw new Error('Invalid Token');

        return client;
    }

    /**
     * Create a new Client instance, by logging in with a username and a password.
     * @param {{user:string, pass:string}} args The object holding the username and password which are used to sign into pocketbase.
     * @example
     * ```ts
     * import 'dotenv/config'
     * const client = Client.auth('user@example.com', 'PixieWalkie');
     * const client2 = Client.new({ user: 'user@example.com', pass: 'PixieWalkie' });
     * ```
     */
    public static async auth(
        username: string,
        password: string
    ): Promise<PixelWalkerClient> {
        const client = new PixelWalkerClient();
        await client.pocketbase
            .collection('users')
            .authWithPassword(username, password);
        return client;
    }

    /**
     * Create a new Client instance, by logging in with data defined in the 
     * @param {NodeJS.ProcessEnv} args The constant `process.env`
     * @example
     * This is a standart way of creating a new Client instance
     * ```ts
     * import 'dotenv/config'
     * const client = Client.new(process.env)
     * ```
     */
    public static async new(data: NodeJS.ProcessEnv): Promise<PixelWalkerClient>;

    /**
     * Create a new Client instance, by logging in with a token.
     * @param {{token:string}} args The object holding the token which is used to sign into pocketbase.
     * @example
     * This is a standart way of creating a new Client instance
     * ```ts
     * import 'dotenv/config'
     * const client = Client.new({ token: process.env.TOKEN as string })
     * const client2 = Client.new(process.env.TOKEN)
     * ```
     */
    public static async new(data: { token: string } ): Promise<PixelWalkerClient>;

    /**
     * Create a new Client instance, by logging in with a username and a password.
     * @param {{user:string, pass:string}} args The object holding the username and password which are used to sign into pocketbase.
     * @example
     * ```ts
     * import 'dotenv/config'
     * const client = Client.auth('user@example.com', 'PixieWalkie');
     * const client2 = Client.new({ user: 'user@example.com', pass: 'PixieWalkie' });
     * ```
     */
    public static async new(data: { username: string, password: string }): Promise<PixelWalkerClient>;

    public static async new(data: any): Promise<PixelWalkerClient> {
        if (data.token) return this.token(data.token);

        if (data.username && data.password)
            return this.auth(data.username, data.password);

        throw new Error(
            'Invalid login options. Expected { token } or { username, password }, got a different object.'
        );
    }
}