import Razorpay from "razorpay";
import crypto from "crypto";

const DEFAULT_KEY_ID = "rzp_test_U2vM87ObwlA5Xi";
const DEFAULT_KEY_SECRET = "WKHK46256g7gSsVCqm2m88T2";

let razorpayInstance: Razorpay | null = null;

export function getRazorpayKeys(): { keyId: string; keySecret: string } {
  let keyId =
    process.env.RAZORPAY_KEY_ID?.trim() ||
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim();
  let keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  // If not in process.env, attempt to load from disk (.env.local or .env)
  if (!keyId || !keySecret) {
    try {
      const fs = require("fs");
      const path = require("path");
      const candidates = [
        path.resolve(process.cwd(), ".env.local"),
        path.resolve(process.cwd(), ".env"),
        path.resolve(process.cwd(), "..", ".env.local"),
        path.resolve(process.cwd(), "..", ".env"),
      ];
      for (const filePath of candidates) {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, "utf-8");
          if (!keyId) {
            const m = content.match(
              /^(?:RAZORPAY_KEY_ID|NEXT_PUBLIC_RAZORPAY_KEY_ID)=["']?([^"'\r\n]+)["']?/m
            );
            if (m && m[1]) keyId = m[1].trim();
          }
          if (!keySecret) {
            const m = content.match(
              /^RAZORPAY_KEY_SECRET=["']?([^"'\r\n]+)["']?/m
            );
            if (m && m[1]) keySecret = m[1].trim();
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // Gracefully fall back to the test credentials so test checkout works seamlessly
  keyId = keyId || DEFAULT_KEY_ID;
  keySecret = keySecret || DEFAULT_KEY_SECRET;

  return { keyId, keySecret };
}

export function getRazorpayClient(): Razorpay {
  const { keyId, keySecret } = getRazorpayKeys();

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  return razorpayInstance;
}

export async function createRazorpayOrder({
  amount,
  currency = "INR",
  receipt,
  notes,
}: {
  amount: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, any>;
}): Promise<{
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  receipt?: string;
  key_id: string;
}> {
  const { keyId, keySecret } = getRazorpayKeys();

  const authHeader =
    "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(amount),
      currency: currency.toUpperCase(),
      receipt: receipt ? String(receipt).substring(0, 40) : undefined,
      notes: notes || {},
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg =
      data?.error?.description ||
      data?.message ||
      `Razorpay API error: ${response.status} ${response.statusText}`;
    const err = new Error(errorMsg);
    (err as any).statusCode = response.status;
    (err as any).error = data?.error;
    throw err;
  }

  return {
    id: data.id,
    order_id: data.id,
    amount: data.amount,
    currency: data.currency,
    receipt: data.receipt,
    key_id: keyId,
  };
}

export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const { keySecret } = getRazorpayKeys();

  if (!keySecret) {
    console.error("[Razorpay] Missing key secret for signature verification");
    return false;
  }

  if (!orderId || !paymentId || !signature) {
    return false;
  }

  const payload = `${orderId}|${paymentId}`;
  const generatedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(payload)
    .digest("hex");

  return generatedSignature === signature;
}
