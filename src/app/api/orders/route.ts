import { NextResponse } from "next/server";
import { getOrders, createOrder } from "@/lib/db";
import { sendOrderConfirmationEmail } from "@/lib/resend";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    let orders = getOrders();
    if (type === "wholesale") {
      orders = orders.filter((o) => o.orderType === "wholesale");
    } else if (type === "retail") {
      orders = orders.filter((o) => o.orderType !== "wholesale");
    }
    return NextResponse.json(
      { success: true, orders },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customerMobile, customerEmail, customerName, items, subtotal, gst, shipping, total } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Cart items are required to place an order" },
        { status: 400 }
      );
    }

    // Sanitize items array
    const sanitizedItems = items.map((item: any, idx: number) => ({
      id: String(item.id || item.productId || `item-${Date.now()}-${idx}`),
      name: String(item.name || "Jewelry Item"),
      price: Number(item.price) || 0,
      quantity: Math.max(1, Number(item.quantity) || 1),
      image: String(item.image || "/images/products/moon-necklace.jpg"),
    }));

    const calculatedSubtotal = sanitizedItems.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );

    const finalSubtotal = Number(subtotal) > 0 ? Number(subtotal) : calculatedSubtotal;
    const finalGst =
      gst !== undefined && !isNaN(Number(gst))
        ? Number(gst)
        : Number((finalSubtotal * 0.03).toFixed(1));
    const finalShipping =
      shipping !== undefined && !isNaN(Number(shipping))
        ? Number(shipping)
        : 125;
    const finalTotal =
      Number(total) > 0
        ? Number(total)
        : Number((finalSubtotal + finalGst + finalShipping).toFixed(1));

    const emailStr = (customerEmail || "").trim();
    const mobileStr = (customerMobile || "").trim();
    const validMobile = mobileStr || emailStr || (body.orderType === "wholesale" ? "6289417338" : "Retail Customer");
    const orderType =
      body.orderType === "wholesale" || body.storeMode === "wholesale"
        ? "wholesale"
        : "retail";

    const newOrder = createOrder({
      customerMobile: validMobile,
      customerEmail: emailStr || (validMobile.includes("@") ? validMobile : undefined),
      customerName: (customerName || "").trim() || "Customer",
      items: sanitizedItems,
      subtotal: finalSubtotal,
      gst: finalGst,
      shipping: finalShipping,
      total: finalTotal,
      status: "Pending",
      orderType,
    });

    // 4. Send Confirmation Email to Registered Email Address
    let recipientEmail = emailStr || (validMobile.includes("@") ? validMobile : "");
    if (!recipientEmail) {
      try {
        const { getRetailUsers, getWholesaleUsers } = await import("@/lib/db");
        if (orderType === "wholesale") {
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
        console.warn("[Orders API] User email lookup note:", lookupErr);
      }
    }

    if (recipientEmail && recipientEmail.includes("@")) {
      // Fire confirmation email asynchronously
      sendOrderConfirmationEmail({
        orderNumber: newOrder.orderNumber,
        customerName: newOrder.customerName,
        customerEmail: recipientEmail,
        customerMobile: newOrder.customerMobile,
        orderType: newOrder.orderType,
        items: newOrder.items,
        subtotal: newOrder.subtotal,
        gst: newOrder.gst,
        shipping: newOrder.shipping,
        total: newOrder.total,
        createdAt: newOrder.createdAt,
      }).catch((emailErr) => {
        console.error("[Orders API] Background order email failed:", emailErr);
      });
    }

    return NextResponse.json({ success: true, order: newOrder }, { status: 201 });
  } catch (err) {
    console.error("POST /api/orders error:", err);
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : "Failed to create order",
      },
      { status: 500 }
    );
  }
}
