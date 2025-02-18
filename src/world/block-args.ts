import { ComponentTypeHeader } from "../util/buffer.js";

/**
 * This defines the block data for all "special" blocks
 * in the game.
 */
export const BlockData = {
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
    // effects zombie door / gate

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
    switch_global_toggle: [ComponentTypeHeader.Int32],
    switch_local_door: [ComponentTypeHeader.Int32],
    switch_local_gate: [ComponentTypeHeader.Int32],
    switch_global_door: [ComponentTypeHeader.Int32],
    switch_global_gate: [ComponentTypeHeader.Int32],

    switch_local_activator: [ComponentTypeHeader.Int32, ComponentTypeHeader.Boolean],
    switch_global_activator: [ComponentTypeHeader.Int32, ComponentTypeHeader.Boolean],

    switch_local_resetter: [ComponentTypeHeader.Boolean],
    switch_global_resetter: [ComponentTypeHeader.Boolean],

    hazard_death_door: [ComponentTypeHeader.Int32],
    hazard_death_gate: [ComponentTypeHeader.Int32],

    note_drum: [ComponentTypeHeader.ByteArray],
    note_piano: [ComponentTypeHeader.ByteArray],
    note_guitar: [ComponentTypeHeader.ByteArray],

    counter_white_consumable: [ComponentTypeHeader.Int32],
    counter_white_reusable: [ComponentTypeHeader.Int32],
    counter_white_door: [ComponentTypeHeader.Int32],
    counter_white_gate: [ComponentTypeHeader.Int32],
    counter_gray_consumable: [ComponentTypeHeader.Int32],
    counter_gray_reusable: [ComponentTypeHeader.Int32],
    counter_gray_door: [ComponentTypeHeader.Int32],
    counter_gray_gate: [ComponentTypeHeader.Int32],
    counter_black_consumable: [ComponentTypeHeader.Int32],
    counter_black_reusable: [ComponentTypeHeader.Int32],
    counter_black_door: [ComponentTypeHeader.Int32],
    counter_black_gate: [ComponentTypeHeader.Int32],
    counter_red_consumable: [ComponentTypeHeader.Int32],
    counter_red_reusable: [ComponentTypeHeader.Int32],
    counter_red_door: [ComponentTypeHeader.Int32],
    counter_red_gate: [ComponentTypeHeader.Int32],
    counter_orange_consumable: [ComponentTypeHeader.Int32],
    counter_orange_reusable: [ComponentTypeHeader.Int32],
    counter_orange_door: [ComponentTypeHeader.Int32],
    counter_orange_gate: [ComponentTypeHeader.Int32],
    counter_yellow_consumable: [ComponentTypeHeader.Int32],
    counter_yellow_reusable: [ComponentTypeHeader.Int32],
    counter_yellow_door: [ComponentTypeHeader.Int32],
    counter_yellow_gate: [ComponentTypeHeader.Int32],
    counter_green_consumable: [ComponentTypeHeader.Int32],
    counter_green_reusable: [ComponentTypeHeader.Int32],
    counter_green_door: [ComponentTypeHeader.Int32],
    counter_green_gate: [ComponentTypeHeader.Int32],
    counter_cyan_consumable: [ComponentTypeHeader.Int32],
    counter_cyan_reusable: [ComponentTypeHeader.Int32],
    counter_cyan_door: [ComponentTypeHeader.Int32],
    counter_cyan_gate: [ComponentTypeHeader.Int32],
    counter_blue_consumable: [ComponentTypeHeader.Int32],
    counter_blue_reusable: [ComponentTypeHeader.Int32],
    counter_blue_door: [ComponentTypeHeader.Int32],
    counter_blue_gate: [ComponentTypeHeader.Int32],
    counter_magenta_consumable: [ComponentTypeHeader.Int32],
    counter_magenta_reusable: [ComponentTypeHeader.Int32],
    counter_magenta_door: [ComponentTypeHeader.Int32],
    counter_magenta_gate: [ComponentTypeHeader.Int32],

    custom_solid_bg: [ComponentTypeHeader.UInt32],
    custom_checker_bg: [ComponentTypeHeader.UInt32],
};
