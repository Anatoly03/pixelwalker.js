
import { BlockMappings, BlockMappingsReverse } from "../mappings.js"

export default class Block {
    public id: number
    public data: any[] = []
    
    constructor(id: number | string) {
        if (typeof id == 'string') {
            id = BlockMappings[id]
        }
        this.id = id
    }

    public isSameAs(other: Block) {
        if (this.id != other.id) return false
        if (this.data.length != other.data.length) return false
        for (let i = 0; i < this.data.length; i++)
            if (this.data[i] != other.data[i]) return false
        return true
    }

    public get name(): string {
        return BlockMappingsReverse[this.id]
    }
}
