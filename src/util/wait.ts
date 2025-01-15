/**
 * @param ms The number of milliseconds to wait
 */
export default function wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
