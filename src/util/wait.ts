/**
 * Sleep current event loop for a certain amount of time.
 */
export default (condition: number = 5) => new Promise((res) => setTimeout(res, condition));
