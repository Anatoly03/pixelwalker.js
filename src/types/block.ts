
import { SpecialBlockData } from "../data/consts.js"
import { BlockMappings, BlockMappingsReverse } from "../data/mappings.js"

export type WorldPosition = [number, number, 0 | 1]

export default class Block {
    public id: number
    public data: any[] = []
    
    constructor(id: number | string) {
        if (typeof id == 'string') {
            id = BlockMappings[id]
        }
        this.id = id
    }

    public isSameAs(other: Block | string | number | null) {
        if (other == null) return false
        if (typeof other == 'number') other = new Block(other)
        if (typeof other == 'string') other = new Block(other)
        if (this.id != other.id) return false
        if (this.data.length != other.data.length) return false
        for (let i = 0; i < this.data.length; i++)
            if (this.data[i] != other.data[i]) return false
        return true
    }

    public isNotSameAs(other: Block | string | number | null) {
        return !this.isSameAs(other)
    }

    public get name(): string {
        return BlockMappingsReverse[this.id]
    }

    public get data_count(): number {
        if (SpecialBlockData[this.name] == undefined) return 0
        return SpecialBlockData[this.name].length
    }
}
