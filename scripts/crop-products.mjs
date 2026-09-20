import sharp from "sharp";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

const R2_ACCOUNT_ID = "d098e896b8f7dc0403ad3a16f592dfe6";
const R2_ACCESS_KEY_ID = "989af8ef35b94b6abf46b295af3c50d3";
const R2_SECRET_ACCESS_KEY = "a8000cd7a60e056098ec04e0580328bbf21fff4f0da6126075cc3ed05f79ab95";
const R2_BUCKET_NAME = "chf-media";
const R2_PUBLIC_URL = "https://pub-ce8688bc6c654bcfb99716f7c9373bcd.r2.dev";

const client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

async function main() {
  const screenshotPath = "/Users/shonkuweb/.gemini/antigravity/brain/11c68304-1d30-4114-b6de-7dd5235ee5c7/.user_uploaded/media_1789888612160.jpg";
  const outputDir = path.resolve("./public/images/products");
  fs.mkdirSync(outputDir, { recursive: true });

  // 1. Moon Necklace product image
  // In 535x1024:
  // Card 1 image is roughly: left 18, top 488, width 242, height 204
  const moonPath = path.join(outputDir, "moon-necklace.jpg");
  await sharp(screenshotPath)
    .extract({ left: 16, top: 486, width: 246, height: 206 })
    .jpeg({ quality: 95 })
    .toFile(moonPath);

  // 2. Snake Chain product image
  // Card 2 image is roughly: left 275, top 488, width 242, height 204
  const snakePath = path.join(outputDir, "snake-chain.jpg");
  await sharp(screenshotPath)
    .extract({ left: 273, top: 486, width: 246, height: 206 })
    .jpeg({ quality: 95 })
    .toFile(snakePath);

  console.log("Extracted local product images successfully.");

  // Upload both to R2
  const items = [
    { file: moonPath, key: "fab-creations/products/moon-necklace.jpg" },
    { file: snakePath, key: "fab-creations/products/snake-chain.jpg" },
  ];

  for (const item of items) {
    const fileBuffer = fs.readFileSync(item.file);
    await client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: item.key,
        Body: fileBuffer,
        ContentType: "image/jpeg",
      })
    );
    console.log(`Uploaded ${item.key} -> ${R2_PUBLIC_URL}/${item.key}`);
  }
}

main().catch(console.error);
