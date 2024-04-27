
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
