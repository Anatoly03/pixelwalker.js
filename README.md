
<center><h1>PixelWalker SDK</h1></center>

[NPM](https://www.npmjs.com/package/pixelwalker.js) | [GitHub](https://github.com/Anatoly03/pixelwalker.js)

```sh
npm i --save pixelwalker.js
```

```ts
import "dotenv/config"
import * as fs from 'node:fs'
import Client, { MessageTypes, PlayerMap, Block, World, Structure } from "../../pixelwalker/dist/index"

export const client = Client.withToken(process.env.token);
export const connection = await client.createConnection('djtqrcjn4fzyhi8');
export const players = new PlayerMap(connection);
export const world = new World(connection);

connection.bind();
```

## Contribution

```
npm run build
```
