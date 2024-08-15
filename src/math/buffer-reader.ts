import WebSocket from 'ws';

/**
 * Data during the communication in the process is dynamic
 * typed. Every entry is followed by a byte identifying the
 * type, followed by data. The type header is noted by its'
 * 7-bit notation.
 */
export enum ComponentTypeHeader {
    String = 0,
    Byte = 1,
    Int16 = 2,
    Int32 = 3,
    Int64 = 4,
    Float = 5,
    Double = 6,
    Boolean = 7,
    ByteArray = 8,
}

/**
 * A Buffer reader is a special buffer extension made to perform
 * game-specific tasks in the field of communication.
 */
export default class BufferReader extends Buffer {
    #offset: number;

    /**
     * On a given buffer create a reader that can perform
     * game-specific bit magic. A buffer size can be provided
     * to initialize an empty buffer
     */
    constructor(bufferSize: number);

    /**
     * On a given buffer create a reader that can perform
     * game-specific bit magic. Optionally specify the offset
     * of the cursor.
     */
    constructor(buffer: Buffer | WebSocket.RawData | WithImplicitCoercion<ArrayBuffer>, offset?: number);

    constructor(buffer: WebSocket.RawData | WithImplicitCoercion<ArrayBuffer> | number, offset = 0) {
        if (typeof buffer == 'number') buffer = Buffer.alloc(buffer);
        super(Buffer.from(buffer as WithImplicitCoercion<ArrayBuffer>));
        this.#offset = offset;
    }

    //
    //
    // Static Methods
    //
    //

    /**
     * https://stackoverflow.com/questions/8609289/convert-a-binary-nodejs-buffer-to-javascript-arraybuffer
     */
    public toArrayBuffer(): ArrayBuffer {
        const arrayBuffer = new ArrayBuffer(this.length);
        const view = new Uint8Array(arrayBuffer);
        for (let i = 0; i < this.length; ++i) {
            view[i] = this[i];
        }
        return arrayBuffer;
    }

    //
    //
    // Message Component Types
    //
    //

    /**
     * @param {string} value
     * @returns {Buffer}
     */
    public static String(value: string): Buffer {
        const stringByteLen = Buffer.byteLength(value);
        const lengthByteCount = this.length7BitInt(stringByteLen);

        const buffer = new BufferReader(1 + lengthByteCount + stringByteLen);
        buffer.writeUInt8(ComponentTypeHeader.String);
        buffer.write7BitInt(lengthByteCount);
        buffer.write(value);

        return buffer;
    }

    /**
     * @param {number} value
     * @returns {Buffer}
     */
    public static Byte(value: number): Buffer {
        const buffer = new BufferReader(2);
        buffer.writeUInt8(ComponentTypeHeader.Byte);
        buffer.writeUInt8(value);
        return buffer;
    }

    /**
     * @param {number} value
     * @returns {Buffer}
     */
    public static Int16(value: number): Buffer {
        const buffer = new BufferReader(3);
        buffer.writeUInt8(ComponentTypeHeader.Int16);
        buffer.writeUInt16BE(value);
        return buffer;
    }

    /**
     * @param {number} value
     * @returns {Buffer}
     */
    public static Int32(value: number): Buffer {
        const buffer = new BufferReader(5);
        buffer.writeUInt8(ComponentTypeHeader.Int32);
        buffer.writeInt32BE(value);
        return buffer;
    }

    /**
     * @param {bigint} value
     * @returns {Buffer}
     */
    public static Int64(value: bigint): Buffer {
        const buffer = new BufferReader(9);
        buffer.writeUInt8(ComponentTypeHeader.Int64);
        buffer.writeBigInt64BE(value);
        return buffer;
    }

    /**
     * @param {number} value
     * @returns {Buffer}
     */
    public static Float(value: number): Buffer {
        const buffer = new BufferReader(5);
        buffer.writeUInt8(ComponentTypeHeader.Float);
        buffer.writeFloatBE(value);
        return buffer;
    }

