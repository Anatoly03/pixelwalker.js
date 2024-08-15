export const APIServerLink = '127.0.0.1:8090';
export const GameServerLink = 'localhost:5148';

import PocketBase from 'pocketbase';
import WebSocket from 'ws';
import PixelWalkerClient from './client.js';

export default class LocalhostPixelWalkerClient extends PixelWalkerClient {
    override pocketbase: PocketBase = new PocketBase(`http://${APIServerLink}`);

    override initSocket(joinkey: string) {
        return new WebSocket(`ws://${GameServerLink}/room/${joinkey}`);
    }
}
