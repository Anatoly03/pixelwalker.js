import Config from "./config.js";

const data: Response = await fetch(`${Config.GameServerLink}/message_types`);
const map: string[] = await data.json();

export const MessageTypes: string[] = map;
export default MessageTypes;

///
/// Perform InteliSense Magic if supported by runtime.
///

if (import.meta.dirname) {
    const fs = await import("node:fs");

    fs.writeFileSync(
        import.meta.dirname + "/message-types.d.ts",
        `
// This is auto generated in the project.

export declare const MessageTypes: ${JSON.stringify(MessageTypes)}
export default MessageTypes
`
    );
}
