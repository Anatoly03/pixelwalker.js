
import { BlockMappings, BlockMappingsReverse } from "./mappings.js"

export default class Block {
    public id: number
    public data: any[] = []
    
    constructor(id: number | string) {
        if (typeof id == 'string') {
            id = BlockMappings[id]
        }
        this.id = id
    }

    public get name(): string {
        return BlockMappingsReverse[this.id]
    }
}
