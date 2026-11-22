import { NextResponse } from "next/server";
import { createRazorpayOrder } from "@/lib/razorpay";
import { getProductById, getSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    let { amount, currency = "INR", receipt, notes } = body;

    // If cart items are provided, calculate verified amounts securely server-side
    if (body.items && Array.isArray(body.items) && body.items.length > 0) {
      const orderType =
        body.orderType === "wholesale" || body.storeMode === "wholesale"
          ? "wholesale"
          : "retail";

      let calculatedSubtotal = 0;
      for (const rawItem of body.items) {
        const prodId = String(rawItem.id || rawItem.productId || "");
        const dbProduct = prodId ? getProductById(prodId) : undefined;
        const quantity = Math.max(1, Number(rawItem.quantity) || 1);

        let itemPrice = 0;
        if (dbProduct) {
          const rPrice = dbProduct.retailPrice ?? dbProduct.price ?? 0;
          const wPrice = dbProduct.wholesalePrice ?? dbProduct.price ?? rPrice;
          itemPrice = orderType === "wholesale" ? wPrice : rPrice;
        } else {
          itemPrice = Math.max(0, Number(rawItem.price) || 0);
        }

        calculatedSubtotal += itemPrice * quantity;
      }

      const settings = getSettings();
      const wholesaleDelivery = Number(settings.wholesaleDeliveryCharge ?? 125);
      const retailFreeShip = Number(settings.retailFreeShippingThreshold ?? 999);
      const retailDelivery = Number(settings.retailDeliveryCharge ?? 125);

      const finalSubtotal = Number(calculatedSubtotal.toFixed(1));
      const finalGst = Number((finalSubtotal * 0.03).toFixed(1));

      let finalShipping = 0;
      if (orderType === "wholesale") {
        finalShipping = wholesaleDelivery;
      } else {
        finalShipping = finalSubtotal >= retailFreeShip ? 0 : retailDelivery;
      }

      const calculatedTotal = Number(
        (finalSubtotal + finalGst + finalShipping).toFixed(1)
      );
      // Convert to paise (1 INR = 100 paise)
      amount = Math.round(calculatedTotal * 100);
    } else if (typeof amount === "number") {
      amount = Math.round(amount);
    }

    // Minimum amount validation: >= 100 paise (₹1)
    if (!amount || amount < 100) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid amount. Minimum amount is 100 paise (₹1).",
          message: "Invalid amount. Minimum amount is 100 paise (₹1).",
        },
        { status: 400 }
      );
    }

    const receiptId =
      receipt ||
      `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const rzpOrder = await createRazorpayOrder({
      amount: Math.round(amount),
      currency: String(currency).toUpperCase(),
      receipt: receiptId,
      notes: notes || {},
    });

    return NextResponse.json({
      success: true,
      order_id: rzpOrder.order_id,
      id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      receipt: rzpOrder.receipt,
      key_id:
        rzpOrder.key_id ||
        process.env.RAZORPAY_KEY_ID ||
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
        "rzp_test_U2vM87ObwlA5Xi",
    });
  } catch (err: any) {
    console.error("[Razorpay Create Order Error]:", err);
    if (err.statusCode === 401 || err.status === 401) {
      return NextResponse.json(
        {
          success: false,
          error: "Razorpay authentication failed",
          message:
            err.error?.description || err.message || "Unauthorized",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create Razorpay order",
        message:
          err.error?.description ||
          err.message ||
          "Failed to create order with Razorpay",
      },
      { status: 500 }
    );
  }
}
