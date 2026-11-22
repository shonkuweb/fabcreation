import { NextResponse } from "next/server";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import {
  getOrders,
  createOrder,
  getProductById,
  updateProduct,
  getSettings,
  type OrderItem,
  type Order,
} from "@/lib/db";
import { sendOrderConfirmationEmail } from "@/lib/resend";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      items,
      orderType = "retail",
      customerMobile,
      customerEmail,
      customerName,
    } = body;

    // Validate required Razorpay verification fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required verification fields (razorpay_order_id, razorpay_payment_id, razorpay_signature)",
          message: "Missing required verification fields",
        },
        { status: 400 }
      );
    }

    // Verify cryptographic HMAC-SHA256 signature
    const isValid = verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      console.warn(
        `[Razorpay Verify] Signature mismatch for order ${razorpay_order_id} and payment ${razorpay_payment_id}`
      );
      return NextResponse.json(
        {
          success: false,
          error: "Invalid payment signature. Verification failed.",
          message: "Invalid payment signature. Verification failed.",
        },
        { status: 400 }
      );
    }

    // Check if order already recorded in database
    const existingOrders = getOrders();
    const existingOrder = existingOrders.find(
      (o) =>
        o.razorpayPaymentId === razorpay_payment_id ||
        (o.razorpayOrderId && o.razorpayOrderId === razorpay_order_id)
    );

    if (existingOrder) {
      return NextResponse.json({
        success: true,
        message: "Payment already verified and order recorded.",
        order: existingOrder,
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
      });
    }

    // If items are provided, construct the actual verified order and persist to database
    let createdOrder: Order | null = null;
    if (items && Array.isArray(items) && items.length > 0) {
      const mode = orderType === "wholesale" ? "wholesale" : "retail";
      const verifiedItems: OrderItem[] = [];
      let calculatedSubtotal = 0;

      for (let idx = 0; idx < items.length; idx++) {
        const rawItem = items[idx];
        const prodId = String(rawItem.id || rawItem.productId || "");
        const dbProduct = prodId ? getProductById(prodId) : undefined;
        const quantity = Math.max(1, Number(rawItem.quantity) || 1);

        let itemPrice = 0;
        let itemName = String(rawItem.name || "Jewellery Item").trim();
        let itemImage = String(rawItem.image || "/images/products/moon-necklace.jpg");
        let itemWholesaleMinQty = rawItem.wholesaleMinQty ? Number(rawItem.wholesaleMinQty) : 1;

        if (dbProduct) {
          itemName = dbProduct.name;
          itemImage = dbProduct.image || itemImage;
          const rPrice = dbProduct.retailPrice ?? dbProduct.price ?? 0;
          const wPrice = dbProduct.wholesalePrice ?? dbProduct.price ?? rPrice;
          itemPrice = mode === "wholesale" ? wPrice : rPrice;
          itemWholesaleMinQty = dbProduct.wholesaleMinQty ?? itemWholesaleMinQty;
        } else {
          itemPrice = Math.max(0, Number(rawItem.price) || 0);
        }

        calculatedSubtotal += itemPrice * quantity;
        verifiedItems.push({
          id: prodId || `item-${Date.now()}-${idx}`,
          name: itemName,
          price: itemPrice,
          quantity,
          image: itemImage,
          wholesaleMinQty: itemWholesaleMinQty,
        });
      }

      // Decrement stock for purchased items
      for (const item of verifiedItems) {
        if (item.id && !item.id.startsWith("item-")) {
          const p = getProductById(item.id);
          if (p && typeof p.stock === "number" && p.stock > 0) {
            updateProduct(p.id, {
              stock: Math.max(0, p.stock - item.quantity),
            });
          }
        }
      }

      const settings = getSettings();
      const wholesaleDelivery = Number(settings.wholesaleDeliveryCharge ?? 125);
      const retailFreeShip = Number(settings.retailFreeShippingThreshold ?? 999);
      const retailDelivery = Number(settings.retailDeliveryCharge ?? 125);

      const finalSubtotal = Number(calculatedSubtotal.toFixed(1));
      const finalGst = Number((finalSubtotal * 0.03).toFixed(1));

      let finalShipping = 0;
      if (mode === "wholesale") {
        finalShipping = wholesaleDelivery;
      } else {
        finalShipping = finalSubtotal >= retailFreeShip ? 0 : retailDelivery;
      }
      const finalTotal = Number((finalSubtotal + finalGst + finalShipping).toFixed(1));

      const emailStr = (customerEmail || "").trim();
      const mobileStr = (customerMobile || "").trim();
      const validMobile =
        mobileStr || emailStr || (mode === "wholesale" ? "Wholesale Partner" : "Retail Customer");

      createdOrder = createOrder({
        customerMobile: validMobile,
        customerEmail: emailStr || (validMobile.includes("@") ? validMobile : undefined),
        customerName: (customerName || "").trim() || "Customer",
        items: verifiedItems,
        subtotal: finalSubtotal,
        gst: finalGst,
        shipping: finalShipping,
        total: finalTotal,
        status: "Confirmed",
        orderType: mode,
        paymentStatus: "paid",
        paymentMethod: "razorpay",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      });

      // Send Order Confirmation Email
      let recipientEmail = emailStr || (validMobile.includes("@") ? validMobile : "");
      if (!recipientEmail) {
        try {
          const { getRetailUsers, getWholesaleUsers } = await import("@/lib/db");
          if (mode === "wholesale") {
            const wsUser = getWholesaleUsers().find(
              (u) =>
                (u.mobile && u.mobile.replace(/\D/g, "") === validMobile.replace(/\D/g, "")) ||
                (u.name && u.name.toLowerCase() === (customerName || "").toLowerCase())
            );
            if (wsUser?.email) recipientEmail = wsUser.email;
          } else {
            const retUser = getRetailUsers().find(
              (u) =>
                (u.mobile && u.mobile.replace(/\D/g, "") === validMobile.replace(/\D/g, "")) ||
                (u.email && u.email.includes("@"))
            );
            if (retUser?.email) recipientEmail = retUser.email;
          }
        } catch (lookupErr) {
          console.warn("[Razorpay Verify] Email lookup error:", lookupErr);
        }
      }

      if (recipientEmail && recipientEmail.includes("@")) {
        sendOrderConfirmationEmail({
          orderNumber: createdOrder.orderNumber,
          customerName: createdOrder.customerName,
          customerEmail: recipientEmail,
          customerMobile: createdOrder.customerMobile,
          orderType: createdOrder.orderType,
          items: createdOrder.items,
          subtotal: createdOrder.subtotal,
          gst: createdOrder.gst,
          shipping: createdOrder.shipping,
          total: createdOrder.total,
          createdAt: createdOrder.createdAt,
        }).catch((emailErr) => {
          console.error("[Razorpay Verify] Confirmation email delivery failed:", emailErr);
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      order: createdOrder,
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
    });
  } catch (err: any) {
    console.error("[Razorpay Verify Signature Error]:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during verification",
        message: err.message || "Failed to verify payment",
      },
      { status: 500 }
    );
  }
}
