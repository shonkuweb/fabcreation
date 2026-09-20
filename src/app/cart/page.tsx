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

  const navigateTo = (path: string) => {
    router.push(path);
  };

  return (
    <CartScreen
      userMobile={userMobile}
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
