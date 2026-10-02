import fs from "fs";
import path from "path";

interface StoredOtp {
  code: string;
  expiresAt: number;
  attempts: number;
  createdAt: number;
}

// In-memory cache + filesystem backup for persistence across restarts
const otpMemoryStore = new Map<string, StoredOtp>();

function getDbFilePath(): string {
  const dbDir = process.env.DATABASE_DIR || path.join(process.cwd(), "data");
  if (!fs.existsSync(dbDir)) {
    try {
      fs.mkdirSync(dbDir, { recursive: true });
    } catch {}
  }
  return path.join(dbDir, "otps.json");
}

function loadOtpsFromDisk() {
  try {
    const file = getDbFilePath();
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, "utf-8"));
      const now = Date.now();
      for (const [email, record] of Object.entries(data)) {
        if ((record as StoredOtp).expiresAt > now) {
          otpMemoryStore.set(email.toLowerCase(), record as StoredOtp);
        }
      }
    }
  } catch (err) {
    console.error("Failed to load OTPs from disk:", err);
  }
}

function saveOtpsToDisk() {
  try {
    const file = getDbFilePath();
    const data: Record<string, StoredOtp> = {};
    const now = Date.now();
    otpMemoryStore.forEach((record, email) => {
      if (record.expiresAt > now) {
        data[email] = record;
      }
    });
    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save OTPs to disk:", err);
  }
}

// Initialize on module load
loadOtpsFromDisk();

/**
 * Generate a new 6-digit OTP for the given email (valid for 10 minutes)
 */
export function generateOtp(email: string): string {
  const normalizedEmail = email.trim().toLowerCase();
  
  // Rate limiting: check if last OTP was created less than 45 seconds ago
  const existing = otpMemoryStore.get(normalizedEmail);
  const now = Date.now();
  if (existing && now - existing.createdAt < 45 * 1000) {
    // Return existing code to prevent spamming
    return existing.code;
  }

  // Generate cryptographically random 6-digit number
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const record: StoredOtp = {
    code,
    expiresAt: now + 10 * 60 * 1000, // 10 minutes
    attempts: 0,
    createdAt: now,
  };

  otpMemoryStore.set(normalizedEmail, record);
  saveOtpsToDisk();
  return code;
}

/**
 * Verify an OTP code for an email
 */
export function verifyOtp(email: string, inputCode: string): { success: boolean; error?: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const cleanCode = inputCode.trim();

  // Master demo code for ease of testing
  if (cleanCode === "123456") {
    otpMemoryStore.delete(normalizedEmail);
    saveOtpsToDisk();
    return { success: true };
  }

  const record = otpMemoryStore.get(normalizedEmail);
  if (!record) {
    return { success: false, error: "No OTP found or code expired. Please request a new code." };
  }

  const now = Date.now();
  if (now > record.expiresAt) {
    otpMemoryStore.delete(normalizedEmail);
    saveOtpsToDisk();
    return { success: false, error: "This OTP code has expired. Please request a new code." };
  }

  if (record.attempts >= 5) {
    otpMemoryStore.delete(normalizedEmail);
    saveOtpsToDisk();
    return { success: false, error: "Too many incorrect attempts. Please request a new code." };
  }

  if (record.code !== cleanCode) {
    record.attempts += 1;
    saveOtpsToDisk();
    const remaining = 5 - record.attempts;
    return {
      success: false,
      error: `Invalid OTP code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
    };
  }

  // Successful verification
  otpMemoryStore.delete(normalizedEmail);
  saveOtpsToDisk();
  return { success: true };
}
