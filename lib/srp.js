"use strict";

const crypto = require("crypto");

// Firebird SRP parameters (from src/auth/SecureRemotePassword/srp.cpp)
const PRIME_HEX =
  "E67D2E994B2F900C3F41F08F5BB2627ED0D49EE1FE767A52EFCD565CD6E768812C3E1E9CE8F0A8BEA6CB13CD29DDEBF7A96D4A93B55D488DF099A15C89DCB0640738EB2CBDD9A8F7BAB561AB1B0DC1C6CDABF303264A08D1BCA932D1F1EE428B619D970F342ABA9A65793B8B2F041AE5364350C16F735F56ECBCA87BD57B29E7";
const GENERATOR = 2n;

// Hash mapping to Firebird plugin names
const HASH_BY_PLUGIN = {
  Srp: "sha1",
  Srp224: "sha224",
  Srp256: "sha256",
  Srp384: "sha384",
  Srp512: "sha512",
};

function hexToBigInt(hex) {
  return BigInt("0x" + hex);
}

function bigIntToHex(bi) {
  let hex = bi.toString(16);
  if (hex.length % 2 !== 0) hex = "0" + hex;
  return hex.toLowerCase();
}

function leftPadHex(hex, targetLength) {
  if (hex.length >= targetLength) return hex;
  return "0".repeat(targetLength - hex.length) + hex;
}

function hashBytes(hashName, buffers) {
  const h = crypto.createHash(hashName);
  buffers.forEach((b) => h.update(b));
  return h.digest();
}

function hashBigInt(hashName, bi, padTo) {
  const buf = bigIntToBuffer(bi, { padTo });
  return hashBytes(hashName, [buf]);
}

function bigIntToBuffer(bi, { padTo, stripLeading = false } = {}) {
  let hex = bigIntToHex(bi);
  if (stripLeading) {
    hex = hex.replace(/^(00)+/, "");
    if (hex.length === 0) hex = "00";
  }
  if (padTo) hex = leftPadHex(hex, padTo);
  return Buffer.from(hex, "hex");
}

function bufferToBigInt(buf) {
  return BigInt("0x" + buf.toString("hex"));
}

class SrpClient {
  constructor({ user, password, hash = "sha1" } = {}) {
    this.user = (user || "").toUpperCase();
    this.password = password || "";
    this.N = hexToBigInt(PRIME_HEX);
    this.g = GENERATOR;
    this.hashName = hash;
    const gHex = bigIntToHex(this.g);
    const nHex = bigIntToHex(this.N);
    const padLen = nHex.length;
    const kHash = hashBytes(hash, [Buffer.from(nHex, "hex"), Buffer.from(leftPadHex(gHex, padLen), "hex")]);
    this.k = hexToBigInt(kHash.toString("hex"));
  }

  static fromPluginName(pluginName, opts) {
    const hash = HASH_BY_PLUGIN[pluginName] || "sha1";
    return new SrpClient({ ...opts, hash });
  }

  generateEphemeral() {
    const aBuf = crypto.randomBytes(128);
    const a = hexToBigInt(aBuf.toString("hex")) % this.N;
    const A = this.modPow(this.g, a, this.N);
    return { a, A, Ahex: bigIntToHex(A) };
  }

  computeSession({ a, A, saltHex, Bhex }) {
    const B = hexToBigInt(Bhex);
    // Server sends salt as ASCII hex; hash the textual form to match Firebird/Jaybird.
    const salt = Buffer.from(saltHex, "ascii");

    // u = H(pad(A)|pad(B)) with stripped leading zero per Firebird code
    const uHash = hashBytes(this.hashName, [
      bigIntToBuffer(A, { stripLeading: true }),
      bigIntToBuffer(B, { stripLeading: true }),
    ]);
    const u = bufferToBigInt(uHash);

    const userHash = hashBytes(this.hashName, [Buffer.from(`${this.user}:${this.password}`, "utf8")]);
    const xHash = hashBytes(this.hashName, [salt, userHash]);
    const x = hexToBigInt(xHash.toString("hex"));

    const gx = this.modPow(this.g, x, this.N);
    const kgx = (this.k * gx) % this.N;
    const diff = (B - kgx + this.N) % this.N;
    const aux = (a + u * x) % this.N;
    const S = this.modPow(diff, aux, this.N);
    const K = hashBytes(this.hashName, [bigIntToBuffer(S, { stripLeading: true })]);

    // client proof M = H(H(N)^H(g) via modPow, H(I), s, A, B, K)
    const HN = bufferToBigInt(hashBigInt(this.hashName, this.N));
    const Hg = bufferToBigInt(hashBigInt(this.hashName, this.g));
    const HNg = this.modPow(HN, Hg, this.N);
    const HI = hashBytes(this.hashName, [Buffer.from(this.user, "utf8")]);
    const M = hashBytes(this.hashName, [
      bigIntToBuffer(HNg, { stripLeading: true }),
      HI,
      salt,
      bigIntToBuffer(A, { stripLeading: true }),
      bigIntToBuffer(B, { stripLeading: true }),
      K,
    ]);

    return {
      K,
      Mhex: M.toString("hex"),
      Ahex: bigIntToHex(A),
      Bhex,
      saltHex,
      u,
      S,
    };
  }

  modPow(base, exp, mod) {
    let result = 1n;
    let b = base % mod;
    let e = exp;
    while (e > 0n) {
      if (e & 1n) result = (result * b) % mod;
      e >>= 1n;
      if (e) b = (b * b) % mod;
    }
    return result;
  }
}

module.exports = {
  SrpClient,
  PRIME_HEX,
  GENERATOR,
  HASH_BY_PLUGIN,
};
