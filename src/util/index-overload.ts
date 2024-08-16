export default abstract class IndexOverload<T> {
    [idx: number]: T;

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
    constructor() {
        return new Proxy(this, {
            get: (obj: this, key) => {
                if (typeof key === 'string' && Number.isInteger(Number(key)))
                    return obj.get(key as any);
                else return obj[key as keyof this];
            },
            set: (obj: this, key, value) => {
                if (typeof key === 'string' && Number.isInteger(Number(key)))
                    return obj.set(key as any, value as any);
                else return (obj[key as keyof this] = value);
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
}
