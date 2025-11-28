"use strict";

// Minimal RC4 implementation compatible with Firebird Arc4 wire plugin.

class Arc4State {
  constructor(key) {
    this.s = new Uint8Array(256);
    for (let i = 0; i < 256; i++) this.s[i] = i;
    let j = 0;
    for (let i = 0; i < 256; i++) {
      j = (j + this.s[i] + key[i % key.length]) & 0xff;
      [this.s[i], this.s[j]] = [this.s[j], this.s[i]];
    }
    this.i = 0;
    this.j = 0;
  }

  process(buf) {
    const out = Buffer.alloc(buf.length);
    for (let k = 0; k < buf.length; k++) {
      this.i = (this.i + 1) & 0xff;
      this.j = (this.j + this.s[this.i]) & 0xff;
      [this.s[this.i], this.s[this.j]] = [this.s[this.j], this.s[this.i]];
      const idx = (this.s[this.i] + this.s[this.j]) & 0xff;
      out[k] = buf[k] ^ this.s[idx];
    }
    return out;
  }
}

class Arc4WireCrypt {
  constructor(keyBytes) {
    const key = Buffer.isBuffer(keyBytes) ? keyBytes : Buffer.from(keyBytes);
    this.enc = new Arc4State(key);
    this.dec = new Arc4State(key);
  }

  encrypt(buf) {
    return this.enc.process(buf);
  }

  decrypt(buf) {
    return this.dec.process(buf);
  }
}

module.exports = { Arc4WireCrypt };

