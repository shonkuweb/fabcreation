import { NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/r2";
import sharp from "sharp";

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
    const rawBuffer = Buffer.from(arrayBuffer);

    // Optimize image: resize to max 1200x1200px and compress to webp (quality 80)
    let optimizedBuffer: Buffer;
    let contentType = "image/webp";
    let fileExt = "webp";

    try {
      optimizedBuffer = await sharp(rawBuffer)
        .resize(1200, 1200, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toBuffer();
    } catch (sharpError) {
      console.warn("Sharp compression skipped/failed, using raw buffer:", sharpError);
      optimizedBuffer = rawBuffer;
      contentType = file.type || "image/jpeg";
      fileExt = file.name.split(".").pop() || "jpg";
    }

    // Sanitize base name
    const rawName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
    const cleanBase = rawName.replace(/[^a-zA-Z0-9_-]/g, "_");
    const key = `fab-creations/products/${Date.now()}-${cleanBase}.${fileExt}`;

    const cdnUrl = await uploadToR2(optimizedBuffer, key, contentType);

    return NextResponse.json({ success: true, url: cdnUrl });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to upload image to R2" },
      { status: 500 }
    );
  }
}
