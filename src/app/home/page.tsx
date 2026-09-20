import React, { Suspense } from "react";
import MainStoreApp from "@/components/MainStoreApp";
import { getProducts, getCategories } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function HomePage({
  searchParams,
}: {
  searchParams?: { tab?: string; cat?: string; id?: string };
}) {
  const products = getProducts();
  const categories = getCategories();

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
      <MainStoreApp
        initialProducts={products}
        initialCategories={categories}
        initialTab={searchParams?.tab}
        initialCategory={searchParams?.cat}
        initialProductId={searchParams?.id}
      />
    </Suspense>
  );
}
