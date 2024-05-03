
# API Reference

## `Client` extends [`EventEmitter`](https://nodejs.org/api/events.html#class-eventemitter)

```js
connected: boolean                    // Get connection state of client.
raw: EventEmitter                   // Event Emitter for unprocessed game events.
self: Player?                       // Once connected, get bot player.
world: World?                       // Once connected, access world data.
cmdPrefix: string[] = ['.', '!']    // Set accepted prefici for commands.
```

#### Constructor

You can login with only one way right now, by providing your token. It is recommended to use [dotenv](https://www.npmjs.com/package/dotenv). Do not forget to put `.env` into `.gitignore`

```js
import 'dotenv/config'
const client = new Client({ token: process.env.TOKEN })
```

#### `connect(world_id: string, world_type?: string)`

If world type is omitted, `RoomTypes[0]` is set. The exported variable `RoomTypes` is an array of allowed room types (strings)

```js
client.connect('r450e0e380a815a')
client.connect('r450e0e380a815a', 'pixelwalker4')
```

#### `disconnect()`

Disconnect client

#### unstable `include(client: Client)`

Include a module into the current client.

```js
// index.js
import Module from './path/to/mod.js'
client.on('init', ([p]) => console.log('Main Called'))
client.include(Module)

// mod.js
const client = new Client({})
client.on('init', ([p]) => console.log('Module Called'))
export default client
```

#### `wait(ms: number): Promise`

```js
await client.wait(50) // in miliseconds
```

#### `send(buffer[])`

Send raw binaries to the client.

```js
import { Type, MessageType, BlockMappings } from 'pixelwalker.js'
const { Magic, Bit7, Int32 } = Type
client.send(Magic(0x6B), Bit7(MessageType['placeBlock']), Int32(5), Int32(5), Int32(1), Int32(BlockMappings['basic_blue']))
```

#### `say(content: string)`

```js
client.say('🤖 Simon the Bot says, move to the right.')
```

#### `block(x, y, layer, block)`

Place a block. Note that the promise that is returned awaits the actual placement of the block server side. Do not await individual block messages unless needed.

```js
client.block(19, 31, 0, 'basic_blue_bg')
client.block(19, 31, 1, new Block('gravity_slow_dot'))
client.block(19, 31, 0, 0)
```

#### `god(value, mod)`

Set self into god mode, if mod is set to true, mod mode.

#### `face(value)`

Set self face

#### `move(x, y, xVel, yVel, xMod, yMod, horizontal, vertical, space_down, space_just_down)`

Set self into motion

#### unstable `fill(x, y, world)`

Fill the structure `world` at given coordinates.

### TODO Client Events

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

## `Player`

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

horizontal: -1 | 0 | 1 | undefined
vertical: -1 | 0 | 1 | undefined
space_down: boolean | undefined
space_just_down: boolean | undefined
```

#### `equals(player: Player): boolean`

#### `pm(content: string)`

```js
player.pm('🤖 Bot wanted to whisper you in the ear.')
```

#### `respond(content: string)`

This is an alias for `client.say(player.username + ': ' + message)`

```js
player.respond('🤖 Very loud talking!')
```

#### `kick(reason: string)`

Kick the player

```js
player.kick('🤖 Please don\'t misbehave :c')
```

#### `edit(value: boolean)`

Give or take players' edit rights

```js
player.edit(true)
```

#### `god(value: boolean)`

Give or take the players' god mode rights

```js
player.god(true)
```

#### `crown(value: boolean)`

Give or take the players crown. Note: Only one crown may exist per player.

```js
player.crown(true)
```

#### `teleport(x, y)`

Teleport a player to coordinates.

```js
player.teleport(5, 16)
```

#### `reset()`

```js
player.reset()
```

## Events: Game

TODO describe properly

| Event | Data | Description |
|:-:|-|-|
| `*` | ... | Receive *all* incoming messages, starting with header. |
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
| `playerTeleported` |  | |
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
