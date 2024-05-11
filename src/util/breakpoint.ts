
type BreakpointType<V, E> = {
    wait: () => Promise<V>
    time: (ms: number, arg?: V) => number
    accept: (v?: V) => Promise<V>
    reject: (e?: E) => Promise<V>
}

export function Breakpoint<V, E>(): BreakpointType<V, E> {
    const that: any = {}
    const promises: [(value?: V) => void, (reason?: E) => void][] = []
    const timeouts: NodeJS.Timeout[] = []

    function accept(v?: V) {
        timeouts.forEach(clearTimeout)
        promises.forEach(p => p[0](v))
    }

    function reject(e?: E) {
        timeouts.forEach(clearTimeout)
        promises.forEach(p => p[1](e))
    }

    that.wait = () => new Promise((res, rej) => promises.push([res, rej] as ((typeof promises)[number])))
    that.time = (ms: number, arg?: V) => timeouts.push(setTimeout(accept, ms, arg))
    that.accept = accept
    that.reject = reject

    return that as BreakpointType<V, E>
}