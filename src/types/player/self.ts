import Client from "../../client.js"
import Player, { PlayerInitArgs } from "./player"
import { Bit7, Magic, Boolean, Int32, Double } from "../message-bytes.js"
import { Point } from "../index.js"

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
 * @ignore
 * 
 * ```
 * client.on('start', () => {
 *     client.self.forceGod(true)
 * })
 * ```
 */
export default class SelfPlayer extends Player {
    // constructor(args: PlayerInitArgs) {
    //     super(args)
    //     // super({...args, ...{
    //     //     isSelf: true,
    //     //     win: false,
    //     //     coins: 0,
    //     //     blue_coins: 0,
    //     //     deaths: 0,
    //     // }})
    // }

    //
    //
    // Methods
    //
    //

    /**
     * @todo
     */
    public setFace(value: number) {
        return this.client.send(Magic(0x6B), Bit7(Client.MessageId('PlayerFace')), Int32(value))
    }

    /**
     * @todo
     */
    public override async teleport(to: Point) {
        return this.move(to)
    }

    /**
     * @todo
     */
    public override forceGod(value: boolean, mod: boolean = this.isAdmin) {
        return this.client.send(Magic(0x6B), Bit7(Client.MessageId(mod? 'PlayerModMode' : 'PlayerGodMode')), Boolean(value))
    }

    /**
     * Speak with the current self instance
     */
    public say(content: string) {
        return this.client.say(content)
    }

    /**
     * @ignore
     */
    public touchBlock({ x, y }: Point) {
        return this.client.send(Magic(0x6B), Bit7(Client.MessageId('PlayerTouchBlock')), Int32(x), Int32(y))
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
            Int32(this.getNewTickId())
        )
    }
}