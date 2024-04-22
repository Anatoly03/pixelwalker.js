import { length7BitInt, write7BitInt } from "./math"

//
//
// Serialisation
//
//

/**
 * @param {string} value 
 * @returns Buffer
 */
export function String(value): Buffer {
    const stringByteLen = Buffer.byteLength(value)

    const buf1 = Buffer.alloc(length7BitInt(stringByteLen))
    write7BitInt(buf1, stringByteLen, 0)

    const buf2 = Buffer.from(value)

    return Buffer.concat([Buffer.from([0]), buf1, buf2])
}

/**
 * @param {number} value 
 * @returns Buffer
 */
export function Byte(value): Buffer {
    const buf = Buffer.from([1, 0])
    buf.writeUInt8(value, 1)
    return buf
}

/**
 * @param {number} value 
 * @returns Buffer
 */
export function Int16(value): Buffer {
    const buf = Buffer.from([2, 0, 0])
    buf.writeUint16BE(value, 1)
    return buf
}

/**
 * @param {number} value 
 * @returns Buffer
 */
export function Int32(value): Buffer {
    const buf = Buffer.from([3, 0, 0, 0, 0])
    buf.writeInt32BE(value, 1)
    return buf
}

/**
 * @param {bigint} value 
 * @returns Buffer
 */
export function Int64(value): Buffer {
    const buf = Buffer.from([4, 0, 0, 0, 0, 0, 0, 0, 0])
    buf.writeBigInt64BE(value, 1)
    return buf
}

/**
 * @param {number} value 
 * @returns Buffer
 */
export function Float(value): Buffer {
    const buf = Buffer.from([5, 0, 0, 0, 0])
    buf.writeFloatBE(value, 1)
    return buf
}

/**
 * @param {number} value 
 * @returns Buffer
 */
export function Double(value): Buffer {
    const buf = Buffer.from([6, 0, 0, 0, 0, 0, 0, 0, 0])
    buf.writeDoubleBE(value, 1)
    return buf
}

/**
 * @param {boolean} value 
 * @returns Buffer
 */
export function Boolean(value): Buffer {
    const buf = Buffer.from([7, 0])
    if (value) buf.writeUInt8(1, 1)
    return buf
}

/**
 * @param {Uint8Array} value 
 * @returns Buffer
 */
export function ByteArray(value): Buffer {
    // TODO
    // offset = this.write7BitEncodedInt(buffer, value.byteLength, offset);
    // for (let j = 0; j < value.byteLength; j++) {
    //     buffer.writeUInt8(value[j], offset++);
}

/**
 * @param {number} value 
 * @returns Buffer
 */
export function Magic(value): Buffer {
    return Buffer.from([value])
}

/**
 * @param {number} value 
 * @returns Buffer
 */
export function Bit7(value): Buffer {
    const buf = Buffer.alloc(length7BitInt(value))
    write7BitInt(buf, value, 0)
    return buf
}
