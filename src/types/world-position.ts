import LayerPosition from "./layer-position.js";

/**
 * @since 1.4.3
 */
export type WorldPosition = LayerPosition & {
    layer: number;
};

export default WorldPosition;
