import { NextResponse } from "next/server";
import { getUserAccount, upsertUserAccount, getUserAccounts } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as "wholesale" | "retail" | null;
    const mobile = searchParams.get("mobile");

    if (mobile && type) {
      const user = getUserAccount(type, mobile);
      return NextResponse.json({ success: true, user });
    }

    const users = getUserAccounts(type || undefined);
    return NextResponse.json({ success: true, users });
  } catch (err) {
    console.error("GET /api/users error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch user accounts" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const type = (body.type === "wholesale" ? "wholesale" : "retail") as "wholesale" | "retail";
    const mobile = (body.mobile || "").trim();

    if (!mobile) {
      return NextResponse.json(
        { success: false, message: "Mobile number is required" },
        { status: 400 }
      );
    }

    const updated = upsertUserAccount(type, mobile, {
      name: body.name,
      email: body.email,
      companyName: body.companyName,
      gstin: body.gstin,
      addresses: Array.isArray(body.addresses) ? body.addresses : undefined,
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err) {
    console.error("POST /api/users error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to save user account" },
      { status: 500 }
    );
  }
}
