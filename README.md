
<center><h1>PixelWalker SDK</h1></center>

[NPM](https://www.npmjs.com/package/pixelwalker.js) | [GitHub](https://github.com/Anatoly03/pixelwalker.js)

#### Example

```ts
import "dotenv/config"
import Client from 'pixelwalker.js'

const client = Client.withToken(process.env.token)
const connection = await client.createConnection('r450e0e380a815a');

connection.on('PlayerInit', (...args) => {
    connection.send('PlayerInit');
    console.log(args);
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
