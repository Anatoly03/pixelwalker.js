import { RecordModel } from "pocketbase";

/**
 * A public profile as retrieved by the Pocketbase API.
 *
 * @since 1.4.0
 */
export type PublicProfile = RecordModel & {
    collectionName: "public_profiles";
    admin: boolean;
    banned: boolean;
    face: number;
    username: Uppercase<string>;
};

export default PublicProfile;
