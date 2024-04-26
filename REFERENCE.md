
# API Reference

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

### `class Client`



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

### Pseudo Events

Pseudo Events are emitted internally by the API and not the game. This provides a level of abstraction for optimised usage of common macros.

| Event | Data | Description |
|:-:|-|-|
| `start` | `id` | Client joined the room after init. |
| `error` | `err` | Called on API errors |
| `cmd:*` | `id`, ...`args` | Retrieve specific commands from messages. Replace `*` with command to listen to. For `!ping`, the event is `cmd:ping`. Arguments are provided by the player in chat. You can access `client.cmdPrefix` to set a list of allowed command prefices. |
