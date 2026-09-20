import React, { Suspense } from "react";
import ProductDetailsScreen from "@/components/ProductDetailsScreen";
import { getProducts, getCategories } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function ProductPage({
  searchParams,
}: {
  searchParams?: { id?: string };
}) {
  const allProducts = getProducts();
  const categories = getCategories();
  const product = searchParams?.id
    ? allProducts.find((p) => p.id === searchParams.id) || null
    : allProducts[0] || null;

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
      <ProductDetailsScreen
        product={product}
        allProducts={allProducts}
        categories={categories}
      />
    </Suspense>
  );
}
