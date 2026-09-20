"use client";

import CartScreen from "@/components/CartScreen";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CartPage() {
  const router = useRouter();
  const [userMobile, setUserMobile] = useState("6289417338");

  useEffect(() => {
    try {
      const m = localStorage.getItem("fc_user_mobile");
      if (m) setUserMobile(m);
    } catch {}
  }, []);

  return (
    <CartScreen
      userMobile={userMobile}
      onNavigateHome={() => router.push("/home")}
      onNavigateShop={() => router.push("/shop")}
      onNavigateAccount={() => router.push("/account")}
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
