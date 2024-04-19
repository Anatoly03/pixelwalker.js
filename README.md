
<center><h1>PixelWalker API</h1></center>

```js

import Client from 'pixelwalker.js'

const client = new Client({ token: 'YOUR TOKEN HERE' })

client.on('init', () => {
    client.init()
    world.say('Connected!')
})

client.on('error', (message) => {
    console.log('error', message)
})

client.on('chatMessage', ([user, message]) => {
    const { username } = client.players.get(user)

    if (message == 'ping')
        client.say(`Hello, User ${username}`)
})

client.connect('WORLD ID')

```

## Events: Receive

| Event | Data | Description |
|:-:|-|-|
| `init` | `id`, `cuid`, `username`, `face`, `isAdmin`, 16 * `x`, 16 * `y`, `can_edit`, `can_god`, `title`, `plays`, `owner`, `width`, `height` | Client joined the room |
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

## Events: Send

| Event | Description |
|:-:|-|
| `.say(string)` | Write into chat |
| `.block(x, y, layer, id)` | Place a block |