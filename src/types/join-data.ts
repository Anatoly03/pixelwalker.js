export type JoinData = Partial<{
    world_title: string;
    world_width: 636 | 400 | 375 | 350 | 325 | 300 | 275 | 250 | 225 | 200 | 175 | 150 | 125 | 100 | 75 | 50;
    world_height: 400 | 375 | 350 | 325 | 300 | 275 | 250 | 225 | 200 | 175 | 150 | 125 | 100 | 75 | 50;
    spawnId: number;
}>;

export default JoinData;
