import DataStructure from '../util/data-structure.js';
import Player from './player.js';

export default class PlayerArray extends DataStructure<Player> {
    constructor() {
        super();
    }

    /**
     * @param idx Player ID
     */
    public get(pid: number): Player {
        console.log('Player Array indexed by ' + pid);
        return new Player();
    }

    /*
     * The PlayerArray does not provide setters, hence
     * this method is not to be implemented.
     */
    protected set(idx: number, value: Player): Player {
        throw new Error('Method not implemented.');
    }

    /**
     * 
     */
    public override *iter() {
        yield this[0];
    }
}
