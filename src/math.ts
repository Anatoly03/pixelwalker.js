
/**
 * @param {Buffer} buffer 
 * @param {number} offset
 */
export function read7BitInt(buffer, offset) {
    let value = 0, shift = 0, byte = 0xFF

    while (byte & 0x80) {
        byte = buffer.readUInt8(offset++)
        value |= (byte & 0x7F) << shift
        shift += 7
    }

    return [value, offset]
}

/**
 * @param {number} value 
 */
export function length7BitInt(value) {
    let size = 0;
    do
        value >>= 7,
            size++;
    while (value > 0);
    return size
}

/**
 * @param {Buffer} buffer 
 * @param {number} value
 * @param {number} offset
 */
export function write7BitInt(buffer, value, offset) {
    while (value >= 128) {
        buffer.writeUInt8(value & 127 | 128, offset++)
        value >>= 7
    }
    return [buffer.writeUInt8(value, offset), offset + 1]
}

/**
 * @param {Buffer} buffer 
 * @param {number} offset 
 */
export function deserialise(buffer, offset) {
    const arr = []
    // const types = []

    while (offset < buffer.length) {
        let [type, o] = read7BitInt(buffer, offset)
        let length
        offset = o

        switch (type) {
            case 0: // = String
                [length, o] = read7BitInt(buffer, offset)
                offset = o
                arr.push(buffer.subarray(offset, offset + length).toString('ascii'))
                offset += length
                break
            case 1: // = Byte
                arr.push(buffer.readUInt8(offset++))
                break
            case 2: // = Int16 (short)
                arr.push(buffer.readInt16BE(offset))
                offset += 2
                break
            case 3: // = Int32
                arr.push(buffer.readInt32BE(offset))
                offset += 4
                break
            case 4: // = Int64 (long)
                arr.push(buffer.readBigInt64BE(offset))
                offset += 8
                break
            case 5: // = Float
                arr.push(buffer.readFloatBE(offset))
                offset += 4
                break
            case 6: // = Double
                arr.push(buffer.readDoubleBE(offset))
                offset += 8
                break
            case 7: // = Boolean
                arr.push(!!buffer.readUInt8(offset++)) // !! is truthy
                break
            case 8: // = ByteArray
                [length, offset] = read7BitInt(buffer, offset)
                arr.push(buffer.subarray(offset, offset + length))
                offset += length
                break
        }

        // types.push(type)
    }

    // console.log(types)

    return arr
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