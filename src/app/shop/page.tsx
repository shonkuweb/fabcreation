"use client";

import React, { Suspense } from "react";
import ShopScreen from "@/components/ShopScreen";
import { useRouter, useSearchParams } from "next/navigation";

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("cat");

  return (
    <ShopScreen
      selectedCategory={initialCategory}
      onNavigateHome={() => router.push("/home")}
      onNavigateCart={() => router.push("/cart")}
      onNavigateAccount={() => router.push("/account")}
      onSelectProduct={(p) => router.push(`/product?id=${p.id}`)}
      onSelectCategory={(catName) => {
        if (catName) {
          router.replace(`/shop?cat=${encodeURIComponent(catName)}`);
        } else {
          router.replace("/shop");
        }
      }}
      onSignOut={() => {
        try {
          localStorage.removeItem("fc_user_logged_in");
        } catch {}
        router.push("/");
      }}
    />
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
      <ShopContent />
    </Suspense>
  );
}
