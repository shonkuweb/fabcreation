import { NextResponse } from "next/server";
import { getDbCart, saveDbCart, clearDbCart } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = (searchParams.get("type") === "wholesale" ? "wholesale" : "retail") as "wholesale" | "retail";
    const user = searchParams.get("user") || "guest";

    const items = getDbCart(type, user);
    return NextResponse.json({ success: true, items });
  } catch (err) {
    console.error("GET /api/cart error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const type = (body.type === "wholesale" ? "wholesale" : "retail") as "wholesale" | "retail";
    const user = body.user || "guest";
    const items = Array.isArray(body.items) ? body.items : [];

    const saved = saveDbCart(type, user, items);
    return NextResponse.json({ success: true, cart: saved });
  } catch (err) {
    console.error("POST /api/cart error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to save cart" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = (searchParams.get("type") === "wholesale" ? "wholesale" : "retail") as "wholesale" | "retail";
    const user = searchParams.get("user") || "guest";

    clearDbCart(type, user);
    return NextResponse.json({ success: true, message: "Cart cleared" });
  } catch (err) {
    console.error("DELETE /api/cart error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to clear cart" },
      { status: 500 }
    );
  }
}
