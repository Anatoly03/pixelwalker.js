<!-- This Pull Request has implemented/ has to implement -->

- [x] This is done. <!-- Add commit links here, when certain features where affected. -->
- [ ] This is not done.

--- <!-- Add one or many examples of using the SDK with the newly implemented features, remove block if not needed. -->

**Motivating Examples**

```ts
import Client, { Chat, MessageTypes, PlayerMap, Block, World, Structure } from "pixelwalker.js"

export const client = Client.withToken('token');
export const connection = await client.createConnection('connection');
export const players = new PlayerMap(connection);
export const world = new World(connection);
export const chat = new Chat(connection);

// TODO

connection.bind();
```
