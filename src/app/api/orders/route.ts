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

    if (!customerMobile || !items || !items.length) {
      return NextResponse.json(
        { success: false, message: "Customer mobile and items are required" },
        { status: 400 }
      );
    }

    const newOrder = createOrder({
      customerMobile,
      items,
      subtotal: Number(subtotal) || 0,
      gst: Number(gst) || 0,
      shipping: Number(shipping) || 125,
      total: Number(total) || 0,
      status: "Pending",
    });

    return NextResponse.json({ success: true, order: newOrder }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to create order" },
      { status: 500 }
    );
  }
}
