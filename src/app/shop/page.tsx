import React, { Suspense } from "react";
import ShopScreen from "@/components/ShopScreen";
import { getProducts, getCategories } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function ShopPage({
  searchParams,
}: {
  searchParams?: { cat?: string };
}) {
  const products = getProducts();
  const categories = getCategories();
  const initialCategory = searchParams?.cat || null;

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
      <ShopScreen
        products={products}
        categories={categories}
        selectedCategory={initialCategory}
      />
    </Suspense>
  );
}
