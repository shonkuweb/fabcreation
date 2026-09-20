import { NextResponse } from "next/server";
import { getOrders, createOrder } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const orders = getOrders();
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
    const { customerMobile, items, subtotal, gst, shipping, total } = body;

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

    const validMobile = (customerMobile || "").trim() || "6289417338";

    const newOrder = createOrder({
      customerMobile: validMobile,
      items: sanitizedItems,
      subtotal: finalSubtotal,
      gst: finalGst,
      shipping: finalShipping,
      total: finalTotal,
      status: "Pending",
    });

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
