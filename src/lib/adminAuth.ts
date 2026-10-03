import crypto from "crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSessionSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "fab-creations-secure-admin-salt-key-2026"
  );
}

/**
 * Creates a cryptographically signed admin session token.
 * Format: `<timestamp>.<nonce>.<hmacSignature>`
 */
export function createAdminSessionToken(): string {
  const timestamp = Date.now().toString();
  const nonce = crypto.randomBytes(16).toString("hex");
  const payload = `${timestamp}.${nonce}`;
  const signature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("hex");
  return `${payload}.${signature}`;
}

/**
 * Validates a signed admin session token and its expiration.
 */
export function verifyAdminSessionToken(token: string | null | undefined): boolean {
  if (!token || typeof token !== "string") return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [timestampStr, nonce, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  const now = Date.now();
  // Valid for 7 days, allow 60s clock skew
  if (now - timestamp > SESSION_DURATION_MS || now < timestamp - 60000) {
    return false;
  }

  const payload = `${timestampStr}.${nonce}`;
  const expectedSignature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("hex");

  try {
    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expectedSignature, "hex");
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

/**
 * Checks if the incoming request has a valid admin session cookie or Bearer token.
 */
export function isAdminAuthenticated(req?: Request | NextRequest): boolean {
  // 1. Try reading cookie via Next.js cookies() API
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("admin_session")?.value;
    if (verifyAdminSessionToken(token)) return true;
  } catch {}

  // 2. Fall back to manual header parsing if Request object was provided
  if (req) {
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/(?:^|;\s*)admin_session=([^;]+)/);
    if (match && verifyAdminSessionToken(decodeURIComponent(match[1]))) {
      return true;
    }

    const authHeader = req.headers.get("authorization") || "";
    if (authHeader.startsWith("Bearer ")) {
      const bearerToken = authHeader.substring(7).trim();
      if (verifyAdminSessionToken(bearerToken)) return true;
    }
  }

  return false;
}
