"use client";

import ProductDetailsScreen from "@/components/ProductDetailsScreen";
import { useRouter } from "next/navigation";

export default function ProductPage() {
  const router = useRouter();

  return (
    <ProductDetailsScreen
      onNavigateHome={() => router.push("/home")}
      onNavigateShop={() => router.push("/shop")}
      onNavigateCart={() => router.push("/cart")}
      onNavigateAccount={() => router.push("/account")}
      onSelectProduct={(p) => router.push(`/product?id=${p.id}`)}
      onSelectCategory={(catName) => router.push(`/shop?cat=${encodeURIComponent(catName || "")}`)}
      onSignOut={() => {
        try {
          localStorage.removeItem("fc_user_logged_in");
        } catch {}
        router.push("/");
      }}
    />
  );
}
