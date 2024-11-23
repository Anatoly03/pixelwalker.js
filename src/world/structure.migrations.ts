export const MIGRATIONS: ((args: any) => any)[] = [];

/**
 * @version FILE_VERSION=0
 */
MIGRATIONS.push((args: any) => {
    if (args["file-version"] !== 0) return args;
    if (args.width === undefined || args.height === undefined || args.palette === undefined || args.layers === undefined) throw new Error("Migration (0 -> 1) Failed: Missing required fields: width, height, palette or layers");

    let foreground = (args.layers.foreground as string).split(" ").map((x) => +x); // [id ]...
    let background = (args.layers.background as string).split(" ").map((x) => +x); // [id ]...
    let data = args.layers.data; // two dimensional array of block ids

    foreground.pop(); // The empty element removed
    background.pop();

    // TODO

    return {
        "file-version": 1,
        meta: args.meta,
        width: args.width,
        height: args.height,
        palette: args.palette,
        layers: [],
    };
});

/**
 * @latest_version
 * @version FILE_VERSION=1
 */
export default function (obj: any): any {
    return MIGRATIONS.reduce((acc, migration) => migration(acc), obj);
}
