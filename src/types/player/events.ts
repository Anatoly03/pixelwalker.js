import Client from "../../client/client";
import { GamePlayerArray } from "../list/player";
import { Magic, Bit7 } from "../message-bytes";
import Player from "./player";
import SelfPlayer from "./self";

export default (client: Client) => {
    /**
     * PlayerEvents are all player-associated events. Their first
     * component is always the player id.
     */
    const PlayerEvents = ['UpdateRights',  'ChatMessage',  'PlayerMoved',  'PlayerTeleported',  'PlayerFace',  'PlayerGodMode',  'PlayerModMode',  'PlayerRespawn',  'PlayerReset',  'PlayerTouchBlock',  'PlayerTouchPlayer',  'PlayerEffect',  'PlayerRemoveEffect',  'PlayerResetEffects',  'PlayerTeam',  'PlayerCounters',  'PlayerLocalSwitchChanged',  'PlayerLocalSwitchReset'] as const
        
    /**
     * The array of all players in the client instance.
     */
    const players = new GamePlayerArray<true>()

    /**
     * Initialize the self player in the array.
     */
    client.raw.once('PlayerInit', async ([id, cuid, username, face, isAdmin, x, y, name_color, can_edit, can_god, title, plays, owner, global_switch_states, width, height, buffer]) => {
        await client.send(Magic(0x6B), Bit7(Client.MessageId('PlayerInit')))
        const player = client.self = new SelfPlayer({ client, id, cuid, username, face, isSelf: false, isAdmin, x: x / 16, y: y / 16, god: false, mod: false, crown: false, win: false, coins: 0, blue_coins: 0, deaths: 0, can_edit, can_god, team: 0 })
        players.push(player)
    })

    /**
     * Add joining players to the array.
     */
    client.raw.on('PlayerJoined', ([id, cuid, username, face, isAdmin, can_edit, can_god, x, y, color, coins, blue_coins, deaths, collected, god, mod, crown, win, team, switches]) => {
        const player = new Player({ client, id, cuid, username, face, isSelf: false, isAdmin, x: x / 16, y: y / 16, god, mod, crown, win, coins, blue_coins, deaths, can_edit, can_god, team })
        players.push(player)
        // TODO emit player joined
    })

    /**
     * Remove leaving players from the array.
     */
    client.raw.on('PlayerLeft', ([id]) => {
        const removedPlayers = players.remove_all(p => p.id == id)
        // TODO emit player left
    })

    /**
     * Broadcast all player events to the player.
     */
    PlayerEvents.forEach(message => client.raw.on(message, ([id, ...args]: any) => {
        try {
            // TODO change to !
            client.players.byId(id)?.emit(message, args)
        } catch (e) {
            throw new Error(`At message=${message} with Player ID ${id}: ` + e)
        }
    }))

    return players
}