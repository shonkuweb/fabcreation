"use client";

import HomeScreen from "@/components/HomeScreen";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <HomeScreen
      onNavigateHome={() => window.scrollTo({ top: 0, behavior: "smooth" })}
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
