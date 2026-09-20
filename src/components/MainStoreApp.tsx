"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import HomeScreen from "@/components/HomeScreen";
import ShopScreen from "@/components/ShopScreen";
import CartScreen from "@/components/CartScreen";
import AccountScreen from "@/components/AccountScreen";
import ProductDetailsScreen from "@/components/ProductDetailsScreen";
import type { Product, Category, OrderItem } from "@/lib/db";

interface MainStoreAppProps {
  initialProducts?: Product[];
  initialCategories?: Category[];
  initialTab?: string;
  initialCategory?: string;
  initialProductId?: string;
}

export default function MainStoreApp({
  initialProducts = [],
  initialCategories = [],
  initialTab = "home",
  initialCategory,
  initialProductId,
}: MainStoreAppProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Resolve initial tab from prop or URL
  const [tab, setTab] = useState<"home" | "shop" | "cart" | "account" | "product">(() => {
    const paramTab = searchParams?.get("tab") || initialTab;
    if (paramTab === "shop") return "shop";
    if (paramTab === "cart") return "cart";
    if (paramTab === "account") return "account";
    if (paramTab === "product" || initialProductId) return "product";
    return "home";
  });

  const [selectedCategory, setSelectedCategory] = useState<string | null>(() => {
    return searchParams?.get("cat") || initialCategory || null;
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(() => {
    const targetId = searchParams?.get("id") || initialProductId;
    if (targetId && initialProducts.length > 0) {
      return initialProducts.find((p) => p.id === targetId) || initialProducts[0] || null;
    }
    return initialProducts[0] || null;
  });

  const [previousTab, setPreviousTab] = useState<"home" | "shop">("home");
  const [userMobile, setUserMobile] = useState("6289417338");
  const [cartCount, setCartCount] = useState(0);

  // Load user details and initial cart count from localStorage
  useEffect(() => {
    try {
      const mobile = localStorage.getItem("fc_user_mobile");
      if (mobile) setUserMobile(mobile);

      const savedCart = localStorage.getItem("fc_b2b_cart");
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          setCartCount(parsed.reduce((sum: number, i: any) => sum + (Number(i.quantity) || 1), 0));
        }
      }
    } catch {
      // ignore
    }

    const handleCartUpdate = () => {
      try {
        const saved = localStorage.getItem("fc_b2b_cart");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setCartCount(parsed.reduce((sum: number, i: any) => sum + (Number(i.quantity) || 1), 0));
          }
        } else {
          setCartCount(0);
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener("cart_updated", handleCartUpdate);
    window.addEventListener("storage", handleCartUpdate);

    return () => {
      window.removeEventListener("cart_updated", handleCartUpdate);
      window.removeEventListener("storage", handleCartUpdate);
    };
  }, []);

  // Sync tab with URL back/forward navigation
  useEffect(() => {
    const currentTabParam = searchParams?.get("tab");
    const currentId = searchParams?.get("id");
    const currentCat = searchParams?.get("cat");

    if (currentId) {
      const found = initialProducts.find((p) => p.id === currentId);
      if (found) setSelectedProduct(found);
      setTab("product");
    } else if (currentTabParam === "shop") {
      setTab("shop");
      if (currentCat) setSelectedCategory(currentCat);
    } else if (currentTabParam === "cart") {
      setTab("cart");
    } else if (currentTabParam === "account") {
      setTab("account");
    } else if (currentTabParam === "home" || !currentTabParam) {
      setTab("home");
    }
  }, [searchParams, initialProducts]);

  // Seamless in-place tab navigation handlers
  const goToHome = () => {
    startTransition(() => {
      setTab("home");
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", "/home");
      }
    });
  };

  const goToShop = (catName?: string | null) => {
    startTransition(() => {
      const category = catName !== undefined ? catName : null;
      setSelectedCategory(category);
      setTab("shop");
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (typeof window !== "undefined") {
        const url = category ? `/home?tab=shop&cat=${encodeURIComponent(category)}` : "/home?tab=shop";
        window.history.replaceState(null, "", url);
      }
    });
  };

  const goToCart = () => {
    startTransition(() => {
      setTab("cart");
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", "/home?tab=cart");
      }
    });
  };

  const goToAccount = () => {
    startTransition(() => {
      setTab("account");
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", "/home?tab=account");
      }
    });
  };

  const goToProduct = (product: Product) => {
    startTransition(() => {
      if (tab === "home" || tab === "shop") {
        setPreviousTab(tab);
      }
      setSelectedProduct(product);
      setTab("product");
      window.scrollTo({ top: 0, behavior: "smooth" });
      try {
        localStorage.setItem("fc_selected_product", JSON.stringify(product));
      } catch {}
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", `/home?tab=product&id=${product.id}`);
      }
    });
  };

  const goBackFromProduct = () => {
    if (previousTab === "shop") {
      goToShop(selectedCategory);
    } else {
      goToHome();
    }
  };

  const handleSignOut = () => {
    try {
      localStorage.removeItem("fc_user_logged_in");
    } catch {}
    router.push("/");
  };

  // Render the active view smoothly within /home
  if (tab === "shop") {
    return (
      <ShopScreen
        products={initialProducts}
        categories={initialCategories}
        cartCount={cartCount}
        selectedCategory={selectedCategory}
        onNavigateHome={goToHome}
        onNavigateCart={goToCart}
        onNavigateAccount={goToAccount}
        onSelectProduct={goToProduct}
        onSelectCategory={goToShop}
        onSignOut={handleSignOut}
      />
    );
  }

  if (tab === "cart") {
    return (
      <CartScreen
        userMobile={userMobile}
        categories={initialCategories}
        onNavigateHome={goToHome}
        onNavigateShop={goToShop}
        onNavigateAccount={goToAccount}
        onSelectCategory={goToShop}
        onSignOut={handleSignOut}
      />
    );
  }

  if (tab === "account") {
    return (
      <AccountScreen
        userMobile={userMobile}
        categories={initialCategories}
        cartCount={cartCount}
        onNavigateHome={goToHome}
        onNavigateShop={goToShop}
        onNavigateCart={goToCart}
        onSelectProduct={goToProduct}
        onSelectCategory={goToShop}
        onSignOut={handleSignOut}
      />
    );
  }

  if (tab === "product") {
    return (
      <ProductDetailsScreen
        product={selectedProduct}
        allProducts={initialProducts}
        categories={initialCategories}
        cartCount={cartCount}
        onNavigateHome={goToHome}
        onNavigateShop={goToShop}
        onNavigateCart={goToCart}
        onNavigateAccount={goToAccount}
        onSelectProduct={goToProduct}
        onSelectCategory={goToShop}
        onSignOut={handleSignOut}
        onBack={goBackFromProduct}
      />
    );
  }

  // Default: Home View
  return (
    <HomeScreen
      products={initialProducts}
      categories={initialCategories}
      cartCount={cartCount}
      onNavigateShop={goToShop}
      onNavigateCart={goToCart}
      onNavigateAccount={goToAccount}
      onSelectProduct={goToProduct}
      onSelectCategory={goToShop}
      onSignOut={handleSignOut}
    />
  );
}
