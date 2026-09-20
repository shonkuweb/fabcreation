import { NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/r2";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file uploaded" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Sanitize filename and create R2 key
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `fab-creations/products/${Date.now()}-${cleanName}`;

    const cdnUrl = await uploadToR2(buffer, key, file.type || "image/jpeg");

    return NextResponse.json({ success: true, url: cdnUrl });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to upload image to R2" },
      { status: 500 }
    );
  }
}
