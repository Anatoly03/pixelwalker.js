import { length7BitInt, write7BitInt } from "./math.js";

/**
 * @param {string} value 
 * @returns Uint8Array
 */
export function String(value: string): Uint8Array {
    const stringByteLen = new TextEncoder().encode(value).length;
    const buf1 = new Uint8Array(length7BitInt(stringByteLen));
    write7BitInt(buf1, stringByteLen, 0);
    const buf2 = new TextEncoder().encode(value);
    return Uint8Array.from([0, ...buf1, ...buf2]);
}

/**
 * @param {number} value 
 * @returns Uint8Array
 */
export function Byte(value: number): Uint8Array {
    const buf = new Uint8Array([1, 0]);
    buf[1] = value;
    return buf;
}

/**
 * @param {number} value 
 * @returns Uint8Array
 */
export function Int16(value: number): Uint8Array {
    const buf = new Uint8Array([2, 0, 0]);
    buf[1] = (value >> 8) & 0xFF;
    buf[2] = value & 0xFF;
    return buf;
}

/**
 * @param {number} value 
 * @returns Uint8Array
 */
export function Int32(value: number): Uint8Array {
    const buf = new Uint8Array([3, 0, 0, 0, 0]);
    buf[1] = (value >> 24) & 0xFF;
    buf[2] = (value >> 16) & 0xFF;
    buf[3] = (value >> 8) & 0xFF;
    buf[4] = value & 0xFF;
    return buf;
}

/**
 * @param {bigint} value 
 * @returns Uint8Array
 */
export function Int64(value: bigint): Uint8Array {
    const buf = new Uint8Array(9); // 1 byte for the type indicator + 8 bytes for the bigint
    buf[0] = 4; // Type indicator
    const view = new DataView(buf.buffer);
    view.setBigUint64(1, value, true); // Write the bigint value as little-endian
    return buf;
}

/**
 * @param {number} value 
 * @returns Uint8Array
 */
export function Float(value: number): Uint8Array {
    const buf = new Uint8Array([5, 0, 0, 0, 0]);
    const view = new DataView(buf.buffer);
    view.setFloat32(1, value, true);
    return buf;
}

/**
 * @param {number} value 
 * @returns Uint8Array
 */
export function Double(value: number): Uint8Array {
    const buf = new Uint8Array([6, 0, 0, 0, 0, 0, 0, 0, 0]);
    const view = new DataView(buf.buffer);
    view.setFloat64(1, value, true);
    return buf;
}

/**
 * @param {boolean} value 
 * @returns Uint8Array
 */
export function Boolean(value: boolean): Uint8Array {
    const buf = new Uint8Array([7, 0]);
    if (value) buf[1] = 1;
    return buf;
}

/**
 * @param {Uint8Array} value 
 * @returns Uint8Array
 */
export function ByteArray(value: Uint8Array): Uint8Array {
    return value; // No need to convert, it's already a Uint8Array
}

/**
 * @param {number} value 
 * @returns Uint8Array
 */
export function Magic(value: number): Uint8Array {
    return new Uint8Array([value]);
}

/**
 * @param {number} value 
 * @returns Uint8Array
 */
export function Bit7(value: number): Uint8Array {
    const buf = new Uint8Array(length7BitInt(value));
    write7BitInt(buf, value, 0);
    return buf;
}