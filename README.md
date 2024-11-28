
<center><h1>PixelWalker SDK</h1></center>

[NPM](https://www.npmjs.com/package/pixelwalker.js) | [GitHub](https://github.com/Anatoly03/pixelwalker.js)

```sh
npm i --save pixelwalker.js
```

```ts
import "dotenv/config"
import { LobbyClient } from "../../pixelwalker/dist/index"

export const client = LobbyClient.withToken(process.env.token);
export const connection = await client.createConnection(process.env.world_id);

connection.bind();
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
