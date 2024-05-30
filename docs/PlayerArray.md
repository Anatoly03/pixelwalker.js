# `PlayerArray<Player, Mutable>`

```ts
import { PlayerArray } from 'pixelwalker.js'

const players = new PlayerArray<Player>([], true)
players.push(playerObject)
```

The PlayerArray is a modified array-like data structure that supports common operations on players. `Player` extends the `PlayerBase` class, which means it has the attributes `cuid` and `username` per default. The `Mutable` generic is a special marker used to make arrays immutable with `false` and mutable with `true`

#### `.none()`

Returns a Player Array with zero elements.

#### `.is_mut(): Mutable is true`

Returns true, if the `Mutable` generic is truthy.

#### `.length: number`

Returns the amount of elements.

#### `.map((P) => Z): Z[]`

Maps all player objects to a **regular, non-PLayerArray** list with a callback.

#### `.forEach((P) => void): this`

Calls a given callback function for every player element and returns a `this` reference. Note, that since this does not support awaiting promises, it is not recommended to use this for calls that require a specific order of execution. The current recommended approach to execute something on all players and wait is `await Promise.all(players.map(player => ...))`

#### `.join(separator?: string, startWith?: string, endWith?: string): string`

Separate all players with a given `separator` (which default to `, `) and return as reduced string. Alternatively you can also specify what the string should start and end with.

#### `.every((P) => boolean): boolean`

Matches against all players and returns true if and only if all players in the array return true on a given callback function.

#### `.filter((P, number) => boolean): PlayerArray<P>`

Returns a player array filtered with only players that return true on a callback.

#### `.find()`
#### `.includes()`
#### `.reduce()`
#### `.reduceRight()`
#### `.reverse()`
#### `.some()`
#### `.sort()`
#### `.sortBy()`
#### `.values()`
#### `.first()`
#### `.last()`
#### `.byCuid()`
#### `.byUsername()`
#### `.random()`
#### `.push()`
#### `.filter_mut()`
#### `.remove_all()`
#### `.immut()`
#### `.toString()`
#### `.toArray()`