    /**
     * @param {number} value
     * @returns {Buffer}
     */
    public static Double(value: number): Buffer {
        const buffer = new BufferReader(9);
        buffer.writeUInt8(ComponentTypeHeader.Double);
        buffer.writeDoubleBE(value);
        return buffer;
    }

    /**
     * @param {boolean} value
     * @returns {Buffer}
     */
    public static Boolean(value: boolean): Buffer {
        const buffer = new BufferReader(2);
        buffer.writeUInt8(ComponentTypeHeader.Boolean);
        buffer.writeUInt8(value ? 1 : 0);
        return buffer;
    }

    /**
     * @param {Uint8Array} buffer
     * @returns {Buffer}
     */
    public static ByteArray(buffer: Buffer): Buffer {
        // const bufferByteLen = Buffer.byteLength(buffer);

        // const bufLength = Buffer.alloc(length7BitInt(bufferByteLen));
        // write7BitInt(bufLength, bufferByteLen, 0);

        // return Buffer.concat([Buffer.from([8]), bufLength, buffer]);

        const stringByteLen = Buffer.byteLength(buffer);
        const lengthByteCount = this.length7BitInt(stringByteLen);

        const prefix = new BufferReader(1 + lengthByteCount);
        prefix.writeUInt8(ComponentTypeHeader.String);
        prefix.write7BitInt(lengthByteCount);

        return Buffer.concat([prefix, buffer]);
    }

    /**
     * @param {number} value
     * @returns {Buffer}
     */
    public static Magic(value: number): Buffer {
        return Buffer.from([value]);
    }

    /**
     * @param {number} value
     * @returns {Buffer}
     */
    public static Bit7(value: number): Buffer {
        const buffer = new BufferReader(this.length7BitInt(value));
        buffer.write7BitInt(value);
        return buffer;
    }

    //
    //
    // Overrides
    //
    //

