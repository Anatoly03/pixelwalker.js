<!-- This Pull Request has implemented/ has to implement -->

- [x] This is done. <!-- Add commit links here, when certain features where affected. -->
- [ ] This is not done.

--- <!-- Add one or many examples of using the SDK with the newly implemented features, remove block if not needed. -->

**Motivating Examples**

```ts

import "dotenv/config"
import { LobbyClient } from "pixelwalker.js"

export const client = LobbyClient.withToken(process.env.token);
export const game = await client.connection(process.env.world_id);

// TODO

connection.bind();
```
