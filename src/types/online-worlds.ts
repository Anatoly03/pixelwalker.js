/**
 * An online world as retrieved by the Game Server.
 */
export type OnlineWorlds = {
    visibleRooms: {
        id: string;
        players: number;
        max_players: number;
        data: {
            title: string;
            description: string;
            plays: number;
            minimapEnabled: boolean;
            type: 0 | 1 | 2;
        };
    }[];
    onlineRoomCount: number;
    onlinePlayerCount: number;
};

export default OnlineWorlds;
