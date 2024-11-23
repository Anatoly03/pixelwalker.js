import { ComponentTypeHeader } from "../util/buffer-reader";

/**
 * The `PlayerInit` message has to be sent once directly after connecting
 * to the game server.
 *
 * | Index | Type | Description |
 * | --- | --- | --- |
 * | Empty |
 */
export const PlayerInit = [] as const;

/**
 * The `WorldBlockPlaced` message is sent when a block is placed in the world.
 * This message is sent to all clients.
 *
 * | Index | Type | Description |
 * | --- | --- | --- |
 * | 0 | `number` | X coordinate of the block |
 *
 */
// export const WorldBlockPlaced = [] as const;

/**
 * The `PlayerChatMessage` can be sent to write to the chat.
 *
 * | Index | Type | Description |
 * | --- | --- | --- |
 * | 0 | `string` | Content of the chat message |
 */
export const PlayerChatMessage = [ComponentTypeHeader.String] as const;

/**
 * The `PlayerMoved` message is sent when the player moves.
 *
 * | Index | Type | Description |
 * | --- | --- | --- |
 * | 0 | `number` | X coordinate |
 * | 1 | `number` | Y coordinate |
 * | 2 | `number` | X velocity |
 * | 3 | `number` | Y velocity |
 * | 4 | `number` | mod X |
 * | 5 | `number` | mod Y |
 * | 6 | `number` | horizontal |
 * | 7 | `number` | vertical |
 * | 8 | `boolean` | space down |
 * | 9 | `boolean` | space just down/ space pressed |
 * | 10 | `boolean` | just teleported |
 * | 11 | `number` | tick id |
 */
export const PlayerMoved = [
    ComponentTypeHeader.Int32,
    ComponentTypeHeader.Int32,
    ComponentTypeHeader.Float,
    ComponentTypeHeader.Float,
    ComponentTypeHeader.Int32,
    ComponentTypeHeader.Int32,
    ComponentTypeHeader.Int32,
    ComponentTypeHeader.Int32,
    ComponentTypeHeader.Boolean,
    ComponentTypeHeader.Boolean,
    ComponentTypeHeader.Boolean,
    ComponentTypeHeader.Int32,
] as const;

/**
 * The `PlayerFace` message is sent to change the player's smiley.
 *
 * | Index | Type | Description |
 * | --- | --- | --- |
 * | 0 | `number` | Face ID |
 */
export const PlayerFace = [ComponentTypeHeader.Int32] as const;

/**
 * The `PlayerGodMode` message is sent to enable or disable god mode.
 *
 * | Index | Type | Description |
 * | --- | --- | --- |
 * | 0 | `boolean` | God mode state |
 */
export const PlayerGodMode = [ComponentTypeHeader.Boolean] as const;

/**
 * The `PlayerModMode` message is sent to enable or disable mod mode.
 *
 * | Index | Type | Description |
 * | --- | --- | --- |
 * | 0 | `boolean` | Mod mode state |
 */
export const PlayerModMode = [ComponentTypeHeader.Boolean] as const;

/**
 * The `PlayerCounters` message is sent to update the player's counters.
 *
 * | Index | Type | Description |
 * | --- | --- | --- |
 * | 0 | `number` | Coins |
 * | 1 | `number` | Blue Coins |
 * | 2 | `number` | Deaths |
 */
export const PlayerCounters = [ComponentTypeHeader.Int32, ComponentTypeHeader.Int32, ComponentTypeHeader.Int32] as const;

export const SendEventsFormat = {
    PlayerInit,
    // PlayerUpdateRights: [],
    // UpdateWorldMetadata: [],
    // PerformWorldAction: [],
    // WorldCleared: [],
    // WorldReloaded: [],
    // WorldBlockPlaced,
    // WorldBlockFilled: [],
    PlayerChatMessage,
    // OldChatMessages: [],
    // SystemMessage: [],
    // PlayerJoined: [],
    // PlayerLeft: [],
    PlayerMoved,
    // PlayerTeleported: [],
    PlayerFace,
    PlayerGodMode,
    PlayerModMode,
    // PlayerRespawn: [],
    // PlayerReset: [],
    // PlayerTouchBlock: [],
    // PlayerTouchPlayer: [],
    // PlayerAddEffect: [],
    // PlayerRemoveEffect: [],
    // PlayerResetEffects: [],
    // PlayerTeam: [],
    PlayerCounters,
    // PlayerLocalSwitchChanged: [],
    // PlayerLocalSwitchReset: [],
    // GlobalSwitchChanged: [],
    // GlobalSwitchReset: [],
    // PlayerDirectMessage: [],
};

export type FormatType<K> = K extends readonly []
    ? []
    : K extends readonly [infer A, ...infer V]
    ? [
          A extends ComponentTypeHeader
              ? A extends ComponentTypeHeader.Boolean
                  ? boolean
                  : A extends ComponentTypeHeader.Byte
                  ? number
                  : A extends ComponentTypeHeader.ByteArray
                  ? number[]
                  : A extends ComponentTypeHeader.Double
                  ? number
                  : A extends ComponentTypeHeader.Float
                  ? number
                  : A extends ComponentTypeHeader.Int16
                  ? number
                  : A extends ComponentTypeHeader.Int32
                  ? number
                  : A extends ComponentTypeHeader.Int64
                  ? number
                  : A extends ComponentTypeHeader.String
                  ? string
                  : never
              : never,
          ...FormatType<V>
      ]
    : never;

export type SendEvents = {
    [K in keyof typeof SendEventsFormat]: FormatType<(typeof SendEventsFormat)[K]>;
};

export default SendEvents;
