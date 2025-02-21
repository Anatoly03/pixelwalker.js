import WorldPosition from "../types/world-position.js";
import Structure from "./structure.js";

/**
 * Paste the structure all at once, we do not care about
 * order of paste or timeouts.
 */
export function* ALL_AT_ONCE(structure: Structure) {
    const positions: WorldPosition[] = [];

    for (const [layer, l] of structure.layers()) {
        for (const [tx, ty, _] of l.blocks()) {
            positions.push({ x: tx, y: ty, layer });
        }
    }

    yield positions;
}

/**
 * Paste the structure from left to right, top to bottom.
 */
export function* TOPLEFT_TO_BOTTOMRIGHT_HORIZONTAL(structure: Structure) {
    for (let y = 0; y < structure.height; y++) {
        for (let x = 0; x < structure.width; x++) {
            const positions: WorldPosition[] = [];

            for (const [layer, _] of structure.layers()) {
                positions.push({ x, y, layer });
            }

            yield positions;
        }
    }
}

/**
 * Paste the structure from left to right, top to bottom.
 */
export function* TOPLEFT_TO_BOTTOMRIGHT_VERTICAL(structure: Structure) {
    for (let y = 0; y < structure.height; y++) {
        for (let x = 0; x < structure.width; x++) {
            const positions: WorldPosition[] = [];

            for (const [layer, _] of structure.layers()) {
                positions.push({ x, y, layer });
            }

            yield positions;
        }
    }
}
