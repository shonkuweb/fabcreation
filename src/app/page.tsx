import React, { Suspense } from "react";
import MainStoreApp from "@/components/MainStoreApp";
import { getProducts, getCategories, getSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function RootStorePage({
  searchParams,
}: {
  searchParams?: { tab?: string; cat?: string; id?: string };
}) {
  const products = getProducts();
  const categories = getCategories();
  const settings = getSettings();

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
      <MainStoreApp
        initialProducts={products}
        initialCategories={categories}
        initialSettings={settings}
        initialTab={searchParams?.tab}
        initialCategory={searchParams?.cat}
        initialProductId={searchParams?.id}
      />
    </Suspense>
  );
}
