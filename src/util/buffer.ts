import { BlockSerializationOptions } from "../world/block.js";

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
    UInt32 = 9,
}

/**
 * A Buffer reader is a special buffer extension made to perform
 * game-specific tasks in the field of communication.
 *
 * @implements Buffer
 */
export default class BufferReader {
    #buffer: Buffer;
    #offset: number = 0;

    /**
     *
     */
    private constructor(buffer: Buffer) {
        this.#buffer = buffer;
    }

    //
    //
    // Static Methods
    //
    //

    /**
     *
     */
    public static from(from: WithImplicitCoercion<ArrayBuffer> | Buffer): BufferReader {
        if (from instanceof Buffer) return new BufferReader(from);
        return new BufferReader(Buffer.from(from as any));
    }

    /**
     *
     */
    public static alloc(amount: number) {
        return BufferReader.from(Buffer.alloc(amount));
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
    public static String(value: string = "", options: BlockSerializationOptions = {}): Buffer {
        const stringByteLen = Buffer.byteLength(value);
        const lengthByteCount = this.length7BitInt(stringByteLen);

        const buffer = BufferReader.alloc(1 + lengthByteCount + stringByteLen);
        
        if (options.writeTypeByte) {
            buffer.writeUInt8(ComponentTypeHeader.String);
        }

        buffer.write7BitInt(stringByteLen);
        buffer.write(value);

        return buffer.toBuffer();
    }

    /**
     * @param {number} value
     * @returns {Buffer}
     */
    public static Byte(value: number = 0, options: BlockSerializationOptions = {}): Buffer {
        const buffer = BufferReader.alloc(2);
        
        if (options.writeTypeByte) {
            buffer.writeUInt8(ComponentTypeHeader.Byte);
        }

        buffer.writeUInt8(value);
        return buffer.toBuffer();
    }

    /**
     * @param {number} value
     * @returns {Buffer}
     */
    public static Int16(value: number = 0, options: BlockSerializationOptions = {}): Buffer {
        const buffer = BufferReader.alloc(3);
        
        if (options.writeTypeByte) {
            buffer.writeUInt8(ComponentTypeHeader.Int16);
        }

        if (options.endian === 'little') {
            buffer.writeUInt16LE(value);
        } else {
            buffer.writeUInt16BE(value);
        }

        return buffer.toBuffer();
    }

    /**
     * @param {number} value
     * @returns {Buffer}
     */
    public static Int32(value: number = 0, options: BlockSerializationOptions = {}): Buffer {
        const buffer = BufferReader.alloc(5);
        
        if (options.writeTypeByte) {
            buffer.writeUInt8(ComponentTypeHeader.Int32);
        }

        if (options.endian === 'little') {
            buffer.writeInt32LE(value);
        } else {
            buffer.writeInt32BE(value);
        }

        return buffer.toBuffer();
    }

    /**
     * @param {number} value
     * @returns {Buffer}
     */
    public static UInt32(value: number = 0, options: BlockSerializationOptions = {}): Buffer {
        const buffer = BufferReader.alloc(5);
        
        if (options.writeTypeByte) {
            buffer.writeUInt8(ComponentTypeHeader.UInt32);
        }

        if (options.endian === 'little') {
            buffer.writeInt32LE(value);
        } else {
            buffer.writeInt32BE(value);
        }

        return buffer.toBuffer();
    }

    /**
     * @param {bigint} value
     * @returns {Buffer}
     */
    public static Int64(value: bigint = BigInt(0).valueOf(), options: BlockSerializationOptions = {}): Buffer {
        const buffer = BufferReader.alloc(9);
        
        if (options.writeTypeByte) {
            buffer.writeUInt8(ComponentTypeHeader.Int64);
        }

        if (options.endian === 'little') {
            buffer.writeBigInt64LE(value);
        } else {
            buffer.writeBigInt64BE(value);
        }

        return buffer.toBuffer();
    }

    /**
     * @param {number} value
     * @returns {Buffer}
     */
    public static Float(value: number = 0, options: BlockSerializationOptions = {}): Buffer {
        const buffer = BufferReader.alloc(5);
        
        if (options.writeTypeByte) {
            buffer.writeUInt8(ComponentTypeHeader.Float);
        }

        buffer.writeFloatBE(value);
        return buffer.toBuffer();
    }

    /**
     * @param {number} value
     * @returns {Buffer}
     */
    public static Double(value: number = 0, options: BlockSerializationOptions = {}): Buffer {
        const buffer = BufferReader.alloc(9);
        
        if (options.writeTypeByte) {
            buffer.writeUInt8(ComponentTypeHeader.Double);
        }

        buffer.writeDoubleBE(value);
        return buffer.toBuffer();
    }

    /**
     * @param {boolean} value
     * @returns {Buffer}
     */
    public static Boolean(value: boolean = false, options: BlockSerializationOptions = {}): Buffer {
        const buffer = BufferReader.alloc(2);
        
        if (options.writeTypeByte) {
            buffer.writeUInt8(ComponentTypeHeader.Boolean);
        }

        buffer.writeUInt8(value ? 1 : 0);
        return buffer.toBuffer();
    }

    /**
     * @param {Uint8Array} buffer
     * @returns {Buffer}
     */
    public static ByteArray(buffer: Buffer = Buffer.from([0]), options: BlockSerializationOptions = {}): Buffer {
        // const bufferByteLen = Buffer.byteLength(buffer);

        // const bufLength = Buffer.alloc(length7BitInt(bufferByteLen));
        // write7BitInt(bufLength, bufferByteLen, 0);

        // return Buffer.concat([Buffer.from([8]), bufLength, buffer]);

        const stringByteLen = Buffer.byteLength(buffer);
        const lengthByteCount = this.length7BitInt(stringByteLen);

        const prefix = BufferReader.alloc(1 + lengthByteCount);
        
        if (options.writeTypeByte) {
            prefix.writeUInt8(ComponentTypeHeader.ByteArray);
        }

        prefix.write7BitInt(lengthByteCount);

        return Buffer.concat([prefix.toBuffer(), buffer]);
    }

    /**
     * @param {number} value
     * @returns {Buffer}
     */
    public static Magic(value: number): Buffer {
        if (value === undefined) throw new Error("Received undefined magic byte");
        return Buffer.from([value]);
    }

    /**
     * @param {number} value
     * @returns {Buffer}
     */
    public static Bit7(value: number = 0): Buffer {
        const buffer = BufferReader.alloc(this.length7BitInt(value));
        buffer.write7BitInt(value);
        return buffer.toBuffer();
    }

    /**
     * @param tt
     * @param value
     */
    public static Dynamic(tt: ComponentTypeHeader, value: boolean | number | bigint | string | Buffer, options: BlockSerializationOptions = {}): Buffer {
        switch (tt) {
            case ComponentTypeHeader.String:
                return this.String(value as string, options);
            case ComponentTypeHeader.Byte:
                return this.Byte(value as number, options);
            case ComponentTypeHeader.Int16:
                return this.Int16(value as number, options);
            case ComponentTypeHeader.Int32:
                return this.Int32(value as number, options);
            case ComponentTypeHeader.UInt32:
                return this.UInt32(value as number, options);
            case ComponentTypeHeader.Int64:
                return this.Int64(value as bigint, options);
            case ComponentTypeHeader.Float:
                return this.Float(value as number, options);
            case ComponentTypeHeader.Double:
                return this.Double(value as number, options);
            case ComponentTypeHeader.Boolean:
                return this.Boolean(value as boolean, options);
            case ComponentTypeHeader.ByteArray:
                return this.ByteArray(value as Buffer, options);
        }
    }

    //
    //
    // Overrides
    //
    //

    /**
     *
     */
    public get length() {
        return this.#buffer.length - this.#offset;
    }

    /**
     *
     */
    public subarray(start: number = this.#offset, end: number = this.length): BufferReader {
        return new BufferReader(this.#buffer.subarray(start, this.#offset + end));
    }

    /**
     *
     */
    public write(value: string) {
        return (this.#offset = this.#buffer.write(value, this.#offset));
    }

    /**
     *
     */
    public writeBigInt64BE(value: bigint) {
        return (this.#offset = this.#buffer.writeBigInt64BE(value, this.#offset));
    }

    /**
     *
     */
    public writeBigInt64LE(value: bigint) {
        return (this.#offset = this.#buffer.writeBigInt64LE(value, this.#offset));
    }

    /**
     *
     */
    public writeUInt8(value: number) {
        return (this.#offset = this.#buffer.writeUInt8(value, this.#offset));
    }

    /**
     *
     */
    public writeUInt16LE(value: number) {
        return (this.#offset = this.#buffer.writeUInt16LE(value, this.#offset));
    }

    /**
     *
     */
    public writeUInt16BE(value: number) {
        return (this.#offset = this.#buffer.writeUInt16BE(value, this.#offset));
    }

    /**
     *
     */
    public writeUInt32LE(value: number) {
        return (this.#offset = this.#buffer.writeUInt32LE(value, this.#offset));
    }

    /**
     *
     */
    public writeUInt32BE(value: number) {
        return (this.#offset = this.#buffer.writeUInt32BE(value, this.#offset));
    }

    /**
     *
     */
    public writeInt8(value: number) {
        return (this.#offset = this.#buffer.writeInt8(value, this.#offset));
    }

    /**
     *
     */
    public writeInt16LE(value: number) {
        return (this.#offset = this.#buffer.writeInt16LE(value, this.#offset));
    }

    /**
     *
     */
    public writeInt16BE(value: number) {
        return (this.#offset = this.#buffer.writeInt16BE(value, this.#offset));
    }

    /**
     *
     */
    public writeInt32LE(value: number) {
        return (this.#offset = this.#buffer.writeInt32LE(value, this.#offset));
    }

    /**
     *
     */
    public writeInt32BE(value: number) {
        return (this.#offset = this.#buffer.writeInt32BE(value, this.#offset));
    }

    /**
     *
     */
    public writeFloatLE(value: number) {
        return (this.#offset = this.#buffer.writeFloatLE(value, this.#offset));
    }

    /**
     *
     */
    public writeFloatBE(value: number) {
        return (this.#offset = this.#buffer.writeFloatBE(value, this.#offset));
    }

    /**
     *
     */
    public writeDoubleLE(value: number) {
        return (this.#offset = this.#buffer.writeDoubleLE(value, this.#offset));
    }

    /**
     *
     */
    public writeDoubleBE(value: number) {
        return (this.#offset = this.#buffer.writeDoubleBE(value, this.#offset));
    }

    /**
     *
     */
    public readBigUInt64BE() {
        const tmp = this.#buffer.readBigUInt64BE(this.#offset);
        this.#offset += 8;
        return tmp;
    }

    /**
     *
     */
    public readBigUInt64LE() {
        const tmp = this.#buffer.readBigUInt64LE(this.#offset);
        this.#offset += 8;
        return tmp;
    }

    /**
     *
     */
    public readBigInt64BE() {
        const tmp = this.#buffer.readBigInt64BE(this.#offset);
        this.#offset += 8;
        return tmp;
    }

    /**
     *
     */
    public readBigInt64LE() {
        const tmp = this.#buffer.readBigInt64LE(this.#offset);
        this.#offset += 8;
        return tmp;
    }

    // public readUIntLE() {
    //     const tmp = this.#buffer.readUIntLE(this.#offset);
    //     this.#offset += 1;
    //     return tmp;
    // }

    // public readUIntBE() {
    //     const tmp = this.#buffer.readUIntBE(this.#offset);
    //     this.#offset += 1;
    //     return tmp;
    // }

    // public readIntLE() {
    //     const tmp = this.#buffer.readIntLE(this.#offset);
    //     this.#offset += 1;
    //     return tmp;
    // }

    // public readIntBE() {
    //     const tmp = this.#buffer.readIntBE(this.#offset);
    //     this.#offset += 1;
    //     return tmp;
    // }

    /**
     *
     */
    public expectUInt8(value: number) {
        const tmp = this.#buffer.readUInt8(this.#offset);
        this.#offset += 1;
        if (tmp !== value) throw new Error(`Expected ${value} but got ${tmp}`);
        return tmp;
    }

    /**
     *
     */
    public readUInt8() {
        const tmp = this.#buffer.readUInt8(this.#offset);
        this.#offset += 1;
        return tmp;
    }

    /**
     *
     */
    public readUInt16LE() {
        const tmp = this.#buffer.readUInt16LE(this.#offset);
        this.#offset += 2;
        return tmp;
    }

    /**
     *
     */
    public readUInt16BE() {
        const tmp = this.#buffer.readUInt16BE(this.#offset);
        this.#offset += 2;
        return tmp;
    }

    /**
     *
     */
    public readUInt32LE() {
        const tmp = this.#buffer.readUInt32LE(this.#offset);
        this.#offset += 4;
        return tmp;
    }

    /**
     *
     */
    public readUInt32BE() {
        const tmp = this.#buffer.readUInt32BE(this.#offset);
        this.#offset += 4;
        return tmp;
    }

    /**
     *
     */
    public readInt8() {
        const tmp = this.#buffer.readInt8(this.#offset);
        this.#offset += 1;
        return tmp;
    }

    /**
     *
     */
    public readInt16LE() {
        const tmp = this.#buffer.readInt16LE(this.#offset);
        this.#offset += 2;
        return tmp;
    }

    /**
     *
     */
    public readInt16BE() {
        const tmp = this.#buffer.readInt16BE(this.#offset);
        this.#offset += 2;
        return tmp;
    }

    /**
     *
     */
    public readInt32LE() {
        const tmp = this.#buffer.readInt32LE(this.#offset);
        this.#offset += 4;
        return tmp;
    }

    /**
     *
     */
    public readInt32BE() {
        const tmp = this.#buffer.readInt32BE(this.#offset);
        this.#offset += 4;
        return tmp;
    }

    /**
     *
     */
    public readFloatLE() {
        const tmp = this.#buffer.readFloatLE(this.#offset);
        this.#offset += 4;
        return tmp;
    }

    /**
     *
     */
    public readFloatBE() {
        const tmp = this.#buffer.readFloatBE(this.#offset);
        this.#offset += 4;
        return tmp;
    }

    /**
     *
     */
    public readDoubleLE() {
        const tmp = this.#buffer.readDoubleLE(this.#offset);
        this.#offset += 8;
        return tmp;
    }

    /**
     *
     */
    public readDoubleBE() {
        const tmp = this.#buffer.readDoubleBE(this.#offset);
        this.#offset += 8;
        return tmp;
    }

    public read(tt: ComponentTypeHeader.String, options?: { endian?: "little" | "big"; readTypeByte?: boolean }): string;
    public read(tt: ComponentTypeHeader.Byte, options?: { endian?: "little" | "big"; readTypeByte?: boolean }): number;
    public read(tt: ComponentTypeHeader.Int16, options?: { endian?: "little" | "big"; readTypeByte?: boolean }): number;
    public read(tt: ComponentTypeHeader.Int32, options?: { endian?: "little" | "big"; readTypeByte?: boolean }): number;
    public read(tt: ComponentTypeHeader.Int64, options?: { endian?: "little" | "big"; readTypeByte?: boolean }): bigint;
    public read(tt: ComponentTypeHeader.Float, options?: { endian?: "little" | "big"; readTypeByte?: boolean }): number;
    public read(tt: ComponentTypeHeader.Double, options?: { endian?: "little" | "big"; readTypeByte?: boolean }): number;
    public read(tt: ComponentTypeHeader.Boolean, options?: { endian?: "little" | "big"; readTypeByte?: boolean }): boolean;
    public read(tt: ComponentTypeHeader.ByteArray, options?: { endian?: "little" | "big"; readTypeByte?: boolean }): Buffer;
    public read(tt: ComponentTypeHeader, options?: { endian?: "little" | "big"; readTypeByte?: boolean }): string | number | bigint | boolean | Buffer;

    public read(tt: ComponentTypeHeader, options: { endian?: "little" | "big"; readTypeByte?: boolean } = {}): string | number | bigint | boolean | Buffer {
        options.endian ??= "little";
        options.readTypeByte ??= false;

        const little = options.endian === "little";
        const readTypeByte = options.readTypeByte;

        if (readTypeByte) {
            this.expectUInt8(tt);
        }

        switch (tt) {
            case ComponentTypeHeader.String:
                return this.readDynamicBuffer().toString("ascii");
            case ComponentTypeHeader.Byte:
                return this.readUInt8();
            case ComponentTypeHeader.Int16:
                return little ? this.readInt16LE() : this.readInt16BE();
            case ComponentTypeHeader.Int32:
                return little ? this.readInt32LE() : this.readInt32BE();
            case ComponentTypeHeader.UInt32:
                return little ? this.readInt32LE() : this.readInt32BE();
            case ComponentTypeHeader.Int64:
                return little ? this.readBigInt64LE() : this.readBigInt64BE();
            case ComponentTypeHeader.Float:
                return little ? this.readFloatLE() : this.readFloatBE();
            case ComponentTypeHeader.Double:
                return little ? this.readDoubleLE() : this.readDoubleBE();
            case ComponentTypeHeader.Boolean:
                return !!this.readUInt8();
            case ComponentTypeHeader.ByteArray:
                return this.readDynamicBuffer();
        }
    }

    //
    //
    // Methods
    //
    //

    /**
     *
     */
    public toBuffer(): Buffer {
        return this.#buffer;
    }

    /**
     * https://stackoverflow.com/questions/8609289/convert-a-binary-nodejs-buffer-to-javascript-arraybuffer
     */
    public toArrayBuffer(): ArrayBuffer {
        const arrayBuffer = new ArrayBuffer(this.length);
        const view = new Uint8Array(arrayBuffer);
        for (let i = 0; i < this.length; ++i) {
            view[i] = this.#buffer[i];
        }
        return arrayBuffer;
    }

    /**
     *
     */
    public at(idx: number) {
        return this.#buffer[idx];
    }

    /**
     * Advanced the buffer reader by pffset.
     */
    public advanceOffset(relativeOffset = 1): this {
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
     * Reads a dynamic buffer which is prepended by its' length
     * in 7-bit encoding.
     */
    public readDynamicBuffer() {
        const length = this.read7BitInt();
        const value = this.subarray(this.#offset, length);
        this.#offset += length;
        return value.toBuffer();
    }

    /**
     * Append a buffer to the current buffer. Asserts the cursor
     * to be at the end of the current buffer.
     */
    public append(buffer: Buffer) {
        if (this.#offset !== this.length - 1) throw new Error("Cursor hasn't finished reading yet.");
        this.#buffer = Buffer.concat([this.#buffer, buffer]);
        return this;
    }

    /**
     * Keep Deserializing the buffer for typed data until
     * you reach the end of the buffer. Typed data consists
     * of a type indicator in 7-bit-encoding and data following
     * accordingly.
     */
    public deserialize() {
        const arr: (string | number | boolean | Buffer | bigint)[] = [];

        while (this.#offset < this.length) {
            const type = this.read7BitInt();

            switch (type) {
                case ComponentTypeHeader.String:
                    arr.push(this.readDynamicBuffer().toString("ascii"));
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
                    arr.push(this.readDynamicBuffer());
                    break;
                default:
                    throw new Error(`While serializing a buffer for data, an unexpected type 0x${type.toString(16)} was read. Expected one of 0-8`);
            }
        }

        return arr;
    }

    [Symbol.for("nodejs.util.inspect.custom")]() {
        let s = "<BufferReader";
        let copy = BufferReader.from(this.#buffer);
        copy.#offset = this.#offset;

        for (let i = 0; i < 20 && this.#offset + i < this.length - 1; i++) {
            s += " " + copy.readUInt8().toString(16).padStart(2, "0");
        }

        return s + ">";
    }
}
