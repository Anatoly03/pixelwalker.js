// import LobbyClient from "../lobby.js";

/**
 * A friend entry as retrieved by the endpoint `/api/friends`
 */
export type Friend = {
    id: string;
    username: Uppercase<string>;
    face: number;
    lastSeen: Date;
    lastWorld: string;
    lastWorldTitle: string;
};

/**
 * A friend request as retrieved by the endpoint `/api/friends/requests`
 */
export type FriendRequest = {
    id: string;
    sender: string;
    receiver: string;
    senderUsername: Uppercase<string>;
    receiverUsername: Uppercase<string>;
};

export default Friend;
