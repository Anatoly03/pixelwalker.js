import "dotenv/config";
import * as fs from "node:fs";
import * as readline from "node:readline";
import { APIClient, Structure } from "pixelwalker.js";

const parser = Structure.parser(JSON);
const client = await APIClient.withCredentials(process.env.USERNAME!, process.env.PASSWORD!);
const iface = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question: string): Promise<string> {
    return new Promise((resolve) => {
        iface.question(question, resolve);
    });
}

const worldId = await ask('Enter the world ID: ');
const game = await client!.createGame(worldId);

game.listen("Init", () => {
    const structure = game.world.structure.copy(0, 0, game.width - 1, game.height - 1);
    fs.writeFileSync(`${worldId}-${Date.now()}.json`, parser.toString(structure));
    game.close();
});

await game.bind();
