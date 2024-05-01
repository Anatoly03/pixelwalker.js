
# API Reference

#### `Client`

| Event | Description |
|:-:|-|
| `.send(buffer[])` | Send raw binaries. |
| `.say(string)` | Write into chat |
| `.block(x, y, layer, id)` | Place a block |
| `.god(value, mode)` | Set god mode. If `mode` is true, then mod mode. |
| `.face(value)` | Change player face. |
| `.wait(time)` | Wait for a specific amount of time in miliseconds |
| `.wait_for(callback)` | Wait till `callback` is a value. If awaited, this function will block the current function and busy wait for callback to be true. Use only for events that will eventually come true, or you create memory leaks. |

### Receive

To receive serialized, unprocessed events from the game, see [REFERENCE.md](REFERENCE.md)

| Event | Data | Description |
|:-:|-|-|
| `start` | `id` | Client joined the room after init. |
| `error` | `err` | Called on API errors |
| `player:join` | `Player` | Player joined the game.
| `player:leave` | `Player` | Player left the game. The player object will be destroyed after the event processed.
| `player:face` | `Player`, `number`, `number` | Player changed the face. First number is new face, second number is old face. |
| `player:god` | `Player`, `boolean` | Player changed god mode |
| `player:mod` | `Player`, `boolean` | Player changed mod mode |
| `player:crown` | `Player`, `Player` | A player touched the crown. First player is who touched, second player is who had the crown before. |
| `player:coin` | `Player`, `number` | A player touched a gold coin. Second number is old coin count. To get new coin count, use `Player.coins` |
| `player:coin:blue` | `Player`, `number` | A player touched a blue coin. Second number is old blue coin count. To get new blue coin count, use `Player.blue_coins` |
| `player:death` | `Player`, `number` | A player died. Second number is old death count. To get new death count, use `Player.deaths` |
| `player:block` | `Player`, `WorldPosition`, `Block` | A block was placed. |
| `cmd:*` | `Player`, ...`args` | Retrieve specific commands from messages. Replace `*` with command to listen to. For `!ping`, the event is `cmd:ping`. Arguments are provided by the player in chat. You can access `client.cmdPrefix` to set a list of allowed command prefices. |
| `world:clear` | | The World was cleared. |


### `class Player`

```js
readonly id: number
readonly cuid: string
readonly username: string

face: number
isAdmin: boolean
x: number
y: number
god_mode: boolean
mod_mode: boolean
has_crown: boolean

coins: number
blue_coins: number
deaths: number

// Methods

equals(other: Player): boolean
async pm(content: string)
async respond(content: string)
async kick(reason: string)
async edit(value: boolean)
```

### Events: Game

TODO describe properly

| Event | Data | Description |
|:-:|-|-|
| `init` | `id`, `cuid`, `username`, `face`, `isAdmin`, `x`<sup>1</sup>, `y`<sup>1</sup>, `can_edit`, `can_god`, `title`, `plays`, `owner`, `global_switches`, `width`, `height`, `world_data` | |
| `updateRights` |  | |
| `worldMetadata` |  | |
| `worldCleared` |  | |
| `worldReloaded` | | |
| `placeBlock` | | |
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
| `playerStatsChanged` | | |
| `playerWin` | | |
| `localSwitchChange` | | |
| `localSwitchReset` | | |
| `globalSwitchChange` | | |
| `globalSwitchReset` | | |