    public override write(value: string) {
        return (this.#offset = super.write(value, this.#offset));
    }

    public override writeBigInt64BE(value: bigint) {
        return (this.#offset = super.writeBigInt64BE(value, this.#offset));
    }

    public override writeBigInt64LE(value: bigint) {
        return (this.#offset = super.writeBigInt64LE(value, this.#offset));
    }

    // public override writeUIntLE(value: number) {
    //     return this.#offset = super.writeUIntLE(value, this.#offset);
    // }

    // public override writeUintLE(value: number) {
    //     throw new Error('The alias `writeUintLE` for the method `writeUIntLE` is banned on class `BufferReader`. Capitalize the letter `I` instead.')
    // }

    // public override writeUIntBE(value: number) {
    //     return this.#offset = super.writeUIntBE(value, this.#offset);
    // }

    // public override writeUintBE(value: number) {
    //     throw new Error('The alias `writeUintBE` for the method `writeUIntBE` is banned on class `BufferReader`. Capitalize the letter `I` instead.')
    // }

    // public override writeIntLE(value: number) {
    //     return this.#offset = super.writeIntLE(value, this.#offset);
    // }

    // public override writeIntBE(value: number) {
    //     return this.#offset = super.writeIntBE(value, this.#offset);
    // }

    public override writeUInt8(value: number) {
        return (this.#offset = super.writeUInt8(value, this.#offset));
    }

    public override writeUint8(_: number): number {
        throw new Error('The alias `writeUint8` for the method `writeUInt8` is banned on class `BufferReader`. Capitalize the letter `I` instead.')
    }

    public override writeUInt16LE(value: number) {
        return (this.#offset = super.writeUInt16LE(value, this.#offset));
    }

    public override writeUint16LE(_: number): number {
        throw new Error('The alias `writeUint16LE` for the method `writeUInt16LE` is banned on class `BufferReader`. Capitalize the letter `I` instead.')
    }

    public override writeUInt16BE(value: number) {
        return (this.#offset = super.writeUInt16BE(value, this.#offset));
    }

    public override writeUint16BE(_: number): number {
        throw new Error('The alias `writeUint16BE` for the method `writeUInt16BE` is banned on class `BufferReader`. Capitalize the letter `I` instead.')
    }

    public override writeUInt32LE(value: number) {
        return (this.#offset = super.writeUInt32LE(value, this.#offset));
    }

    public override writeUint32LE(_: number): number {
        throw new Error('The alias `writeUint32LE` for the method `writeUInt32LE` is banned on class `BufferReader`. Capitalize the letter `I` instead.')
    }

    public override writeUInt32BE(value: number) {
        return (this.#offset = super.writeUInt32BE(value, this.#offset));
    }

    public override writeUint32BE(_: number): number {
        throw new Error('The alias `writeUint32BE` for the method `writeUInt32BE` is banned on class `BufferReader`. Capitalize the letter `I` instead.')
    }

    public override writeInt8(value: number) {
        return (this.#offset = super.writeInt8(value, this.#offset));
    }

    public override writeInt16LE(value: number) {
        return (this.#offset = super.writeInt16LE(value, this.#offset));
    }

    public override writeInt16BE(value: number) {
        return (this.#offset = super.writeInt16BE(value, this.#offset));
    }

    public override writeInt32LE(value: number) {
        return (this.#offset = super.writeInt32LE(value, this.#offset));
    }

    public override writeInt32BE(value: number) {
        return (this.#offset = super.writeInt32BE(value, this.#offset));
    }

    public override writeFloatLE(value: number) {
        return (this.#offset = super.writeFloatLE(value, this.#offset));
    }

    public override writeFloatBE(value: number) {
        return (this.#offset = super.writeFloatBE(value, this.#offset));
    }

    public override writeDoubleLE(value: number) {
        return (this.#offset = super.writeDoubleLE(value, this.#offset));
    }

    public override writeDoubleBE(value: number) {
        return (this.#offset = super.writeDoubleBE(value, this.#offset));
    }

    public override readBigUInt64BE() {
        const tmp = super.readBigUInt64BE(this.#offset);
        this.#offset += 8;
        return tmp;
    }

    public override readBigUInt64LE() {
        const tmp = super.readBigUInt64LE(this.#offset);
        this.#offset += 8;
        return tmp;
    }

    public override readBigInt64BE() {
        const tmp = super.readBigInt64BE(this.#offset);
        this.#offset += 8;
        return tmp;
    }

    public override readBigInt64LE() {
        const tmp = super.readBigInt64LE(this.#offset);
        this.#offset += 8;
        return tmp;
    }

    // public override readUIntLE() {
    //     const tmp = super.readUIntLE(this.#offset);
    //     this.#offset += 1;
    //     return tmp;
    // }

    // public override readUIntBE() {
    //     const tmp = super.readUIntBE(this.#offset);
    //     this.#offset += 1;
    //     return tmp;
    // }

    // public override readIntLE() {
    //     const tmp = super.readIntLE(this.#offset);
    //     this.#offset += 1;
    //     return tmp;
    // }

    // public override readIntBE() {
    //     const tmp = super.readIntBE(this.#offset);
    //     this.#offset += 1;
    //     return tmp;
    // }

    public override readUInt8() {
        const tmp = super.readUInt8(this.#offset);
        this.#offset += 1;
        return tmp;
    }

    public override readUInt16LE() {
        const tmp = super.readUInt16LE(this.#offset);
        this.#offset += 2;
        return tmp;
    }

    public override readUInt16BE() {
        const tmp = super.readUInt16BE(this.#offset);
        this.#offset += 2;
        return tmp;
    }

    public override readUInt32LE() {
        const tmp = super.readUInt32LE(this.#offset);
        this.#offset += 4;
        return tmp;
    }

    public override readUInt32BE() {
        const tmp = super.readUInt32BE(this.#offset);
        this.#offset += 1;
        return tmp;
    }

    public override readInt8() {
        const tmp = super.readInt8(this.#offset);
        this.#offset += 1;
        return tmp;
    }

    public override readInt16LE() {
        const tmp = super.readInt16LE(this.#offset);
        this.#offset += 2;
        return tmp;
    }

    public override readInt16BE() {
        const tmp = super.readInt16BE(this.#offset);
        this.#offset += 2;
        return tmp;
    }

    public override readInt32LE() {
        const tmp = super.readInt32LE(this.#offset);
        this.#offset += 4;
        return tmp;
    }

    public override readInt32BE() {
        const tmp = super.readInt32BE(this.#offset);
        this.#offset += 4;
        return tmp;
    }

    public override readFloatLE() {
        const tmp = super.readFloatLE(this.#offset);
        this.#offset += 4;
        return tmp;
    }

    public override readFloatBE() {
        const tmp = super.readFloatBE(this.#offset);
        this.#offset += 4;
        return tmp;
    }

    public override readDoubleLE() {
        const tmp = super.readDoubleLE(this.#offset);
        this.#offset += 8;
        return tmp;
    }

    public override readDoubleBE() {
        const tmp = super.readDoubleBE(this.#offset);
        this.#offset += 8;
        return tmp;
    }

    //
    //
    // Methods
    //
    //

    /**
     * Advanced the buffer reader by pffset.
     */
    advanceOffset(relativeOffset = 1): this {
        this.#offset += relativeOffset;
        return this;
    }

    /**
     * This function reads how many bytes a normal integer would take
     * as a 7-bit number
     *
     * 1(000 0001) 0(111 1110)
     */
    public static length7BitInt(value: number): number {
        let size = 0;
        do (value >>= 7), size++;
        while (value > 0);
        return size;
    }

    /**
     * Reads in an integer in 7-bit notation. A 7-bit integer
     * encoding splits a number into a variable size of bits,
     * in which the first bit is set while bytes are following.
     *
     * @example
     *
     * ```
     * 1111 0000 1010 1010 1000 0000 0000 0001 Reading In
     * ^--- ---- ^--- ---- ^--- ---- ^--- ----
     *  111 0000  010 1010  000 0000  000 0001 Writing Out
     * ```
     */
    public read7BitInt(): number {
        let value = 0,
            shift = 0,
            byte = 0xff;

        while (byte & 0x80) {
            byte = this.readUInt8();
            value |= (byte & 0x7f) << shift;
            shift += 7;
        }

        return value;
    }

    /**
     * Write a normal integer value into buffer at offset.
     */
    public write7BitInt(value: number) {
        while (value >= 128) {
            this.writeUInt8((value & 127) | 128);
            value >>= 7;
        }
        this.writeUInt8(value);
    }

    /**
     * Keep Deserializing the buffer for typed data until
     * you reach the end of the buffer. Typed data consists
     * of a type indicator in 7-bit-encoding and data following
     * accordingly.
     */
    deserialize() {
        const arr: (string | number | boolean | Buffer | bigint)[] = [];

        while (this.#offset < this.length) {
            const type = this.read7BitInt();

            switch (type) {
                case ComponentTypeHeader.String:
                    {
                        const length = this.read7BitInt();
                        arr.push(
                            this.subarray(
                                this.#offset,
                                this.#offset + length
                            ).toString('ascii')
                        );
                        this.#offset += length;
                    }
                    break;
                case ComponentTypeHeader.Byte:
                    arr.push(this.readUInt8());
                    break;
                case ComponentTypeHeader.Int16: // = Int16 (short)
                    arr.push(this.readInt16BE());
                    break;
                case ComponentTypeHeader.Int32: // = Int32
                    arr.push(this.readInt32BE());
                    break;
                case ComponentTypeHeader.Int64:
                    arr.push(this.readBigInt64BE());
                    break;
                case ComponentTypeHeader.Float:
                    arr.push(this.readFloatBE());
                    break;
                case ComponentTypeHeader.Double:
                    arr.push(this.readDoubleBE());
                    break;
                case ComponentTypeHeader.Boolean:
                    arr.push(!!this.readUInt8()); // !! is truthy
                    break;
                case ComponentTypeHeader.ByteArray:
                    {
                        const length = this.read7BitInt();
                        arr.push(
                            this.subarray(this.#offset, this.#offset + length)
                        );
                        this.#offset += length;
                    }
                    break;
                default:
                    throw new Error(
                        `While serializing a buffer for data, an unexpected type ${type} was read. Expected one of ${Object.keys(
                            ComponentTypeHeader
                        ).filter(isNaN as any)}`
                    );
            }
        }

        return arr;
    }
}
