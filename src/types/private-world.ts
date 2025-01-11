import { RecordModel } from "pocketbase";

/**
 * A public world as retrieved by the Pocketbase API.
 *
 * @since 1.4.0
 */
export type PrivateWorld = RecordModel & {
    collectionId: "omma7comumpv34j";
    collectionName: "worlds";
    id: string;
    minimap: string;
    minimapEnabled: boolean;
    created: string;
    updated: string;
    visibility: "public" | "unlisted" | "friends" | "private";
    data: string;
    owner: string;
    title: string;
    description: string;
    plays: number;
    width: number;
    height: number;
};

export default PrivateWorld;
