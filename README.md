# Pixelwalker Library for Browser

[NPM](https://www.npmjs.com/package/browserwalker.js) | [GitHub](https://github.com/ConnorMcGehee/browserwalker.js) | [Original Library by Anatoly](https://github.com/Anatoly03/pixelwalker.js)

#### Example
```js

import  Client  from  "browserwalker.js";

const  client  =  new  Client({ token:  "<AUTH_TOKEN>" });

client.on('start', () =>  client.say("[Bot] Connected!"));
client.on('error', ([error]) => { throw  error; });

client.on("cmd:ping", () =>  client.say("[Bot] Pong!"));

client.connect("<WORLD_ID>", "pixelwalker4");

```
## Installation
```
npm i browserwalker.js
```
## Usage
For full usage information, check out [Anatoly's GitHub page for pixelwalker.js](https://github.com/Anatoly03/pixelwalker.js).