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

  const navigateTo = (path: string) => {
    router.push(path);
  };

  return (
    <AccountScreen
      userMobile={userMobile}
      onNavigateHome={() => navigateTo("/home")}
      onNavigateShop={() => navigateTo("/shop")}
      onNavigateCart={() => navigateTo("/cart")}
      onSelectProduct={(p) => navigateTo(`/product?id=${p.id}`)}
      onSelectCategory={(catName) => navigateTo(catName ? `/shop?cat=${encodeURIComponent(catName)}` : "/shop")}
      onSignOut={() => {
        try {
          localStorage.removeItem("fc_user_logged_in");
        } catch {}
        navigateTo("/");
      }}
    />
  );
}
