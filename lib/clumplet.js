"use strict";

// Simple clumplet encoder/decoder for CNCT user_id and auth data.
// Encoding: [tag (1 byte)][length (1 byte)][payload], length <= 255.

function encodeClumplet(tag, payload) {
  if (!Buffer.isBuffer(payload)) payload = Buffer.from(payload || "");
  if (payload.length > 255) {
    throw new Error("Clumplet payload too long; chunk it first");
  }
  const out = Buffer.alloc(2 + payload.length);
  out.writeUInt8(tag, 0);
  out.writeUInt8(payload.length, 1);
  payload.copy(out, 2);
  return out;
}

function encodeList(list) {
  return Buffer.concat(list.map((c) => (Buffer.isBuffer(c) ? c : encodeClumplet(c.tag, c.payload))));
}

function decodeList(buf) {
  const res = [];
  let offset = 0;
  while (offset + 2 <= buf.length) {
    const tag = buf.readUInt8(offset);
    const len = buf.readUInt8(offset + 1);
    const end = offset + 2 + len;
    if (end > buf.length) break;
    res.push({ tag, payload: buf.slice(offset + 2, end) });
    offset = end;
  }
  return res;
}

module.exports = { encodeClumplet, encodeList, decodeList };

