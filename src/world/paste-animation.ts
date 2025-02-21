import WorldPosition from "../types/world-position.js";
import Structure from "./structure.js";

/**
 * Use a random structure paste animation, of the available pixelwalker implementations.
 */
export function RANDOM(structure: Structure) {
    const Animations = [
        ALL_AT_ONCE,
        TOPLEFT_TO_BOTTOMRIGHT_HORIZONTAL,
        TOPLEFT_TO_BOTTOMRIGHT_VERTICAL,
        SPIRAL_CLOCKWISE,
    ];

    const f = Animations[(Math.random() * Animations.length) | 0];
    return f(structure);
}

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
 * Paste the structure from top to bottom, left to right.
 */
export function* TOPLEFT_TO_BOTTOMRIGHT_VERTICAL(structure: Structure) {
    for (let x = 0; x < structure.width; x++) {
        for (let y = 0; y < structure.height; y++) {
            const positions: WorldPosition[] = [];

            for (const [layer, _] of structure.layers()) {
                positions.push({ x, y, layer });
            }

            yield positions;
        }
    }
}

/**
 * Places the blocks in a clockwise rectangular spiral.
 */
export function* SPIRAL_CLOCKWISE(structure: Structure) {
    let topRead = 0;
    let rightRead = structure.width - 1;
    let bottomRead = structure.height - 1;
    let leftRead = 0;

    while (true) {
        let modified = false;

        // Left -> Right
        for (let x = leftRead; x <= rightRead; x++) {
            const positions: WorldPosition[] = [];

            for (const [layer, _] of structure.layers()) {
                positions.push({ x, y: topRead, layer });
            }

            modified = true;
            yield positions;
        }

        // Top -> Bottom
        for (let y = topRead + 1; y <= bottomRead; y++) {
            const positions: WorldPosition[] = [];

            for (const [layer, _] of structure.layers()) {
                positions.push({ x: rightRead, y, layer });
            }

            modified = true;
            yield positions;
        }

        // Right -> Left
        for (let x = rightRead - 1; x >= leftRead; x--) {
            const positions: WorldPosition[] = [];

            for (const [layer, _] of structure.layers()) {
                positions.push({ x, y: bottomRead, layer });
            }

            modified = true;
            yield positions;
        }

        // Bottom -> Top
        for (let y = bottomRead - 1; y > topRead; y--) {
            const positions: WorldPosition[] = [];

            for (const [layer, _] of structure.layers()) {
                positions.push({ x: leftRead, y, layer });
            }

            modified = true;
            yield positions;

            if (y === topRead + 1) break;
        }

        topRead++;
        rightRead--;
        bottomRead--;
        leftRead++;

        if (!modified) break;
    }
}
