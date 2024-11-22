/**
 * The `PlayerInit` event is the first emitted event from the server and it is emitted only once.
 *
 * | Index | Type | Description |
 * | --- | --- | --- |
 * | 0 | `number` | Player Id |
 * | 1 | `string` | Connected User Id |
 * | 2 | `string` | Player Username |
 */
export type PlayerInit = [
    number, // Player Id
    string, // Connected User Id
    Uppercase<string>, // Player Username
    number, // Player Face Id
    boolean, // Is Player Admin
    number, // Player X
    number, // Player Y
    number, // Chat Colour
    boolean, // Is World Owner
    boolean, // Can Edit
    boolean, // Can God
    string, // Room Title
    number, // Plays
    string, // Owner
    string, // Description
    "public" | "private" | "hidden" | "friends", // Visibility
    boolean, // Is Unsaved
    boolean, // Has Unsaved Changes
    number[], // Global Switch States
    number, // Width
    number, // Height
    number[] // World Data
];

/**
 * The `PlayerChatMessage` event is emitted on every chat message.
 *
 * | Index | Type | Description |
 * | --- | --- | --- |
 * | 0 | `number` | Player Id |
 * | 1 | `string` | Content |
 */
export type PlayerChatMessage = [
    number, // Player Id
    string, // Message
];

export type ReceiveEvents = {
    PlayerInit: PlayerInit;

    PlayerUpdateRights: [];

    UpdateWorldMetadata: [];

    PerformWorldAction: [];

    WorldCleared: [];

    WorldReloaded: [];

    WorldBlockPlaced: [];

    WorldBlockFilled: [];

    PlayerChatMessage: PlayerChatMessage;

    OldChatMessages: [];

    SystemMessage: [];

    PlayerJoined: [];

    PlayerLeft: [];

    PlayerMoved: [];

    PlayerTeleported: [];

    PlayerFace: [];

    PlayerGodMode: [];

    PlayerModMode: [];

    PlayerRespawn: [];

    PlayerReset: [];

    PlayerTouchBlock: [];

    PlayerTouchPlayer: [];

    PlayerAddEffect: [];

    PlayerRemoveEffect: [];

    PlayerResetEffects: [];

    PlayerTeam: [];

    PlayerCounters: [];

    PlayerLocalSwitchChanged: [];

    PlayerLocalSwitchReset: [];

    GlobalSwitchChanged: [];

    GlobalSwitchReset: [];

    PlayerDirectMessage: [];
};

export default ReceiveEvents;
