/**
 * The `PlayerInit` event is the first emitted event from the server and it is emitted only once.
 *
 * | Index | Type | Description |
 * | --- | --- | --- |
 * | 0 | `number` | Player Id |
 * | 1 | `string` | Connected User Id |
 * | 2 | `string` | Player Username |
 * | 3 | `number` | Player Face Id |
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
    string // Message
];

/**
 * The `PlayerJoined` event is emitted when a player joins the room.
 * 
 * | Index | Type | Description |
 * | --- | --- | --- |
 * | 0 | `number` | Player Id |
 * | 1 | `string` | Connected User Id |
 * | 2 | `string` | Player Username |
 * | 3 | `number` | Player Face Id |
 */
export type PlayerJoined = [
    number, // Player Id
    string, // Connected User Id
    Uppercase<string>, // Player Username
    number, // Player Face Id
    boolean, // Is Admin
    boolean, // Is Friend
    boolean, // Is Owner
    boolean, // Has God
    boolean, // Has Edit
    number, // Player X
    number, // Player Y
    number, // Chat Colour
    number, // Coins
    number, // Blue Coins
    number, // Deaths
    Buffer, // Collected Items
    boolean, // Godmode
    boolean, // Modmode
    boolean, // Has Crown
    boolean, // Has Completed World
    number, // Team
    Buffer // Switch Buffer
];

/**
 * The `PlayerLeft` event is emitted when a player leaves the room.
 * 
 * | Index | Type | Description |
 * | --- | --- | --- |
 * | 0 | `number` | Player Id |
 */
export type PlayerLeft = [
    number, // Player Id
];

/**
 * The `PlayerFace` event is emitted when a player leaves the room.
 * 
 * | Index | Type | Description |
 * | --- | --- | --- |
 * | 0 | `number` | Player Id |
 * | 1 | `number` | Face Id |
 */
export type PlayerFace = [
    number, // Player Id
    number, // Face Id
];

/**
 * The `PlayerGodMode` event is emitted when a player enables god mode.
 * 
 * | Index | Type | Description |
 * | --- | --- | --- |
 * | 0 | `number` | Player Id |
 * | 1 | `boolean` | Enabled |
 */
export type PlayerGodMode = [
    number, // Player Id
    boolean, // God Mode Enabled
];

/**
 * The `PlayerModMode` event is emitted when a player enables moderator mode.
 * 
 * | Index | Type | Description |
 * | --- | --- | --- |
 * | 0 | `number` | Player Id |
 * | 1 | `boolean` | Enabled |
 */
export type PlayerModMode = [
    number, // Player Id
    boolean, // Mod Mode Enabled
];

/**
 * The `PlayerRespawn` event is emitted when a player respawns.
 * 
 * | Index | Type | Description |
 * | --- | --- | --- |
 * | 0 | `number` | Player Id |
 * | 1 | `number` | Player X |
 * | 2 | `number` | Player Y |
 */
export type PlayerRespawn = [
    number, // Player Id
    number, // Player X
    number, // Player Y
];

/**
 * The `PlayerReset` event is emitted when a player resets. This
 * event has several overloads depending on wether the player also
 * respawns or not. The player is reset without coordinates in god
 * or mod mode.
 * 
 * | Index | Type | Description |
 * | --- | --- | --- |
 * | 0 | `number` | Player Id |
 * 
 * | Index | Type | Description |
 * | --- | --- | --- |
 * | 0 | `number` | Player Id |
 * | 1 | `number` | Player X |
 * | 2 | `number` | Player Y |
 */
export type PlayerReset = [
    number, // Player Id
] | [
    number, // Player Id
    number, // Player X
    number, // Player Y
]

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

    PlayerJoined: PlayerJoined;
    PlayerLeft: PlayerLeft;

    PlayerMoved: [];

    PlayerTeleported: [];

    PlayerFace: PlayerFace;
    PlayerGodMode: PlayerGodMode;
    PlayerModMode: PlayerModMode;
    PlayerRespawn: PlayerRespawn;
    PlayerReset: PlayerReset;

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
