/**
 * @since 1.4.7
 */
export type WorldMeta = {
    owner: Uppercase<string>;
    title: string;
    description: string;
    plays: number;
    width: number;
    height: number;
};

export default WorldMeta;
