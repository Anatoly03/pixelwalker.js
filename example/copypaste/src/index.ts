import "dotenv/config";
import  * as fs from "node:fs";
import { APIClient, Structure } from "pixelwalker.js";

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
        const [tlx, tly, brx, bry] = [x1, y1, x2, y2].map(Number);

        if ([tlx, tly, brx, bry].some(isNaN)) {
            game.sendChat(`${player.properties.username}: Invalid coordinates.`);
            return;
        }

        structure = game.world.structure.copy(tlx, tly, brx, bry);
        game.sendChat(`${player.properties.username}: Copied!`);
    }
});

game.registerCommand({
    name: 'paste',
    permission(player) {
        return player.properties.accountId === ownerId;
    },
    callback(player, x, y) {
        const [tlx, tly] = [x, y].map(Number);

        if ([tlx, tly].some(isNaN)) {
            game.sendChat(`${player.properties.username}: Invalid coordinates.`);
            return;
        }

        // TODO paste structure
    }
});

game.registerCommand({
    name: 'save',
    permission(player) {
        return player.properties.accountId === ownerId;
    },
    callback(player, name) {
        if (!name) {
            game.sendChat(`${player.properties.username}: Usage: /load <name>`);
            return;
        }

        if (!structure) {
            game.sendChat(`${player.properties.username}: No structure to save.`);
            return;
        }

        fs.writeFileSync(name, structure.toString());
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
            structure = Structure.parser(JSON).fromString(file);
        }  catch(_) {
            game.sendChat(`${player.properties.username}: File not found.`);
        }
    }
});

await game.bind();
