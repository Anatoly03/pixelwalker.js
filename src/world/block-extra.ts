import { ComponentTypeHeader } from "../util/buffer-reader.js";

/**
 * This mapping contains definitins of block data which require additional
 * arguments to be sent or received with.
 */
export const BlockArgs = {
    coin_gold_door: [ComponentTypeHeader.Int32],
    coin_blue_door: [ComponentTypeHeader.Int32],
    coin_gold_gate: [ComponentTypeHeader.Int32],
    coin_blue_gate: [ComponentTypeHeader.Int32],

    effects_jump_height: [ComponentTypeHeader.Int32],
    effects_fly: [ComponentTypeHeader.Boolean],
    effects_speed: [ComponentTypeHeader.Int32],
    effects_invulnerability: [ComponentTypeHeader.Boolean],
    effects_curse: [ComponentTypeHeader.Int32],
    effects_zombie: [ComponentTypeHeader.Int32],
    effects_gravityforce: [ComponentTypeHeader.Int32],
    effects_multi_jump: [ComponentTypeHeader.Int32],
    // gravity effects no data
    // effects off
    // effects zombie

    tool_portal_world_spawn: [ComponentTypeHeader.Int32],

    sign_normal: [ComponentTypeHeader.String],
    sign_red: [ComponentTypeHeader.String],
    sign_green: [ComponentTypeHeader.String],
    sign_blue: [ComponentTypeHeader.String],
    sign_gold: [ComponentTypeHeader.String],

    portal: [ComponentTypeHeader.Int32, ComponentTypeHeader.Int32, ComponentTypeHeader.Int32],
    portal_invisible: [ComponentTypeHeader.Int32, ComponentTypeHeader.Int32, ComponentTypeHeader.Int32],
    portal_world: [ComponentTypeHeader.String, ComponentTypeHeader.Int32],

    switch_local_toggle: [ComponentTypeHeader.Int32],
    switch_local_activator: [ComponentTypeHeader.Int32, ComponentTypeHeader.Boolean],
    switch_local_resetter: [ComponentTypeHeader.Boolean],
    switch_local_door: [ComponentTypeHeader.Int32],
    switch_local_gate: [ComponentTypeHeader.Int32],
    switch_global_toggle: [ComponentTypeHeader.Int32],
    switch_global_activator: [ComponentTypeHeader.Int32, ComponentTypeHeader.Boolean],
    switch_global_resetter: [ComponentTypeHeader.Boolean],
    switch_global_door: [ComponentTypeHeader.Int32],
    switch_global_gate: [ComponentTypeHeader.Int32],

    hazard_death_door: [ComponentTypeHeader.Int32],
    hazard_death_gate: [ComponentTypeHeader.Int32],

    note_drum: [ComponentTypeHeader.ByteArray],
    note_piano: [ComponentTypeHeader.ByteArray],
    note_guitar: [ComponentTypeHeader.ByteArray],
} as const;

export default BlockArgs;