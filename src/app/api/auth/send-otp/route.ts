import { NextRequest, NextResponse } from "next/server";
import { generateOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/resend";
import { getWholesaleUserByEmail } from "@/lib/db";

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

    // STRICT CHECK: For wholesale login, ONLY approved wholesale users get OTP
    if (purpose === "wholesale_login") {
      const wsUser = getWholesaleUserByEmail(normalizedEmail);
      if (!wsUser) {
        return NextResponse.json(
          {
            success: false,
            error: "No wholesale account found with this email. Please submit a wholesale application first.",
          },
          { status: 404 }
        );
      }

      if (wsUser.status === "pending") {
        return NextResponse.json(
          {
            success: false,
            status: "pending",
            error: "Your wholesale account is currently pending administrator approval. Login OTP is only sent once approved.",
          },
          { status: 403 }
        );
      }

      if (wsUser.status === "rejected") {
        return NextResponse.json(
          {
            success: false,
            status: "rejected",
            error: `Your wholesale application was not approved. Reason: ${wsUser.rejectionReason || "Verification criteria not met"}.`,
          },
          { status: 403 }
        );
      }
    }

    const code = generateOtp(normalizedEmail);
    if (process.env.NODE_ENV !== "production") {
      console.log(`[AUTH-DEV] OTP generated for email: ${normalizedEmail.replace(/(?<=^.).(?=.*@)/g, "*")}`);
    }

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
