import { NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/r2";
import sharp from "sharp";
import { isAdminAuthenticated } from "@/lib/adminAuth";

async function processSingleImage(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const rawBuffer = Buffer.from(arrayBuffer);

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

  const rawName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
  const cleanBase = rawName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const rand = Math.random().toString(36).substring(2, 7);
  const key = `fab-creations/products/${Date.now()}-${rand}-${cleanBase}.${fileExt}`;

  return await uploadToR2(optimizedBuffer, key, contentType);
}

export async function POST(req: Request) {
  try {
    if (!isAdminAuthenticated(req)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin session required to upload media." },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    // Support either 'files' (multiple) or 'file' (single or multiple)
    const rawFiles = formData.getAll("files");
    const singleFiles = formData.getAll("file");
    const allFiles = (rawFiles.length > 0 ? rawFiles : singleFiles) as File[];

    if (!allFiles || allFiles.length === 0) {
      return NextResponse.json(
        { success: false, message: "No files uploaded" },
        { status: 400 }
      );
    }

    // Single video file check
    const firstFile = allFiles[0];
    const isVideo =
      firstFile.type.startsWith("video/") ||
      /\.(mp4|webm|mov|m4v)$/i.test(firstFile.name);

    if (isVideo) {
      const arrayBuffer = await firstFile.arrayBuffer();
      const rawBuffer = Buffer.from(arrayBuffer);

      // 15MB size limit for 5-second video loops
      const maxVideoSize = 15 * 1024 * 1024;
      if (rawBuffer.length > maxVideoSize) {
        return NextResponse.json(
          { success: false, message: "Video file is too large. Maximum allowed size is 15MB." },
          { status: 400 }
        );
      }

      const rawExt = firstFile.name.split(".").pop()?.toLowerCase() || "mp4";
      const fileExt = ["mp4", "webm", "mov", "m4v"].includes(rawExt) ? rawExt : "mp4";
      const contentType = firstFile.type || (fileExt === "webm" ? "video/webm" : "video/mp4");

      const rawName = firstFile.name.substring(0, firstFile.name.lastIndexOf(".")) || firstFile.name;
      const cleanBase = rawName.replace(/[^a-zA-Z0-9_-]/g, "_");
      const key = `fab-creations/videos/${Date.now()}-${cleanBase}.${fileExt}`;

      const cdnUrl = await uploadToR2(rawBuffer, key, contentType);

      return NextResponse.json({ success: true, url: cdnUrl, urls: [cdnUrl], isVideo: true });
    }

    // Limit image batch to maximum 4 photos
    const imageFiles = allFiles.slice(0, 4).filter((f) => f && f.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      return NextResponse.json(
        { success: false, message: "Please upload valid image files (JPG, PNG, WebP)" },
        { status: 400 }
      );
    }

    // Process all images concurrently
    const uploadedUrls = await Promise.all(imageFiles.map((file) => processSingleImage(file)));

    return NextResponse.json({
      success: true,
      url: uploadedUrls[0],
      urls: uploadedUrls,
      count: uploadedUrls.length,
      isVideo: false,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to upload media to R2" },
      { status: 500 }
    );
  }
}
