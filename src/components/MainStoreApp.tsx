"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import HomeScreen from "@/components/HomeScreen";
import ShopScreen from "@/components/ShopScreen";
import CartScreen from "@/components/CartScreen";
import AccountScreen from "@/components/AccountScreen";
import ProductDetailsScreen from "@/components/ProductDetailsScreen";
import WholesaleLoginModal from "@/components/WholesaleLoginModal";
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

  // Store channel mode: "retail" | "wholesale" (defaults to "retail" without login)
  const [storeMode, setStoreMode] = useState<"retail" | "wholesale">("retail");
  const [isWholesaleLoggedIn, setIsWholesaleLoggedIn] = useState(false);
  const [isWholesaleLoginOpen, setIsWholesaleLoginOpen] = useState(false);

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

  // Load user details, store mode, and initial cart count from localStorage
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem("fc_store_mode");
      if (savedMode === "wholesale" || savedMode === "retail") {
        setStoreMode(savedMode);
      }

      const isAuth =
        localStorage.getItem("fc_wholesale_logged_in") === "true" ||
        localStorage.getItem("fc_user_logged_in") === "true";
      setIsWholesaleLoggedIn(isAuth);

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

    const handleAuthChange = () => {
      try {
        const isAuth =
          localStorage.getItem("fc_wholesale_logged_in") === "true" ||
          localStorage.getItem("fc_user_logged_in") === "true";
        setIsWholesaleLoggedIn(isAuth);
        const mobile = localStorage.getItem("fc_user_mobile");
        if (mobile) setUserMobile(mobile);
      } catch {}
    };

    window.addEventListener("cart_updated", handleCartUpdate);
    window.addEventListener("wholesale_auth_changed", handleAuthChange);
    window.addEventListener("storage", handleCartUpdate);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener("cart_updated", handleCartUpdate);
      window.removeEventListener("wholesale_auth_changed", handleAuthChange);
      window.removeEventListener("storage", handleCartUpdate);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  const handleSwitchStoreMode = (mode: "retail" | "wholesale") => {
    setStoreMode(mode);
    try {
      localStorage.setItem("fc_store_mode", mode);
    } catch {}
  };

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
      localStorage.removeItem("fc_wholesale_logged_in");
      localStorage.removeItem("fc_user_logged_in");
      window.dispatchEvent(new Event("wholesale_auth_changed"));
    } catch {}
    setIsWholesaleLoggedIn(false);
    setStoreMode("retail");
    goToHome();
  };

  return (
    <>
      <WholesaleLoginModal
        isOpen={isWholesaleLoginOpen}
        onClose={() => setIsWholesaleLoginOpen(false)}
        onSuccess={(mob) => {
          setIsWholesaleLoggedIn(true);
          setUserMobile(mob);
        }}
      />

      {tab === "shop" && (
        <ShopScreen
          products={initialProducts}
          categories={initialCategories}
          cartCount={cartCount}
          selectedCategory={selectedCategory}
          storeMode={storeMode}
          onSwitchStoreMode={handleSwitchStoreMode}
          isWholesaleLoggedIn={isWholesaleLoggedIn}
          onOpenWholesaleLogin={() => setIsWholesaleLoginOpen(true)}
          onNavigateHome={goToHome}
          onNavigateCart={goToCart}
          onNavigateAccount={goToAccount}
          onSelectProduct={goToProduct}
          onSelectCategory={goToShop}
          onSignOut={handleSignOut}
        />
      )}

      {tab === "cart" && (
        <CartScreen
          userMobile={userMobile}
          categories={initialCategories}
          storeMode={storeMode}
          onSwitchStoreMode={handleSwitchStoreMode}
          isWholesaleLoggedIn={isWholesaleLoggedIn}
          onOpenWholesaleLogin={() => setIsWholesaleLoginOpen(true)}
          onNavigateHome={goToHome}
          onNavigateShop={goToShop}
          onNavigateAccount={goToAccount}
          onSelectCategory={goToShop}
          onSignOut={handleSignOut}
        />
      )}

      {tab === "account" && (
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
      )}

      {tab === "product" && (
        <ProductDetailsScreen
          product={selectedProduct}
          allProducts={initialProducts}
          categories={initialCategories}
          cartCount={cartCount}
          storeMode={storeMode}
          onSwitchStoreMode={handleSwitchStoreMode}
          isWholesaleLoggedIn={isWholesaleLoggedIn}
          onOpenWholesaleLogin={() => setIsWholesaleLoginOpen(true)}
          onNavigateHome={goToHome}
          onNavigateShop={goToShop}
          onNavigateCart={goToCart}
          onNavigateAccount={goToAccount}
          onSelectProduct={goToProduct}
          onSelectCategory={goToShop}
          onSignOut={handleSignOut}
          onBack={goBackFromProduct}
        />
      )}

      {tab === "home" && (
        <HomeScreen
          products={initialProducts}
          categories={initialCategories}
          cartCount={cartCount}
          storeMode={storeMode}
          onSwitchStoreMode={handleSwitchStoreMode}
          isWholesaleLoggedIn={isWholesaleLoggedIn}
          onOpenWholesaleLogin={() => setIsWholesaleLoginOpen(true)}
          onNavigateShop={goToShop}
          onNavigateCart={goToCart}
          onNavigateAccount={goToAccount}
          onSelectProduct={goToProduct}
          onSelectCategory={goToShop}
          onSignOut={handleSignOut}
        />
      )}
    </>
  );
}
