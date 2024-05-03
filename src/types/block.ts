
import { SpecialBlockData } from "../data/consts.js"
import { BlockMappings, BlockMappingsReverse } from "../data/mappings.js"

export type WorldPosition = [number, number, 0 | 1]
export type BlockIdentifier = keyof typeof BlockMappings | Block | number | string | null

export default class Block {
    public id: number
    public data: any[] = []
    
    constructor(id?: BlockIdentifier) {
        if (id == null || id == undefined) id = 0

        switch (typeof id) {
            case 'string':
                id = BlockMappings[id]
            case 'number':
                this.id = id
                break
            case 'object':
                this.id = id.id || 0
                this.data = id.data || []
        }
    }

    public isSameAs(other?: BlockIdentifier) {
        const block = new Block(other)
        if (this.id != block.id) return false
        if (this.data.length != block.data.length) return false
        for (let i = 0; i < this.data.length; i++)
            if (this.data[i] != block.data[i]) return false
        return true
    }

    public isNotSameAs(other?: BlockIdentifier) {
        return !this.isSameAs(other)
    }

    public get name(): keyof typeof BlockMappings {
        return BlockMappingsReverse[this.id]
    }

    public get data_count(): number {
        if (SpecialBlockData[this.name] == undefined) return 0
        return SpecialBlockData[this.name].length
    }
}
