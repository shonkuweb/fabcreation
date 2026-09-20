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

    const validMobile = (customerMobile || "").trim() || "6289417338";

    const newOrder = createOrder({
      customerMobile: validMobile,
      items,
      subtotal: Number(subtotal) || 0,
      gst: Number(gst) || 0,
      shipping: Number(shipping) || 125,
      total: Number(total) || 0,
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
