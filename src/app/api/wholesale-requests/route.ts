import { NextRequest, NextResponse } from "next/server";
import {
  getWholesaleApplications,
  getWholesaleApplicationByMobile,
  createWholesaleApplication,
} from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mobile = searchParams.get("mobile");
    const status = searchParams.get("status") as "pending" | "approved" | "rejected" | null;

    if (mobile) {
      const app = getWholesaleApplicationByMobile(mobile);
      return NextResponse.json({
        success: true,
        request: app ? {
          id: app.id,
          businessName: app.businessName,
          status: app.status,
          rejectionReason: app.rejectionReason,
        } : null,
        isApproved: app?.status === "approved",
        isPending: app?.status === "pending",
        isRejected: app?.status === "rejected",
      });
    }

    // Listing all wholesale requests requires admin authentication
    if (!isAdminAuthenticated(request)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin session required." },
        { status: 401 }
      );
    }

    const requests = getWholesaleApplications(status || undefined);
    return NextResponse.json({
      success: true,
      requests,
      counts: {
        all: getWholesaleApplications().length,
        pending: getWholesaleApplications("pending").length,
        approved: getWholesaleApplications("approved").length,
        rejected: getWholesaleApplications("rejected").length,
      },
    });
  } catch (error) {
    console.error("Failed to fetch wholesale applications:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch wholesale applications" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, businessName, email, instagramId, mobile } = body;

    if (!name || !businessName || !email || !mobile) {
      return NextResponse.json(
        {
          success: false,
          error: "Full Name, Business Name, Email, and Phone Number are required",
        },
        { status: 400 }
      );
    }

    const cleanMobile = String(mobile).replace(/\D/g, "");
    if (cleanMobile.length !== 10) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid 10-digit mobile number" },
        { status: 400 }
      );
    }

    const application = createWholesaleApplication({
      name: String(name).trim(),
      businessName: String(businessName).trim(),
      email: String(email).trim(),
      instagramId: instagramId ? String(instagramId).trim() : "",
      mobile: cleanMobile,
    });

    return NextResponse.json({
      success: true,
      request: application,
      message:
        "Wholesale account request submitted successfully. Our admin team will review and approve your application.",
    });
  } catch (error) {
    console.error("Failed to submit wholesale application:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit wholesale application" },
      { status: 500 }
    );
  }
}
