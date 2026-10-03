import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const rawSettings = getSettings();
    const { adminPassword: _pw, ...safeSettings } = rawSettings as any;
    return NextResponse.json(
      { success: true, settings: safeSettings },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (err) {
    console.error("GET /api/settings error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to load store settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    if (!isAdminAuthenticated(req)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin session required." },
        { status: 401 }
      );
    }

    const body = await req.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, message: "Invalid settings payload" },
        { status: 400 }
      );
    }

    // Never allow updating adminPassword through general settings endpoint
    const { adminPassword: _disallowed, ...safeUpdates } = body;

    const updated = updateSettings(safeUpdates);
    const { adminPassword: _pw, ...safeResponse } = updated as any;

    return NextResponse.json({
      success: true,
      settings: safeResponse,
      message: "Store settings saved successfully",
    });
  } catch (err) {
    console.error("PUT /api/settings error:", err);
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : "Failed to update settings",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  return PUT(req);
}
