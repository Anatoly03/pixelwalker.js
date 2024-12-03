
<center><h1>PixelWalker SDK</h1></center>

[NPM](https://www.npmjs.com/package/pixelwalker.js) | [GitHub](https://github.com/Anatoly03/pixelwalker.js) | [Protocol](https://github.com/PixelWalkerGame/Protocol)

```sh
npm i --save pixelwalker.js
```

```ts
import "dotenv/config"
import { LobbyClient } from "pixelwalker.js"

export const client = LobbyClient.withToken(process.env.token);
export const game = await client.connection(process.env.world_id);

game.listen('playerChatPacket', ({ playerId, message }) => {
    if (message != '!ping') return;

    game.send('playerChatPacket', {
        message: `Pong, ${game.players[playerId].properties.username}!`,
    })
})

game.bind();
```

#### Testing in Local Development server

```ts
import { LobbyClient } from 'pixelwalker.js/localhost'
```

By setting the `localhost` flag (adding it to the import), the API server and Game server paths are derouted to the localhost ports equivalent.

## Contribution

```
npm install
```

Installing the node packages will also build the project into dist.
