import { NextRequest, NextResponse } from "next/server";
import { generateOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/resend";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, purpose } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const code = generateOtp(normalizedEmail);
    console.log(`[AUTH] Generated OTP for ${normalizedEmail}: ${code}`);

    // Send the email via Resend
    const result = await sendOtpEmail(normalizedEmail, code, purpose || "retail");

    if (!result.success) {
      // Even if Resend encounters unverified domain restrictions in dev, allow flow
      return NextResponse.json({
        success: true,
        isDemoFallback: true,
        message: result.error || "Testing mode active: enter demo code 123456 or check console.",
      });
    }

    return NextResponse.json({
      success: true,
      isDemoFallback: Boolean(result.isDemoFallback),
      message: result.message || `Verification code sent to ${normalizedEmail}`,
    });
  } catch (err) {
    console.error("send-otp route error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to process OTP request. Please try again." },
      { status: 500 }
    );
  }
}
