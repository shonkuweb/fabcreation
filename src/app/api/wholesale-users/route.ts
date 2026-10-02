import { NextRequest, NextResponse } from "next/server";
import {
  getWholesaleUsers,
  getWholesaleUserByMobile,
  getWholesaleUserByEmail,
  createWholesaleUser,
  updateWholesaleUserStatus,
  updateWholesaleUser,
  deleteWholesaleUser,
} from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mobile = searchParams.get("mobile");
    const email = searchParams.get("email");
    const status = searchParams.get("status") as "pending" | "approved" | "rejected" | null;

    if (mobile) {
      const user = getWholesaleUserByMobile(mobile);
      return NextResponse.json({ success: true, user });
    }

    if (email) {
      const user = getWholesaleUserByEmail(email);
      return NextResponse.json({ success: true, user });
    }

    const users = getWholesaleUsers(status || undefined);
    return NextResponse.json({
      success: true,
      users,
      counts: {
        all: getWholesaleUsers().length,
        pending: getWholesaleUsers("pending").length,
        approved: getWholesaleUsers("approved").length,
        rejected: getWholesaleUsers("rejected").length,
      },
    });
  } catch (err) {
    console.error("GET /api/wholesale-users error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch wholesale users" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, businessName, email, mobile, gstin, instagramId } = body;

    if (!mobile || !businessName || !name || !email) {
      return NextResponse.json(
        {
          success: false,
          error: "Full Name, Business Name, Email and Mobile number are required.",
        },
        { status: 400 }
      );
    }

    const cleanMobile = mobile.replace(/\D/g, "");
    if (cleanMobile.length !== 10) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    const user = createWholesaleUser({
      name: name.trim(),
      businessName: businessName.trim(),
      email: email.trim().toLowerCase(),
      mobile: cleanMobile,
      gstin: gstin?.trim(),
      instagramId: instagramId?.trim(),
    });

    return NextResponse.json({
      success: true,
      user,
      message:
        "Wholesale account created successfully! It is pending administrator review.",
    });
  } catch (err) {
    console.error("POST /api/wholesale-users error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create wholesale account" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, rejectionReason, ...rest } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Wholesale User ID is required" },
        { status: 400 }
      );
    }

    let updated = null;
    if (status) {
      updated = updateWholesaleUserStatus(id, status, rejectionReason);
    } else {
      updated = updateWholesaleUser(id, rest);
    }

    return NextResponse.json({ success: !!updated, user: updated });
  } catch (err) {
    console.error("PATCH /api/wholesale-users error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to update wholesale user" },
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
        { success: false, error: "Wholesale User ID is required" },
        { status: 400 }
      );
    }
    const deleted = deleteWholesaleUser(id);
    return NextResponse.json({ success: deleted });
  } catch (err) {
    console.error("DELETE /api/wholesale-users error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete wholesale user" },
      { status: 500 }
    );
  }
}
