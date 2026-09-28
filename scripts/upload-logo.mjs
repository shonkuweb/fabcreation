import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "d098e896b8f7dc0403ad3a16f592dfe6";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "989af8ef35b94b6abf46b295af3c50d3";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "a8000cd7a60e056098ec04e0580328bbf21fff4f0da6126075cc3ed05f79ab95";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "chf-media";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://pub-ce8688bc6c654bcfb99716f7c9373bcd.r2.dev";

const client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

async function main() {
  const filePath = path.resolve("./public/images/logo.png");
  const fileBuffer = fs.readFileSync(filePath);
  
  const keys = [
    { key: "fab-creations/logo.png", contentType: "image/png" },
    { key: "fab-creations/logo.jpg", contentType: "image/jpeg" },
    { key: "fab-creations/brand-logo.png", contentType: "image/png" },
    { key: "fab-creations/logo-v2.png", contentType: "image/png" }
  ];

  for (const item of keys) {
    console.log(`Uploading to R2 bucket ${R2_BUCKET_NAME} as ${item.key}...`);
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: item.key,
      Body: fileBuffer,
      ContentType: item.contentType,
      CacheControl: "public, max-age=31536000, immutable",
    });

    await client.send(command);
    console.log(`Successfully uploaded: ${R2_PUBLIC_URL}/${item.key}`);
  }
}

main().catch((err) => {
  console.error("Error uploading to R2:", err);
  process.exit(1);
});
