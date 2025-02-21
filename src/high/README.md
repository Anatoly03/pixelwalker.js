# High-Level PixelWalker Abstractions

This module is accessible under the `high` route. It contains
abstractions for high-complexity bots with rounds and player
state management.

```typescript
import {
    PlayerQueue,
    PlayerSync,
    StructureQueueSync,
} from 'pixelwalker.js/high'
```

The **StructureQueueSync** is a good utility for bots like Shift, The Line and Bombot, where you have individual "maps" or "structure tiles" and you expect these to be synced with storage at runtime and have access to features like queueing.

<!-- TODO examples -->
<!-- TODO readme -->
