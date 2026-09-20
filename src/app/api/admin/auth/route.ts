import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    const adminPassword = process.env.ADMIN_PASSWORD || "admin@fab2026";

    if (password === adminPassword) {
      const response = NextResponse.json({ success: true, message: "Authenticated" });
      // Set an HTTP-only secure cookie for admin session
      response.cookies.set("admin_session", "authenticated", {
        httpOnly: true,
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
  } catch {
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
