import { RecordModel } from 'pocketbase';

/**
 * A public world as retrieved by the Pocketbase API.
 */
export type PublicWorld = RecordModel & {
    collectionName: 'public_worlds';
    minimap: string;
    owner: string;
    title: string;
    description: string;
    plays: number;
    width: number;
    height: number;
};

export default PublicWorld;