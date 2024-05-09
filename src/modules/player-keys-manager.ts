import { Client, Player } from "..";
import { EventEmitter } from 'events'

interface KeyEvents {
    'space:up': [Player]
    'space:down': [Player]
    'up:up': [Player]
    'up:down': [Player]
    'left:up': [Player]
    'left:down': [Player]
    'down:up': [Player]
    'down:down': [Player]
    'right:up': [Player]
    'right:down': [Player]
}

class LocalPlayer {
    public readonly id: number
    public horizontal: -1 | 0 | 1 | undefined
    public vertical: -1 | 0 | 1 | undefined
    public space_down: boolean | undefined
    public space_just_down: boolean | undefined

    constructor(id: number) {
        this.id = id
    }
}

/**
 * This module generates a module function that will log certain events.
 */
export default function Module (callback: (v: EventEmitter<KeyEvents>) => EventEmitter<KeyEvents>) {
    let event_emitter = callback(new EventEmitter())
    let players = new Map<number, LocalPlayer>()

    function Module (client: Client): Client {
        client.raw.on('playerJoined', ([pid]) => {
            return players.set(pid, new LocalPlayer(pid))
        })

        client.raw.on('playerLeft', ([pid]) => {
            return players.delete(pid)
        })

        client.raw.on('playerMoved', ([pid, x, y, speed_x, speed_y, mod_x, mod_y, horizontal, vertical, space_down, space_just_down, tick_id]) => {
            let local_player = players.get(pid) as LocalPlayer
            let player = client.players.get(pid) as Player

            if (local_player.horizontal != horizontal) {
                if (local_player.horizontal == -1)
                    event_emitter.emit('left:up', player)
                else if (local_player.horizontal == 1)
                    event_emitter.emit('right:up', player)

                if (horizontal == -1)
                    event_emitter.emit('left:down', player)
                else if (horizontal == 1)
                    event_emitter.emit('right:down', player)
            }

            if (local_player.vertical != vertical) {
                if (local_player.vertical == -1)
                    event_emitter.emit('up:up', player)
                else if (local_player.vertical == 1)
                    event_emitter.emit('down:up', player)

                if (vertical == -1)
                    event_emitter.emit('up:down', player)
                else if (vertical == 1)
                    event_emitter.emit('down:down', player)
            }

            if (space_down && space_just_down)
                event_emitter.emit('space:down', player)

            if (space_down == false && space_just_down == false && local_player.space_down == true)
                event_emitter.emit('space:up', player)


            // TODO if (player.mod_x != undefined && player.mod_x != mod_x) // hit key right or left
            // TODO if (player.mod_y != undefined && player.mod_y != mod_y) // hit key up or down
            // TODO hit space

            local_player.horizontal = horizontal
            local_player.vertical = vertical
            local_player.space_down = space_down
            local_player.space_just_down = space_just_down

            return
        })

        return client
    }

    // Module.prototype.on = event_manager.on
    // Module.prototype.once = event_manager.once
    // Module.prototype.off = event_manager.off

    return Module
}

