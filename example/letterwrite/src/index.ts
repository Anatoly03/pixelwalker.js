import "dotenv/config";
import * as fs from "node:fs";
import { APIClient, Block, Structure } from "pixelwalker.js";

const parser = Structure.parser(JSON);
const client = await APIClient.withCredentials(process.env.USERNAME!, process.env.PASSWORD!);
const game = await client!.createGame(process.env.WORLD_ID!);

const letters = fs.readdirSync("letters").map((path) => {
    const data = fs.readFileSync(`letters/${path}`, { encoding: "utf-8" });
    return parser.fromString(data) as Structure<{ letter: string; baseline: number }>;
});

let clipboard: { [player: number]: Structure | undefined } = {};

game.registerCommand({
    name: "create",
    callback(player, ...text_args) {
        const pieces: Structure<{
            letter: string;
            baseline: number;
        }>[] = [];

        const text = text_args.join(" ");

        for (const letter of text) {
            const tile = letters.find((tile) => tile.meta.letter === letter);
            if (!tile) {
                game.sendChat(`/pm ${player.properties.username} Unknown letter: ${letter}`);
                return;
            }

            pieces.push(tile);
        }

        const width = pieces.reduce((acc, piece) => acc + piece.width, 0) + 2;
        // const height = Math.max(...pieces.map(piece => piece.height - piece.meta.baseline));
        const height = 9;
        const structure = new Structure(width, height);

        let pointer_x = 0;

        // Write text
        for (const piece of pieces) {
            for (let y = 0; y < piece.height; y++) {
                for (let x = 0; x < piece.width; x++) {
                    structure[0][1 + pointer_x + x][1 + y + piece.meta.baseline] = piece[0][x][y];
                    structure[1][1 + pointer_x + x][1 + y + piece.meta.baseline] = piece[1][x][y];
                }
            }

            pointer_x += piece.width;
        }

        const marks: [number, number][] = [];

        // Fill neon border
        for (let y = 0; y < structure.height; y++) {
            for (let x = 0; x < structure.width; x++) {
                // If current block is not empty, ignore.
                if (structure[0][x][y].id !== 0) continue;

                // Eight adjecent sides.
                const adjecents = [
                    [-1, -1],
                    [0, -1],
                    [1, -1],
                    [-1, 0],
                    // [0, 0],
                    [1, 0],
                    [-1, 1],
                    [0, 1],
                    [1, 1],
                ];

                // Check if any of the adjecent sides has a tile.
                const hasAdjecent = adjecents
                    .map(([dx, dy]) => [x + dx, y + dy])
                    .filter(([lx, ly]) => lx >= 0 && ly >= 0 && lx < structure.width && ly < structure.height)
                    .some(([lx, ly]) => structure[0][lx][ly].id !== 0);

                if (!hasAdjecent) continue;

                marks.push([x, y]);
            }
        }

        for (const [x, y] of marks) {
            structure[0][x][y] = Block.fromMapping("neon_magenta_bg");
        }

        clipboard[player.properties.accountId] = structure;
        game.sendChat(`/pm ${player.properties.username} Created text: ${text}`);
    },
});

game.registerCommand({
    name: "paste",
    async callback(player, x, y) {
        const [tlx, tly] = [x, y].map(Number);
        const copy = clipboard[player.properties.accountId];

        if (!copy) {
            game.sendChat(`/pm ${player.properties.username} Nothing on your clipboard. First, create text to paste: <!text "banana">`);
        }

        if ([tlx, tly].some(isNaN)) {
            game.sendChat(`/pm ${player.properties.username} Invalid coordinates: x=${x}, y=${y}`);
            return;
        }

        await game.world.pasteStructure(copy, tlx, tly);
    },
});

await game.bind();
