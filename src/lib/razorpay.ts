import Razorpay from "razorpay";
import crypto from "crypto";

let razorpayInstance: Razorpay | null = null;

export function getRazorpayClient(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay credentials missing. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local"
    );
  }

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
}> {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay credentials missing. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local"
    );
  }

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
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!secret) {
    console.error("[Razorpay] Missing RAZORPAY_KEY_SECRET for signature verification");
    return false;
  }

  if (!orderId || !paymentId || !signature) {
    return false;
  }

  const payload = `${orderId}|${paymentId}`;
  const generatedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return generatedSignature === signature;
}
