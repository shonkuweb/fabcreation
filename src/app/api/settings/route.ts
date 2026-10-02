import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const settings = getSettings();
    return NextResponse.json(
      { success: true, settings },
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
    const body = await req.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, message: "Invalid settings payload" },
        { status: 400 }
      );
    }

    const updated = updateSettings(body);
    return NextResponse.json({
      success: true,
      settings: updated,
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
