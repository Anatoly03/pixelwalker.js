import "dotenv/config";
import  * as fs from "node:fs";
import { APIClient, Structure } from "pixelwalker.js";

const parser = Structure.parser(JSON);
const client = await APIClient.withCredentials(process.env.USERNAME!, process.env.PASSWORD!);
const game = await client!.createGame(process.env.WORLD_ID!);

let structure: Structure | null = null;
let ownerId = '';

game.listen('Init', () => {
    ownerId = game.players.selfPlayer!.properties.accountId!;
})

game.registerCommand({
    name: 'copy',
    permission(player) {
        return player.properties.accountId === ownerId;
    },
    callback(player, x1, y1, x2, y2) {
        switch (x1) {
            case 'all':
                const { width, height } = game.world.structure;

                structure = game.world.structure.copy(0, 0, width - 1, height - 1);
                break;
            default:
                const [tlx, tly, brx, bry] = [x1, y1, x2, y2].map(Number);
        
                if ([tlx, tly, brx, bry].some(isNaN)) {
                    game.sendChat(`${player.properties.username}: Invalid coordinates.`);
                    return;
                }
        
                structure = game.world.structure.copy(tlx, tly, brx, bry);
        }

        let nonEmpty = 0;

        for (const [_, l] of structure.layers()) {
            for (const [x, y, block] of l.blocks()) {
                if (block.id == 0) continue;
                nonEmpty++;
            }
        }

        game.sendChat(`${player.properties.username}: Copied! (Not Empty = ${nonEmpty})`);
    }
});

game.registerCommand({
    name: 'paste',
    permission(player) {
        return player.properties.accountId === ownerId;
    },
    async callback(player, x, y) {
        const [tlx, tly] = [x, y].map(Number);

        if ([tlx, tly].some(isNaN)) {
            game.sendChat(`${player.properties.username}: Invalid coordinates.`);
            return;
        }

        if (!structure) {
            game.sendChat(`${player.properties.username}: No structure to paste.`);
            return;
        }

        await game.world.pasteStructure(structure, tlx, tly);
        game.sendChat(`${player.properties.username}: Pasted!`);
    }
});

game.registerCommand({
    name: 'save',
    permission(player) {
        return player.properties.accountId === ownerId;
    },
    callback(player, name) {
        if (!name) {
            game.sendChat(`${player.properties.username}: Usage: /save <name>`);
            return;
        }

        if (!structure) {
            game.sendChat(`${player.properties.username}: No structure to save.`);
            return;
        }

        fs.writeFileSync(name, parser.toString(structure));
    }
});

game.registerCommand({
    name: 'load',
    permission(player) {
        return player.properties.accountId === ownerId;
    },
    callback(player, name) {
        if (!name) {
            game.sendChat(`${player.properties.username}: Usage: /load <name>`);
            return;
        }

        try {
            const file = fs.readFileSync(name).toString('utf-8');
            structure = parser.fromString(file);
        }  catch(_) {
            game.sendChat(`${player.properties.username}: File not found.`);
        }

        game.sendChat(`${player.properties.username}: Loaded.`);
    }
});

await game.bind();
