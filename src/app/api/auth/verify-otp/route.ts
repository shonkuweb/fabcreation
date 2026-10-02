import { NextRequest, NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: "Email and OTP code are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const result = verifyOtp(normalizedEmail, otp);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Invalid OTP code." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Email successfully verified!",
    });
  } catch (err) {
    console.error("verify-otp route error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to verify OTP code." },
      { status: 500 }
    );
  }
}
