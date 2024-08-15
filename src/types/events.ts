import { BlockMappingsReverse } from '../data/block-mappings.js';

// Utility

/**
 * https://stackoverflow.com/a/70307091/16002144
 */
type Enumerate<
    N extends number,
    Acc extends number[] = []
> = Acc['length'] extends N
    ? Acc[number]
    : Enumerate<N, [...Acc, Acc['length']]>;

/**
 * A PlayerID is a unique number capturing a player instance in
 * a world.
 */
export type PlayerId = number;

/**
 * A BlockID is a number that uniquely identifiers a block type.
 */
export type BlockId = 0 | keyof typeof BlockMappingsReverse;

/**
 * A Player ConnectUserId captures a players' account id in the
 * entire game. Every player is uniquely correlated with one CUID.
 */
export type PlayerConnectUserId = string;

/**
 * A Player username
 */
export type PlayerUsername = Uppercase<string>;

/**
 * A Player Face Id. The smiley which is played with by the player.
 */
export type PlayerFaceId = Enumerate<19>;

/**
 * The player admin state. If set, the player is an admim.
 */
export type IsPlayerAdmin = true | false;

/**
 * The player edit rights. If set, the player has
 * authority to edit the world.
 */
export type PlayerEditRights = true | false;

/**
 * The player god rights. If set, the player has the ability
 * to fly over blocks in the world.
 */
export type PlayerGodRights = true | false;

/**
 * The player ID of the team.
 * 0 - No Team
 * 1 - Red
 * 2 - Green
 * 3 - Blue
 * 4 - Cyan
 * 5 - Magenta
 * 6 - Yellow
 */
export type TeamId = Enumerate<7>;

/**
 * A team identifier is anything that can represent a team uniquely.
 * This consists of the team ID's and their string correspondents.
 */
export type TeamIdentifier =
    | 'red'
    | 'green'
    | 'blue'
    | 'cyan'
    | 'magenta'
    | 'yellow'
    | 'none'
    | TeamId;

/**
 * The title of the world.
 */
export type WorldTitle = string;

/**
 * The amount of times a world was played according to the
 * metadata of the level.
 */
export type WorldPlays = number;

//
//
// Events
//
//

/**
 * @event "PlayerInit"
 */
export type PlayerInit = [
    PlayerId,
    PlayerConnectUserId,
    PlayerUsername,
    PlayerFaceId,
    IsPlayerAdmin,
    number,
    number,
    number,
    PlayerEditRights,
    PlayerGodRights,
    string,
    number,
    PlayerUsername,
    Buffer,
    number,
    number,
    Buffer
];

/**
 * @event "UpdateRights"
 */
export type UpdateRights = [PlayerId, PlayerEditRights, PlayerGodRights];

/**
 * @event "WorldMetadata"
 */
export type UpdateWorldMetadata = [WorldTitle, WorldPlays, PlayerUsername];

/**
 * @event "PerformWorldAction"
 */
export type PerformWorldAction = []; // TODO

/**
 * @event "WorldCleared"
 */
export type WorldCleared = [];

/**
 * @event "WorldReloaded"
 */
export type WorldReloaded = [Buffer];

/**
 * @event "WorldBlockPlaced"
 */
export type WorldBlockPlaced = [PlayerId, number, number, BlockId];

/**
 * @event "ChatMessage"
 */
export type ChatMessage = [PlayerId, string];

/**
 * @event "OldChatMessages"
 */
export type OldChatMessages = [] | [PlayerUsername, string, number, ...OldChatMessages[]];

/**
 * @event "SystemMessage"
 */
export type SystemMessage = [string];

/**
 * @event "PlayerJoined"
 */
export type PlayerJoined = [
    PlayerId,
    PlayerConnectUserId,
    PlayerUsername,
    PlayerFaceId,
    IsPlayerAdmin,
    PlayerEditRights,
    PlayerGodRights,
    number,
    number,
    number,
    number,
    number,
    number,
    Buffer,
    boolean,
    boolean,
    boolean,
    boolean,
    TeamId,
    Buffer
];

/**
 * @event "PlayerLeft"
 */
export type PlayerLeft = [PlayerId];

/**
 * @event "PlayerMoved"
 */
export type PlayerMoved = [];

/**
 * @event "PlayerTeleported"
 */
export type PlayerTeleported = [PlayerId, number, number];

/**
 * @event "PlayerFace"
 */
export type PlayerFace = [PlayerId, PlayerFaceId];

/**
 * @event "PlayerGodMode"
 */
export type PlayerGodMode = [PlayerId, boolean];

/**
 * @event "PlayerModMode"
 */
export type PlayerModMode = [PlayerId, boolean];

/**
 * @event "PlayerRespawn"
 */
export type PlayerRespawn = [PlayerId, number, number];

/**
 * @event "PlayerReset"
 */
export type PlayerReset = [PlayerId, number, number] | [PlayerId];

/**
 * @event "PlayerTouchBlock"
 */
export type PlayerTouchBlock = [PlayerId, number, number];

/**
 * @event "PlayerTouchPlayer"
 */
export type PlayerTouchPlayer = [PlayerId, PlayerId, 0 | 1];

// TODO "PlayerAddEffect",
// TODO "PlayerRemoveEffect",
// TODO "PlayerResetEffects",

/**
 * @event "PlayerTeam"
 */
export type PlayerTeam = [PlayerId, TeamId];

/**
 * @event "PlayerCounters"
 */
export type PlayerCounters = [PlayerId, number, number, number];

// TODO "PlayerLocalSwitchChanged",
// TODO "PlayerLocalSwitchReset",
// TODO "GlobalSwitchChanged",
// TODO "GlobalSwitchReset",

/**
 * @event "PlayerDirectMessage"
 */
export type PlayerDirectMessage = [PlayerId, string];

/**
 *
 */
export type PixelwalkerEvents = {
    PlayerInit: PlayerInit;
    UpdateRights: UpdateRights;
    UpdateWorldMetadata: UpdateWorldMetadata;
    PerformWorldAction: PerformWorldAction;
    WorldCleared: WorldCleared;
    WorldReloaded: WorldReloaded;
    WorldBlockPlaced: WorldBlockPlaced;
    ChatMessage: ChatMessage;
    OldChatMessages: OldChatMessages;
    SystemMessage: SystemMessage;
    PlayerJoined: PlayerJoined;
    PlayerLeft: PlayerLeft;
    PlayerMoved: PlayerMoved;
    PlayerTeleported: PlayerTeleported;
    PlayerFace: PlayerFace;
    PlayerGodMode: PlayerGodMode;
    PlayerModMode: PlayerModMode;
    PlayerRespawn: PlayerRespawn;
    PlayerReset: PlayerReset;
    PlayerTouchBlock: PlayerTouchBlock;
    PlayerTouchPlayer: PlayerTouchPlayer;
    PlayerAddEffect: PlayerAddEffect;
    PlayerRemoveEffect: PlayerRemoveEffect;
    PlayerResetEffects: PlayerResetEffects;
    PlayerTeam: PlayerTeam;
    PlayerCounters: PlayerCounters;
    PlayerLocalSwitchChanged: PlayerLocalSwitchChanged;
    PlayerLocalSwitchReset: PlayerLocalSwitchReset;
    GlobalSwitchChanged: GlobalSwitchChanged;
    GlobalSwitchReset: GlobalSwitchReset;
    PlayerDirectMessage: PlayerDirectMessage;
};

export default PixelwalkerEvents;
