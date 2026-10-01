import { NextRequest, NextResponse } from "next/server";
import {
  updateWholesaleApplicationStatus,
  deleteWholesaleApplication,
} from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status, reason } = body;

    if (!status || !["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Valid status ('pending', 'approved', 'rejected') is required" },
        { status: 400 }
      );
    }

    const updated = updateWholesaleApplicationStatus(id, status, reason);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Wholesale application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      request: updated,
      message: `Application marked as ${status}`,
    });
  } catch (error) {
    console.error("Failed to update wholesale application:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update wholesale application" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const deleted = deleteWholesaleApplication(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Wholesale application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Wholesale application deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete wholesale application:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete wholesale application" },
      { status: 500 }
    );
  }
}
