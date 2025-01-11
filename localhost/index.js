// Set the `LOCALHOST` flag to 'true', as in, deroute all client instances
// the `127.0.0.1` instead of `pixelwalker.net`
if (process)
    process.env.LOCALHOST = "true";
else
    throw new Error('Cannot import `pixelwalker.js/localhost` in an environment, where `process` is not defined.');

export * from "../dist/index.js";
