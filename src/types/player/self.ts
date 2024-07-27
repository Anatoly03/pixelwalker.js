import Client from "../../client.js"
import Player, { PlayerInitArgs } from "./player"
import { Bit7, Magic, Boolean, Int32, Double } from "../message-bytes.js"
import { Point } from "../geometry.js"

export type MoveArgs = {
    x: number,
    y: number,
    xVel: number,
    yVel: number,
    xMod: number,
    yMod: number,
    horizontal: -1 | 0 | 1,
    vertical: -1 | 0 | 1,
    space_down: boolean,
    space_just_down: boolean
}

/**
 * ```
 * client.on('start', () => {
 *     client.self.set_god(true)
 * })
 * ```
 */
export class SelfPlayer extends Player {
    #moveTick = 0

    /**
     * @ignore
     */
    constructor(args: PlayerInitArgs) {
        super({...args, ...{
            win: false,
            coins: 0,
            blue_coins: 0,
            deaths: 0,
        }})
    }

    //
    //
    // Setters & Getters
    //
    //

    public set face(value: number) {
        this.client.send(Magic(0x6B), Bit7(Client.MessageId('PlayerFace')), Int32(value))
    }

    public override get pos(): Point {
        return super.pos
    }

    public override set pos(value: [number, number] | { x: number, y: number}) {
        if (Array.isArray(value)) {
            this.move({ x: value[0], y: value[1] })
        } else {
            this.move(value)
        }
    }

    public override set god(value: boolean) {
        if (!this.client.connected)
            throw new Error(`Tried to run \`self.god = ${value}\` on disconnected client.`)
        
        this.client.send(Magic(0x6B), Bit7(Client.MessageId('PlayerGodMode')), Boolean(value))
    }

    public override set mod(value: boolean) {
        if (!this.client.connected)
            throw new Error(`Tried to run \`self.mod = ${value}\` on disconnected client.`)
        if (!this.client.self?.isAdmin)
            throw new Error(`Tried to run \`${this.username}.mod = ${value}\` without having permissions. Are you an admin?`)
        
        this.client.send(Magic(0x6B), Bit7(Client.MessageId('PlayerModMode')), Boolean(value))
    }

    //
    //
    // Methods
    //
    //

    /**
     * 
     * @param content 
     */
    public say(content: string) {
        return this.client.say(content)
    }

    /**
     * @todo Describe how movement arguments work.
     * 
     * ```ts
     * x: number,
     * y: number,
     * xVel: number,
     * yVel: number,
     * xMod: number,
     * yMod: number,
     * horizontal: -1 | 0 | 1,
     * vertical: -1 | 0 | 1,
     * space_down: boolean,
     * space_just_down: boolean
     * ```
     */
    public move(input: Partial<MoveArgs> & Point) {
        const args: MoveArgs = {
            ...{
                xVel: 0,
                yVel: 0,
                xMod: 0,
                yMod: 0,
                horizontal: 0,
                vertical: 0,
                space_down: false,
                space_just_down: false,
            },
            ...input
        }

        return this.client.send(
            Magic(0x6B), Bit7(Client.MessageId('PlayerMoved')),
            Double(args.x), Double(args.y),
            Double(args.xVel), Double(args.yVel),
            Double(args.xMod), Double(args.yMod),
            Int32(args.horizontal), Int32(args.vertical),
            Boolean(args.space_down), Boolean(args.space_just_down),
            Int32(this.#moveTick++)
        )
    }
}