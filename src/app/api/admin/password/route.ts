import { NextResponse } from "next/server";
import { getAdminPassword, setAdminPassword } from "@/lib/db";
import { verifyPassword, hashPassword } from "@/lib/crypto";
import { isAdminAuthenticated, createAdminSessionToken } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  try {
    if (!isAdminAuthenticated(req)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin session required." },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword, confirmPassword } = await req.json();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, message: "Please fill in all password fields" },
        { status: 400 }
      );
    }

    const currentActual = getAdminPassword();
    if (!verifyPassword(currentPassword, currentActual)) {
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

    const hashedPassword = hashPassword(newPassword.trim());
    setAdminPassword(hashedPassword);

    // Refresh admin session cookie with newly generated token
    const token = createAdminSessionToken();
    const response = NextResponse.json({
      success: true,
      message: "Admin password successfully changed! Use your new password next time you log in.",
    });

    response.cookies.set("admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });

    return response;
  } catch (err) {
    console.error("PUT /api/admin/password error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to update admin password" },
      { status: 500 }
    );
  }
}
