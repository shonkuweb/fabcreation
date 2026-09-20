import { NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await req.json();
    if (
      !["Pending", "Confirmed", "Dispatched", "Delivered"].includes(status)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid order status" },
        { status: 400 }
      );
    }

    const updated = updateOrderStatus(params.id, status);
    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, order: updated });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to update order status" },
      { status: 500 }
    );
  }
}
