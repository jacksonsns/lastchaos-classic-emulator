
const SmartBuffer = require('smart-buffer').SmartBuffer;

const lccrypt = require('@local/shared/lccrypt');
const game = require('../GameServer/src/game'); // TODO: move this

class Message {
    /**
     * Constructor
     * @param {Buffer} buffer initialize from given `Buffer` object
     * @param {number} type write message type
     * @param {number} subType write message subtype
     * @param {Boolean} [header=true] read lc packet header?
     * @param {Boolean} [encrypted=true] is packet encrypted?
     */
    constructor({ buffer, type, subType, header, encrypted = true }) {
        if(buffer && type)
            buffer.writeUInt8(buffer.readUInt8(0) | 0x80, 0);

        this._sb = buffer
            ? SmartBuffer.fromBuffer(buffer) 
            : new SmartBuffer();

        this.encrypted = encrypted;
    
        this.header = (header !== false && this._sb.length > 12) ? {    // 12 - header length
            'reliable': this.read('u16>'),                              // ntohs
            'sequence': this.read('u32>'),                              // ntohl
            'packetId': this.read('u16>'),
            'packetSize': this.read('u32>'),
        } : null;

        if(buffer && this.encrypted && game.encryption) {
            var decrypted = this.decrypt(buffer.slice(12));          // TODO: implement error handler
            this._sb = SmartBuffer.fromBuffer(decrypted);
        }

        if(type || type === 0)          this.write('u8', game.packDefault ? type | 0x80 : type);
        if(subType || subType === 0)    this.write('u8', subType);
    }

    /**
     * Decrypt buffer using LCCrypt library
     * @param {Buffer} buffer message buffer
     * @return {Buffer}
     */
    static decrypt = (buffer) => lccrypt.decrypt(buffer);

    /**
     * Encrypt buffer using LCCrypt library
     * @param {Buffer} buffer message buffer
     * @return {Buffer}
     */
    static encrypt = (buffer) => lccrypt.encrypt(buffer);

    /**
     * Get Buffer object
     * @return {Buffer}
     */
    buffer = () => this._sb.toBuffer();

    /**
     * Get string buffer
     * @return {string}
     */
    toString = () => this.buffer().toString('hex');

    /**
     * Build message and export it to `Buffer` object
     * @param {number} clientId client id
     * @param {Boolean} [header=true] write lc packet header?
     * @param {Boolean} [encrypt=true] encrypt packet?
     * @return {Buffer}
     */
    build(header, encrypt) {
        const makeHeader = (messageSize) => {
            var writer = new SmartBuffer();

            writer.writeUInt16BE((1 << 0) | (1 << 7) | (1 << 8));                       // reliable
            writer.writeUInt32BE(0);                                                    // sequence
            writer.writeUInt16BE(0);                                                    // packet id
            writer.writeUInt32BE(encrypt !== false && game.encryption ? (messageSize + 5) : messageSize);  // message size + lccrypt sum  || FIXME: write it smarter

            return writer;
        };

        return header === false
            ? this._sb.toBuffer()
            : Buffer.concat([ makeHeader(this._sb.length).toBuffer(), encrypt !== false && game.encryption ? this.encrypt(this._sb.toBuffer()) : this._sb.toBuffer() ]);
    }

    /**
     * Available types: \
     * `i8` `u8` `i16` `u16` `i32` `u32` `i64` `u64` `f (float)` `stringnt` \
     * you can set endian by using `> (big)` or `< (little)` at the end of type
     * @param {string} type type
     * @param {value} val value
     */
    read(type) {
        var val;

        switch(type) {
            case 'i8':          val = this._sb.readInt8(); break;
            case 'u8':          val = this._sb.readUInt8(); break;
            case 'stringnt':    val = this._sb.readStringNT(val); break;
            case 'i16<':        val = this._sb.readInt16LE(); break;
            case 'i16>':        val = this._sb.readInt16BE(); break;
            case 'u16<':        val = this._sb.readUInt16LE(); break;
            case 'u16>':        val = this._sb.readUInt16BE(); break;
            case 'i32<':        val = this._sb.readInt32LE(); break;
            case 'i32>':        val = this._sb.readInt32BE(); break;
            case 'u32<':        val = this._sb.readUInt32LE(); break;
            case 'u32>':        val = this._sb.readUInt32BE(); break;
            case 'i64<':        val = this._sb.readBigInt64LE(); break;
            case 'i64>':        val = this._sb.readBigInt64BE(); break;
            case 'u64<':        val = this._sb.readBigUInt64LE(); break;
            case 'u64>':        val = this._sb.readBigUInt64BE(); break;
            case 'f<':          val = this._sb.readFloatLE(); break;
            case 'f>':          val = this._sb.readFloatBE(); break;
        }

        return val;
    }

    /**
     * Available types: \
     * `i8` `u8` `i16` `u16` `i32` `u32` `i64` `u64` `f (float)` `stringnt` \
     * You can set endian by using `> (big)` or `< (little)` at the end of type
     * @param {string} type type
     * @param {value} val value
     */
    write(type, val) {
        switch(type) {
            case 'i8':          this._sb.writeInt8(val); break;
            case 'u8':          this._sb.writeUInt8(val); break;
            case 'stringnt':    this._sb.writeStringNT(val); break;
            case 'i16<':        this._sb.writeInt16LE(val); break;
            case 'i16>':        this._sb.writeInt16BE(val); break;
            case 'u16<':        this._sb.writeUInt16LE(val); break;
            case 'u16>':        this._sb.writeUInt16BE(val); break;
            case 'i32<':        this._sb.writeInt32LE(val); break;
            case 'i32>':        this._sb.writeInt32BE(val); break;
            case 'u32<':        this._sb.writeUInt32LE(val); break;
            case 'u32>':        this._sb.writeUInt32BE(val); break;
            case 'i64<':        this._sb.writeBigInt64LE(BigInt(val)); break;
            case 'i64>':        this._sb.writeBigInt64BE(BigInt(val)); break;
            case 'u64<':        this._sb.writeBigUInt64LE(BigInt(val)); break;
            case 'u64>':        this._sb.writeBigUInt64BE(BigInt(val)); break;
            case 'f<':          this._sb.writeFloatLE(val); break;
            case 'f>':          this._sb.writeFloatBE(val); break;
        }
    }
};

module.exports = Message;
