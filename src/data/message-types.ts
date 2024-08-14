import { GameServerLink } from '../protocol/client.js';
import fs from 'node:fs';

const data: Response = await fetch(`https://${GameServerLink}/message_types`);
const map: string[] = await data.json();

export const MessageTypes: string[] = map;
export default MessageTypes;

if (import.meta.dirname)
    fs.writeFileSync(
        import.meta.dirname + '/message-types.d.ts',
        `
// This is auto generated in the project.

export declare const MessageTypes: ${JSON.stringify(MessageTypes)}
export default MessageTypes
`
    );
