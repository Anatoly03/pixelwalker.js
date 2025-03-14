
<center><h1>PixelWalker SDK</h1></center>

[NPM](https://www.npmjs.com/package/pixelwalker.js) | [GitHub](https://github.com/Anatoly03/pixelwalker.js) | [Protocol](https://github.com/PixelWalkerGame/Protocol)

```sh
npm i --save pixelwalker.js
```

### Example: Connecting

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

### Using in the browser

Per default, this library will not work in the browser without downloading the polyfill node modules, below is an example how you can achieve this using the [vite-plugin-node-polyfills](https://www.npmjs.com/package/vite-plugin-node-polyfills) module, which will help with bundling node-native, which this library uses: `events`

```sh
npm i --save pixelwalker.js
npm i --save-dev vite-plugin-node-polyfills
```

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    nodePolyfills({
      include: ['events'],
      globals: { process: true },
    }),
  ],
})
```

## Contribution

```sh
npm install             # Install `node_modules`
npm run build           # Execute this after making changes to the library.
```

Installing the node packages will also build the project into dist.
