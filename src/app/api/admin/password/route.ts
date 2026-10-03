import { NextResponse } from "next/server";
import { getAdminPassword, setAdminPassword } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  try {
    const { currentPassword, newPassword, confirmPassword } = await req.json();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, message: "Please fill in all password fields" },
        { status: 400 }
      );
    }

    const currentActual = getAdminPassword();
    if (currentPassword !== currentActual) {
      return NextResponse.json(
        { success: false, message: "Current password is incorrect" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: "New password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: "New password and confirmation do not match" },
        { status: 400 }
      );
    }

    setAdminPassword(newPassword.trim());

    return NextResponse.json({
      success: true,
      message: "Admin password successfully changed! Use your new password next time you log in.",
    });
  } catch (err) {
    console.error("PUT /api/admin/password error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to update admin password" },
      { status: 500 }
    );
  }
}
