/**
 * This file contains utility types.
 */

import { ComponentTypeHeader } from "./buffer-reader";

/**
 * The `FormatType` type is a utility type that takes a tuple of
 * component type headers and returns a tuple of the corresponding
 * JavaScript types.
 * 
 * @example
 * 
 * ```ts
 * // [number, string, boolean] ===
 * type A = FormatType<[ComponentTypeHeader.Int32, ComponentTypeHeader.String, ComponentTypeHeader.Boolean]>;
 * ```
 */
export type FormatType<K> = K extends readonly []
    ? []
    : K extends readonly [infer A, ...infer V]
    ? [
          A extends ComponentTypeHeader
              ? A extends ComponentTypeHeader.Boolean
                  ? boolean
                  : A extends ComponentTypeHeader.Byte
                  ? number
                  : A extends ComponentTypeHeader.ByteArray
                  ? number[]
                  : A extends ComponentTypeHeader.Double
                  ? number
                  : A extends ComponentTypeHeader.Float
                  ? number
                  : A extends ComponentTypeHeader.Int16
                  ? number
                  : A extends ComponentTypeHeader.Int32
                  ? number
                  : A extends ComponentTypeHeader.Int64
                  ? number
                  : A extends ComponentTypeHeader.String
                  ? string
                  : never
              : never,
          ...FormatType<V>
      ]
    : never;
