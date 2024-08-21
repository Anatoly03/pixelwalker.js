import util from 'util';

export default abstract class IndexOverload<T> {
    [idx: number]: T;

    /**
     * Gets the length of the data structure.
     */
    public get length() {
        return this.toArray().length;
    }

    /**
     * Generates two protected abstract methods
     * `get` and `set` that are aliases for numeric
     * indexed search.
     *
     * ```ts
     * let indexable: IndexOverload
     *
     * indexable[0] = 'Hello'
     * indexable.set(0, 'Hello') // Is the same
     *
     * console.log(indexable[0])
     * console.log(indexable.get(0)) // Is the same
     * ```
     *
     * To expose any of the methods, the visibility
     * needs to be set to `public` from `protected`,
     * or can be kept hidden from outside access.
     *
     * @link https://stackoverflow.com/a/57634753/16002144
     */
    protected constructor() {
        return new Proxy<this>(this, {
            get: (obj: this, key) => {
                if (typeof key === 'string' && Number.isInteger(Number(key)))
                    return obj.get(key as any);
                return obj[key as keyof this];
            },
            set: (obj: this, key, value) => {
                if (typeof key === 'string' && Number.isInteger(Number(key)))
                    return obj.set(key as any, value as any);
                return (obj[key as keyof this] = value);
            },
            deleteProperty: (obj: this, key) => {
                if (typeof key === 'string' && Number.isInteger(Number(key)))
                    return obj.delete(key as any);
                return false;
            },
        });
    }

    /**
     * Method provided by `IndexOverload` class, acts as
     * a redirect for indexed getters.
     *
     * @example
     *
     * ```ts
     * let indexable: IndexOverload
     *
     * console.log(indexable[0])
     * console.log(indexable.get(0)) // Is the same
     * ```
     *
     * @param idx Index of search
     */
    protected abstract get(idx: number): T;

    /**
     * Method provided by `IndexOverload` class, acts as
     * a redirect for indexed setters.
     *
     * @example
     *
     * ```ts
     * let indexable: IndexOverload
     *
     * indexable[0] = 'Hello'
     * indexable.set(0, 'Hello') // Is the same
     * ```
     *
     * @param idx Index of search
     * @param value New value
     */
    protected abstract set(idx: number, value: T): T;

    /**
     * Method provided by `IndexOverload` class, acts as
     * a redirect for the `delete` operator.
     *
     * @example
     *
     * ```ts
     * let indexable: IndexOverload
     *
     * indexable[0] = 5
     * delete indexable[0]
     * ```
     *
     * @param idx Index of search
     */
    protected delete(idx: number): boolean {
        const hath = !!this[idx];
        this[idx] = undefined!;
        return hath;
    }

    /**
     * A method that returns the default iterator for
     * an object. Called by the semantics of the for-of
     * statement.
     */
    public [Symbol.iterator]() {
        return this.iter();
    }

    /**
     * A method that returns an iterator for the current
     * class. This is used by the iterator symbol to generate
     * a for loop from the data structure.
     *
     * @example
     *
     * ```ts
     * class Collection extends DataStructure<number> {
     *   constructor() {
     *     super();
     *     this[0] = 1;
     *     this[1] = 3;
     *     this[2] = 6;
     *   }
     *
     *   public override *iter() {
     *     let i = 0;
     *     while (this[i] !== undefined)
     *       yield this[i++];
     *     return i;
     *   }
     * }
     *
     * for (const element of new Collection()) {
     *   console.log(element);
     * }
     * ```
     */
    protected abstract iter(): Generator<T, unknown, unknown>;

    /**
     * Per default this function is called when printing
     * out the object to the console.
     *
     * @link https://stackoverflow.com/a/40699119/16002144
     */
    public [util.inspect.custom](): string {
        const limit = 10;
        const inspect = this.toArray()
            .splice(0, limit)
            .filter((k: any) => k[util.inspect.custom])
            .join();
        return `[${inspect}${this.length > limit ? ', ...' : ''}]`;
    }

    /**
     * Returns an array of the data structure.
     *
     * @example
     *
     * ```
     * const arr = object.toArray(); // [T1, T2, ...]
     * ```
     */
    protected toArray(): T[] {
        return Array.from(this.iter());
    }

    /**
     * Returns a string representation of the data structure.
     * The return string can either by array like or entirely
     * different.
     *
     * The same method is called when printing out to the
     * console.
     *
     * @example
     *
     * ```
     * console.log(object.toString()); // [T1, T2, ...]
     * ```
     */
    public toString(): string {
        return this.toArray().toString();
    }
}
