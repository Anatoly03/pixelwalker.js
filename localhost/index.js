/**
 * If the `LOCALHOST` environment is set, then the API & Game server
 * links will be local URLs corresponding with the ports of API and Game
 * server.
 *
 * @example
 *
 * ```ts
 * import Client from 'pixelwalker.js/local'
 * ```
 */
process.env.LOCALHOST = "true";

export * from "../dist/index.js";
