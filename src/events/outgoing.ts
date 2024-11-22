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
 * The `PlayerChatMessage` can be sent to write to the chat.
 *
 * | Index | Type | Description |
 * | --- | --- | --- |
 * | 0 | `string` | Content of the chat message |
 */
export const PlayerChatMessage = [ComponentTypeHeader.String] as const;

export const SendEventsFormat = {
    PlayerInit,
    // PlayerUpdateRights: [],
    // UpdateWorldMetadata: [],
    // PerformWorldAction: [],
    // WorldCleared: [],
    // WorldReloaded: [],
    // WorldBlockPlaced: [],
    // WorldBlockFilled: [],
    PlayerChatMessage,
    // OldChatMessages: [],
    // SystemMessage: [],
    // PlayerJoined: [],
    // PlayerLeft: [],
    // PlayerMoved: [],
    // PlayerTeleported: [],
    // PlayerFace: [],
    // PlayerGodMode: [],
    // PlayerModMode: [],
    // PlayerRespawn: [],
    // PlayerReset: [],
    // PlayerTouchBlock: [],
    // PlayerTouchPlayer: [],
    // PlayerAddEffect: [],
    // PlayerRemoveEffect: [],
    // PlayerResetEffects: [],
    // PlayerTeam: [],
    // PlayerCounters: [],
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
