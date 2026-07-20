import crypto from "node:crypto";

// Verifies passwords hashed by ASP.NET Core Identity's default
// PasswordHasher<TUser>, so athletes/admins imported from the Azure app
// can log in with their existing password unchanged.
//
// Format (V3, marker 0x01 — used by ASP.NET Core Identity 2.0+):
//   0x01 | prf (4 bytes BE) | iterCount (4 bytes BE) | saltLength (4 bytes BE)
//   | salt (saltLength bytes) | subkey (remaining bytes)
// prf: 0 = HMACSHA1, 1 = HMACSHA256, 2 = HMACSHA512
//
// Format (V2, marker 0x00 — legacy ASP.NET Identity / Framework):
//   0x00 | salt (16 bytes) | subkey (32 bytes), fixed HMACSHA1, 1000 iterations
const V3_PRF_DIGESTS = ["sha1", "sha256", "sha512"] as const;

export function isAspNetIdentityHash(hash: string): boolean {
  try {
    const decoded = Buffer.from(hash, "base64");
    return decoded.length > 0 && (decoded[0] === 0x00 || decoded[0] === 0x01);
  } catch {
    return false;
  }
}

export function verifyAspNetIdentityPassword(password: string, hash: string): boolean {
  let decoded: Buffer;
  try {
    decoded = Buffer.from(hash, "base64");
  } catch {
    return false;
  }
  if (decoded.length === 0) return false;

  const marker = decoded[0];

  if (marker === 0x01) {
    if (decoded.length < 13) return false;
    const prf = decoded.readUInt32BE(1);
    const iterCount = decoded.readUInt32BE(5);
    const saltLength = decoded.readUInt32BE(9);
    const digest = V3_PRF_DIGESTS[prf];
    if (!digest || decoded.length < 13 + saltLength) return false;

    const salt = decoded.subarray(13, 13 + saltLength);
    const subkey = decoded.subarray(13 + saltLength);
    const derived = crypto.pbkdf2Sync(password, salt, iterCount, subkey.length, digest);
    return derived.length === subkey.length && crypto.timingSafeEqual(derived, subkey);
  }

  if (marker === 0x00) {
    if (decoded.length < 49) return false;
    const salt = decoded.subarray(1, 17);
    const subkey = decoded.subarray(17, 49);
    const derived = crypto.pbkdf2Sync(password, salt, 1000, 32, "sha1");
    return crypto.timingSafeEqual(derived, subkey);
  }

  return false;
}
