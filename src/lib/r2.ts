import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "d098e896b8f7dc0403ad3a16f592dfe6";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "989af8ef35b94b6abf46b295af3c50d3";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "a8000cd7a60e056098ec04e0580328bbf21fff4f0da6126075cc3ed05f79ab95";
export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "chf-media";
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://pub-ce8688bc6c654bcfb99716f7c9373bcd.r2.dev";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export async function uploadToR2(
  fileBuffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  });

  await r2Client.send(command);
  return `${R2_PUBLIC_URL}/${key}`;
}

export function getR2PublicUrl(key: string): string {
  return `${R2_PUBLIC_URL}/${key}`;
}
