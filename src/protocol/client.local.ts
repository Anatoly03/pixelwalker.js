import PocketBase from 'pocketbase';
import PixelWalkerClient from './client.js';

export const APIServerLink = '127.0.0.1:8090';
export const GameServerLink = 'localhost:5148';

export default class LocalhostPixelWalkerClient extends PixelWalkerClient {
    protected override pocketbase: PocketBase = new PocketBase(`https://${APIServerLink}`);
}
