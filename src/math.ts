import { Type } from "."
import { HeaderTypes } from "./data/consts"

/**
 * On occasions, the game has integer compression with the bits
 * stored in 7 bits, where as the first bit in a byte specifies
 * if the number is any longer.
 * 
 * 1(000 0001) 0(111 1110) converts to 000 0001 111 1110
 * 
 * This function reads such compression.
 */
export function read7BitInt(uint8Array: Uint8Array, offset: number): [number, number] {
    let value = 0, shift = 0, byte = 0xFF;
    while (byte & 0x80) {
        byte = uint8Array[offset++];
        value |= (byte & 0x7F) << shift;
        shift += 7;
    }
    return [value, offset];
}

/**
 * This function reads how many bytes a normal integer would take
 * as a 7-bit number
 * 
 * 1(000 0001) 0(111 1110)
 */
export function length7BitInt(value: number): number {
    let size = 0;
    do
        value >>= 7,
            size++;
    while (value > 0);
    return size
}

/**
 * Write a normal integer value into buffer at offset.
 */
export function write7BitInt(uint8Array: Uint8Array, value: number, offset: number) {
    while (value >= 128) {
        uint8Array[offset++] = (value & 127) | 128;
        value >>= 7;
    }
    uint8Array[offset] = value;
}

/**
 * Deserialise incoming buffer from server to JS values.
 */
export function deserialise(uint8Array: Uint8Array, offset: number) {
    const arr = [];
    let type, length;
    while (offset < uint8Array.length) {
        [type, offset] = read7BitInt(uint8Array, offset);
        switch (type) {
            case 0 /* HeaderTypes.String */:
                [length, offset] = read7BitInt(uint8Array, offset);
                const stringData = new TextDecoder().decode(uint8Array.subarray(offset, offset + length));
                arr.push(stringData);
                offset += length;
                break;
            case 1 /* HeaderTypes.Byte */: // = Byte
                arr.push(uint8Array[offset++]);
                break;
            case 2 /* HeaderTypes.Int16 */: // = Int16 (short)
                arr.push((uint8Array[offset++] << 8) | uint8Array[offset++]); // Combine two bytes to form Int16
                break;
            case 3 /* HeaderTypes.Int32 */: // = Int32
                arr.push((uint8Array[offset++] << 24) | (uint8Array[offset++] << 16) | (uint8Array[offset++] << 8) | uint8Array[offset++]); // Combine four bytes to form Int32
                break;
            case 4 /* HeaderTypes.Int64 */:
                // Note: JavaScript doesn't support Int64 directly. You may need to handle this differently.
                arr.push((BigInt(uint8Array[offset++]) << 56n) | (BigInt(uint8Array[offset++]) << 48n) | (BigInt(uint8Array[offset++]) << 40n) | (BigInt(uint8Array[offset++]) << 32n) | (BigInt(uint8Array[offset++]) << 24n) | (BigInt(uint8Array[offset++]) << 16n) | (BigInt(uint8Array[offset++]) << 8n) | BigInt(uint8Array[offset++])); // Combine eight bytes to form Int64
                break;
            case 5 /* HeaderTypes.Float */:
                // Float data format might need to be adjusted based on your specific data representation
                arr.push(uint8Array[offset++] | (uint8Array[offset++] << 8) | (uint8Array[offset++] << 16) | (uint8Array[offset++] << 24)); // Combine four bytes to form Float
                break;
            case 6 /* HeaderTypes.Double */:
                // Double data format might need to be adjusted based on your specific data representation
                arr.push(uint8Array[offset++] | (uint8Array[offset++] << 8) | (uint8Array[offset++] << 16) | (uint8Array[offset++] << 24) | (uint8Array[offset++] << 32) | (uint8Array[offset++] << 40) | (uint8Array[offset++] << 48) | (uint8Array[offset++] << 56)); // Combine eight bytes to form Double
                break;
            case 7 /* HeaderTypes.Boolean */:
                arr.push(!!uint8Array[offset++]); // !! is truthy
                break;
            case 8 /* HeaderTypes.ByteArray */:
                [length, offset] = read7BitInt(uint8Array, offset);
                arr.push(uint8Array.subarray(offset, offset + length));
                offset += length;
                break;
        }
    }
    return arr;
}

/**
 * @param {any[]} buffer
 * @param {number[]} types
 */
// export function serialise(arr, types) {
//     let chunks = []
//     let ref, buf

//     for (let i = 0; i < arr.length; i++) {
//         switch (types[i]) {
//             case 0:
//                 const stringByteLen = Buffer.byteLength(arr[i])
//                 buf = Buffer.alloc(stringByteLen + length7BitInt(stringByteLen) + 1)
//                 buf.writeUInt8(0)
//                 ref = pos(1)
//                 write7BitInt(buf, stringByteLen, ref)
//                 buf.write(arr[i], ref.val)
//                 chunks.push(buf)
//                 break
//             case 1:
//                 buf 
//                 chunks.push(Buffer.alloc(1).writeUInt8(arr[i]))
//                 break;
//             case 2:
//                 chunks.push(Buffer.alloc(2).writeUint16BE(arr[i]))
//                 break;
//             case 3:
//                 buf = Buffer.from([3, 0, 0, 0, 0])
//                 buf.writeInt32BE(arr[i], 1)
//                 chunks.push(buf)
//                 break;
//             case 4:
//                 chunks.push(Buffer.alloc(8).writeInt64BE(arr[i]))
//                 break;
//             case 5:
//                 chunks.push(Buffer.alloc(4).writeFloatBE(arr[i]))
//                 break;
//             case 6:
//                 chunks.push(Buffer.alloc(8).writeDoubleBE(arr[i]))
//                 break;
//             case 7:
//                 chunks.push(Buffer.alloc(1).writeUInt8(arr[i] ? 1 : 0))
//                 break;
//             case 8:
//                 // offset = this.write7BitEncodedInt(buffer, value.byteLength, offset);
//                 // for (let j = 0; j < value.byteLength; j++) {
//                 //     buffer.writeUInt8(value[j], offset++);
//                 // }
//                 break;

//             case -100: // special: magic byte
//                 chunks.push(Buffer.from([arr[i]]))
//                 break
//             case -101: // special: magic 7bit int
//                 buf = Buffer.alloc(length7BitInt(arr[i]))
//                 write7BitInt(buf, arr[i], pos(0))
//                 chunks.push(buf)
//                 break
//         }
//     }

//     return Buffer.concat(chunks)
// }

/**
 * https://stackoverflow.com/questions/8609289/convert-a-binary-nodejs-buffer-to-javascript-arraybuffer
 * @param {Buffer} buffer
 * @returns {ArrayBuffer}
 */
// export function toArrayBuffer(buffer) {
//     const arrayBuffer = new ArrayBuffer(buffer.length);
//     const view = new Uint8Array(arrayBuffer);
//     for (let i = 0; i < buffer.length; ++i) {
//         view[i] = buffer[i];
//     }
//     return arrayBuffer;
// }


/**
 * Create a two dimensional array.
 */
export function get2dArray<T>(width: number, height: number): T[][] {
    const arr: T[][] = new Array(width)
    for (let i = 0; i < width; i++) {
        arr[i] = new Array(height)
    }
    return arr
}