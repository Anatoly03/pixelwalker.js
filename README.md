
<center><h1>PixelWalker SDK</h1></center>

[NPM](https://www.npmjs.com/package/pixelwalker.js) | [GitHub](https://github.com/Anatoly03/pixelwalker.js)

#### Example

```js
import "dotenv/config"
import Client, { PlayerMap } from 'pixelwalker.js'

const client = Client.withToken(process.env.token)
const connection = await client.createConnection('r450e0e380a815a');
const players = new PlayerMap(connection);

players.on('Add', (player) => {
    connection.send('PlayerChatMessage', '/giveedit ' + player.username);
})

connection.bind();
```

## Installation

```
npm i --save pixelwalker.js
```

## Contribution

```
npm run build
```
