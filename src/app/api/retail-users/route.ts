import { NextRequest, NextResponse } from "next/server";
import { getRetailUsers, getRetailUserByEmail, upsertRetailUser, deleteRetailUser } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (email) {
      const user = getRetailUserByEmail(email);
      return NextResponse.json({ success: true, user });
    }

    const users = getRetailUsers();
    return NextResponse.json({ success: true, users, count: users.length });
  } catch (err) {
    console.error("GET /api/retail-users error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch retail users" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || body.mobile || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required for retail user account" },
        { status: 400 }
      );
    }

    const user = upsertRetailUser({
      name: body.name || "Retail Customer",
      email,
      mobile: body.mobile || "",
      addresses: Array.isArray(body.addresses) ? body.addresses : undefined,
    });

    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error("POST /api/retail-users error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to save retail user account" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }
    const deleted = deleteRetailUser(id);
    return NextResponse.json({ success: deleted });
  } catch (err) {
    console.error("DELETE /api/retail-users error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to delete retail user" },
      { status: 500 }
    );
  }
}
