import { NextResponse } from "next/server";
import { getAdminPassword, setAdminPassword } from "@/lib/db";
import { verifyPassword, hashPassword } from "@/lib/crypto";
import { createAdminSessionToken, isAdminAuthenticated } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authenticated = isAdminAuthenticated(req);
  return NextResponse.json({
    success: authenticated,
    authenticated,
  });
}

export async function POST(req: Request) {
  try {
    const { password } = await req.json();

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, message: "Password is required" },
        { status: 400 }
      );
    }

    const currentStoredPassword = getAdminPassword();
    const isValid = verifyPassword(password, currentStoredPassword);

    if (isValid) {
      // Auto-upgrade legacy plaintext password to secure scrypt hash if not yet hashed
      if (!currentStoredPassword.startsWith("scrypt:")) {
        try {
          const hashed = hashPassword(password.trim());
          setAdminPassword(hashed);
        } catch (upgradeErr) {
          console.warn("[Admin Auth] Password hash auto-upgrade note:", upgradeErr);
        }
      }

      const token = createAdminSessionToken();
      const response = NextResponse.json({
        success: true,
        message: "Authenticated successfully",
      });

      // Set cryptographically signed HTTP-only secure cookie
      response.cookies.set("admin_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: "lax",
      });

      return response;
    }

    return NextResponse.json(
      { success: false, message: "Invalid admin password" },
      { status: 401 }
    );
  } catch (err) {
    console.error("Admin login error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.delete("admin_session");
  return response;
}
