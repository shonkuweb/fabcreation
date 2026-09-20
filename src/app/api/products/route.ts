import { NextResponse } from "next/server";
import { getProducts, createProduct, createCategory } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const products = getProducts();
    return NextResponse.json(
      { success: true, products },
      {
        headers: {
          "Cache-Control": "public, max-age=10, stale-while-revalidate=59",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      sku,
      price,
      category,
      image,
      stock,
      metal,
      target,
      occasion,
      subtitle,
      featured,
    } = body;

    if (!name || !price) {
      return NextResponse.json(
        { success: false, message: "Name and Price are required" },
        { status: 400 }
      );
    }

    const assignedCategory = category?.trim() || "Chains";
    // Automatically ensure the category exists in the categories collection
    createCategory(assignedCategory);

    const newProduct = createProduct({
      name: name.trim(),
      sku: sku || `${Math.floor(100 + Math.random() * 900)}`,
      price: Number(price),
      category: assignedCategory,
      image: image || "https://pub-ce8688bc6c654bcfb99716f7c9373bcd.r2.dev/fab-creations/products/moon-necklace.jpg",
      stock: Number(stock) || 1,
      metal: metal || "Stainless Steel",
      target: target || "Women",
      occasion: occasion || "Daily Wear",
      rating: 5.0,
      reviewsCount: 0,
      subtitle: subtitle || "Anti tarnish",
      featured: Boolean(featured),
    });

    return NextResponse.json(
      { success: true, product: newProduct },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (err) {
    console.error("POST /api/products error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to create product" },
      { status: 500 }
    );
  }
}
