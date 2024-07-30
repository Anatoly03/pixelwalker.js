
import { SpecialBlockData } from "../../../data/consts.js"
import { BlockMappings, BlockMappingsReverse } from "./mappings.js"
import palette_fix from './palette_fix.js'
import { BlockIdentifier } from "../../index.js"

export default class Block {
    public id!: number
    public data: any[] = []

    /**
     * @returns The empty block, which is the default block in a world
     * and also the eraser.
     */
    public static get [0]() {
        return new Block(0)
    }

    public static get ['empty']() {
        return new Block(0)
    }

    /**
     * @returns a new Block defined by its' identifier.
     */
    public static new(id: BlockIdentifier) {
        throw new Error('Not Implemented') // TODO make the constructor secret
    }
    
    constructor(id: BlockIdentifier) {
        if (!id) id = 0

        switch (typeof id) {
            case 'string': // as type `keyof typeof BlockMappings`
                this.id = BlockMappings[(palette_fix[id as keyof typeof palette_fix]) ?? id]
            case 'number':
                this.id = id as number
                break
            case 'object':
                this.id = id.id || 0
                this.data = id.data || []
        }

    }

    public isSameAs(other: BlockIdentifier) {
        const block = new Block(other)
        if (this.id != block.id) return false
        if (this.data.length != block.data.length) return false
        for (let i = 0; i < this.data.length; i++)
            if (this.data[i] != block.data[i]) return false
        return true
    }

    public isNotSameAs(other: BlockIdentifier) {
        return !this.isSameAs(other)
    }

    public get name(): keyof typeof BlockMappings & string {
        return BlockMappingsReverse[this.id]
    }

    public get data_count(): number {
        if (SpecialBlockData[this.name] == undefined) return 0
        return SpecialBlockData[this.name].length
    }
}
