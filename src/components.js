
import {
    Types,
    defineComponent,
    // defineQuery,n
} from 'bitecs'

const Vec2 = { x: Types.f64, y: Types.f64 }

export const Player = defineComponent({
    id: Types.ui32
})

export const Position = defineComponent(Vec2)
export const Acceleration = defineComponent(Vec2)

export const ModMode = defineComponent()
export const GodMode = defineComponent()