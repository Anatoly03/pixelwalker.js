
<center><h1>PixelWalker API</h1></center>

```js

import Client from 'pixelwalker.js'

const client = new Client({ token: 'YOUR TOKEN HERE' })

client.on('init', () => world.say('🤖 Connected!'))

client.on('error', ([message]) => {
    console.log('error', message)
})

client.on('chatMessage', ([user, message]) => {
    const { username } = client.players.get(user)

    if (message == 'ping')
        client.say(`🤖 Hello, ${username}! `)
})

client.connect('WORLD ID')

```

## Events: Receive

| Event | Data | Description |
|:-:|-|-|
| `init` | `id`, `cuid`, `username`, `face`, `isAdmin`, `x`<sup>1</sup>, `y`<sup>1</sup>, `can_edit`, `can_god`, `title`, `plays`, `owner`, `width`, `height` | Client joined the room |
| `error`<sup>2</sup> | `err` | Called on API errors |
| `updateRights` |  | |
| `worldMetadata` |  | |
| `worldCleared` |  | |
| `chatMessage` |  | |
| `systemMessage` |  | |
| `playerJoined` |  | |
| `playerLeft` |  | |
| `playerMoved` |  | |
| `playerFace` |  | |
| `playerGodMode` |  | |
| `playerModMode` |  | |
| `playerCheckpoint` |  | |
| `playerRespawn` |  | |
| `placeBlock` |  | |
| `crownTouched` |  | |
| `keyPressed` |  | |

<!-- | `start` | TODO | Used to announce a successful connection (Use instead of `init`) | -->

- <sup>1</sup> This integer needs to be divided by 16 for downscale
- <sup>2</sup> This is a pseudo event (Created by the API for quality-of-life and not emitted by the game)

## Events: Send

| Event | Description |
|:-:|-|
| `.say(string)` | Write into chat |
| `.block(x, y, layer, id)` | Place a block |