
<center><h1>PixelWalker API</h1></center>

[NPM](https://www.npmjs.com/package/pixelwalker.js) | [GitHub](https://github.com/Anatoly03/pixelwalker.js) | [Reference](REFERENCE.md)

#### Example

```js
// index file
import Client from 'pixelwalker.js'
import CommandManager from './command.js'
const client = new Client({ token: 'YOUR TOKEN HERE' })

client.on('start', () => world.say('🤖 Connected!'))
client.on('error', ([error]) => {throw error})

client
    .include(CommandManager)
    .connect('WORLD ID')
```

```js
// command file
import Client from 'pixelwalker.js'
const client = new Client({})

client.on('cmd:hello', async ([player, _]) => {
    client.say(`🤖 Hello, ${player.username}! `)
})

export default client
```

## Installation
```
npm i --save pixelwalker.js
```

## Examples

##### Give God Mode on Join

```js
client.on('player:join', ([player]) => player.god(true))
```

The above example is a simple module that gives every player god mode upon joining.

##### Snake Trail

```js
const blocks = ['glass_red', 'glass_orange', 'glass_yellow', 'glass_green', 'glass_cyan', 'glass_blue', 'glass_purple', 'glass_magenta', 0]

client.on('player:block', async ([player, pos, block]) => {
    if (block.name == 'empty') return
    if (!blocks.includes(block.name)) return

    await client.wait(250)
    client.block(pos[0], pos[1], pos[2], blocks[blocks.indexOf(block.name) + 1])
})
```

In this example a very simple snake trail is generated. The block types are stored and iterated over in the array. Note: `Client.block(...)` returns a promise that awaits if the block was placed by the internal queue manager. Awaiting blocks will cause low performance.

##### Replace block types

```js
client.on('cmd:replace', async ([player, _, from, to]) => {
    if (BlockMappings[from] == undefined || BlockMappings[to] == undefined) return
    const blocks = client.world.list(from)
    blocks.map(([x, y, layer]) => client.block(x, y, layer, to))
    await Promise.all(blocks)
    client.say(`🤖 Replaced ${blocks.length} blocks!`)
})
```

To replace all blocks of a kind, you can use the following procedure: List all blocks of replacing type in the world data, then place on all given coordinates the wished block type. If you want to make sure, that code continues to run only after all blocks are placed (without caring about placement order), await all promises.