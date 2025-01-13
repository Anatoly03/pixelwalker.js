
<center><h1>PixelWalker SDK</h1></center>

[NPM](https://www.npmjs.com/package/pixelwalker.js) | [GitHub](https://github.com/Anatoly03/pixelwalker.js) | [Protocol](https://github.com/PixelWalkerGame/Protocol)

> **THIS MODULE IS BEING REWRITTEN**
> 
> It is currently not usable.

```sh
npm i --save pixelwalker.js
```

```ts
import "dotenv/config";
import { APIClient, Block } from "pixelwalker.js";

const client = APIClient.withToken(process.env.TOKEN!)!;
const game = await client.createGame("r450e0e380a815a");

game.listen("Init", () => {
    console.log("Init!");
});

game.bind();
```

## Contribution

```sh
npm install             # Install `node_modules`
npm run build           # Execute this after making changes to the library.
```

Installing the node packages will also build the project into dist.
