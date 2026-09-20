"use client";

import AccountScreen from "@/components/AccountScreen";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AccountPage() {
  const router = useRouter();
  const [userMobile, setUserMobile] = useState("6289417338");

  useEffect(() => {
    try {
      const m = localStorage.getItem("fc_user_mobile");
      if (m) setUserMobile(m);
    } catch {}
  }, []);

  return (
    <AccountScreen
      userMobile={userMobile}
      onNavigateHome={() => router.push("/home")}
      onNavigateShop={() => router.push("/shop")}
      onNavigateCart={() => router.push("/cart")}
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
