import crypto from "crypto";

/**
 * Hashes a plaintext password using scrypt with a cryptographically secure random salt.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password.trim(), salt, 64).toString("hex");
  return `scrypt:${salt}:${derivedKey}`;
}

/**
 * Verifies a password against a stored hash or legacy plaintext string using constant-time comparison.
 */
export function verifyPassword(password: string, storedHashOrPlain: string): boolean {
  if (!password || !storedHashOrPlain) return false;

  const cleanPassword = password.trim();

  // If password was hashed with scrypt
  if (storedHashOrPlain.startsWith("scrypt:")) {
    const parts = storedHashOrPlain.split(":");
    if (parts.length !== 3) return false;

    const salt = parts[1];
    const originalHashHex = parts[2];

    try {
      const hashBuffer = Buffer.from(originalHashHex, "hex");
      const testHash = crypto.scryptSync(cleanPassword, salt, 64);
      if (hashBuffer.length !== testHash.length) return false;
      return crypto.timingSafeEqual(hashBuffer, testHash);
    } catch {
      return false;
    }
  }

  // Backward compatibility for existing plaintext passwords (using constant-time comparison)
  try {
    const bufA = Buffer.from(cleanPassword);
    const bufB = Buffer.from(storedHashOrPlain);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}
