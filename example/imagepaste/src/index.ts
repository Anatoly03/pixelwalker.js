import "dotenv/config";
import { APIClient, Structure } from "pixelwalker.js";
import { Worker } from 'worker_threads';

const parser = Structure.parser(JSON);
const client = await APIClient.withCredentials(process.env.USERNAME!, process.env.PASSWORD!);
const game = await client!.createGame(process.env.WORLD_ID!);

game.listen("Init", () => {
    const worker = new Worker('./src/parser.js');
    worker.postMessage([game.world.width, game.world.height]);
    worker.on('message', ([data, x, y]: [string, number, number]) => {
        const structure = parser.fromString(data);
        game.world.pasteStructure(structure, x, y);
    })
});

await game.bind();
