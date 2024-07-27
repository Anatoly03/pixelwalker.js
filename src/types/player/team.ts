
/**
 * A team identifier is anything that can represent a team uniquely.
 */
export type TeamIdentifier = 'red' | 'green' | 'blue' | 'cyan' | 'magenta' | 'yellow' | 'none' | 0 | 1 | 2 | 3 | 4 | 5 | 6

/**
 * The Team object is a number that includes a getter for team management.
 */
export class Team extends Number implements Number {
    constructor(value: TeamIdentifier) {
        switch (value) {
            case 'none':
                super(0)
                break
            case 'red':
                super(1)
                break
            case 'green':
                super(2)
                break
            case 'blue':
                super(3)
                break
            case 'cyan':
                super(4)
                break
            case 'magenta':
                super(5)
                break
            case 'yellow':
                super(6)
                break
            default: 
                super(value)
        }
    }

    public get name() {
        switch (this.valueOf()) {
            case 1: return 'red'
            case 2: return 'green'
            case 3: return 'blue'
            case 4: return 'cyan'
            case 5: return 'magenta'
            case 6: return 'yellow'
            default: return 'none'
        }
    }
}