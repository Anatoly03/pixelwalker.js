import Config from './config.js';
import fs from 'node:fs';

const data: Response = await fetch(`https://${Config.GameServerLink}/listroomtypes`);
const map: string[] = await data.json();

export const RoomTypes: string[] = map;
export default RoomTypes;

if (import.meta.dirname)
    fs.writeFileSync(
        import.meta.dirname + '/room-types.d.ts',
        `
// This is auto generated in the project.
export declare const RoomTypes: (${RoomTypes.map((v) => `"${v}"`).join(
            ' | '
        )})[]
export default RoomTypes
`
    );