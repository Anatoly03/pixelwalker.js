
export default class Block {
    public id: number
    
    constructor(id: number | string) {
        if (typeof id == 'string') {
            id = World.mappings[id]
        }
        this.id = id
    }

    get name() {
        return World.reverseMapping[this.id]
    }
}