import { NextResponse } from "next/server";
import { getDbWishlist, saveDbWishlist } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = (searchParams.get("type") === "wholesale" ? "wholesale" : "retail") as "wholesale" | "retail";
    const user = searchParams.get("user") || "guest";

    const productIds = getDbWishlist(type, user);
    return NextResponse.json({ success: true, productIds });
  } catch (err) {
    console.error("GET /api/wishlist error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch wishlist" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const type = (body.type === "wholesale" ? "wholesale" : "retail") as "wholesale" | "retail";
    const user = body.user || "guest";
    const productIds = Array.isArray(body.productIds) ? body.productIds : [];

    const saved = saveDbWishlist(type, user, productIds);
    return NextResponse.json({ success: true, wishlist: saved });
  } catch (err) {
    console.error("POST /api/wishlist error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to save wishlist" },
      { status: 500 }
    );
  }
}
