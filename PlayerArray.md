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

#### `.find((P) => boolean): P | undefined`

Try to find first player that matches a callback function truthy.

#### `.includes(P): P`

Returns true, if input parameter is included in the data structure. Per default, matching is done over the `cuid` parameter, but the map of in game players does it over a custom `id`

#### `.reduce<Z>((Z, P, number) => Z, Z): Z`, `.reduceRight<Z>(...)`

Accumulates a value of type `Z` over a callback function with the lambda `(previousValue, currentPlayer, index) => newValue` over all players and returns the result. Additional a second parameter can be defined, which is the initial value of the accumulator. `reduceRight` accumulates from the right to the left.

#### `.reverse(): this`

Reverse Array elements.

#### `.some((P) => boolean): boolean`

Matches against all players and returns true if and only if at least one player in the array returns true on a given callback function.

#### `.sort((P, P) => number): this`

Sort the array with a given comparison function.

#### `.sortBy((P) => keyof P)`

Equivalent to sort, except it is a macro for specifically sorting by player keys: `.sortBy(p => p.username)`

#### `.values()`

Returns an iterable over the players.

#### `.first()`, `.last()`

Returns the last and first elements respectively.

#### `.byCuid()`, `.byUsername()`

Get players by common attributes.

#### `.random(): P`

Get a random player from the array.

#### `.push(): this`

Requires `Mut` generic to be `true`. Pushes players into the array.

#### `.filter_mut((P, number) => boolean): this`

Requires `Mut` generic to be `true`. Filters the mutable player array and returns the reference to it.

#### `.remove_all((P, number) => boolean): this`

Requires `Mut` generic to be `true`. Mutably filteres all values that do not match the callback (equiv: Keeps only the values that do not match the callback). Removes all values that match the callback and returns them as a new array.

#### `.immut()`

Requires `Mut` generic to be `true`. Returns the same player array without mutability option.

#### `.toString()`

Reduces the array to a string variant. 

#### `.toArray()`

Converts the player array to a regular array.

