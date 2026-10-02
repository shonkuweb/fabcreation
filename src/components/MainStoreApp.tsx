"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import HomeScreen from "@/components/HomeScreen";
import ShopScreen from "@/components/ShopScreen";
import CartScreen from "@/components/CartScreen";
import AccountScreen from "@/components/AccountScreen";
import ProductDetailsScreen from "@/components/ProductDetailsScreen";
import WholesaleLoginModal from "@/components/WholesaleLoginModal";
import RetailLoginModal from "@/components/RetailLoginModal";
import NavigationDrawer from "@/components/NavigationDrawer";
import AboutUsModal from "@/components/AboutUsModal";
import CategoriesModal from "@/components/CategoriesModal";
import WholesaleGateScreen from "@/components/WholesaleGateScreen";
import type { Product, Category, OrderItem } from "@/lib/db";
import { type StoreSettings, defaultSettings } from "@/lib/settings";
import { getCartCount, fetchCartFromServer, addToCartByMode } from "@/lib/cart";

interface MainStoreAppProps {
  initialProducts?: Product[];
  initialCategories?: Category[];
  initialTab?: string;
  initialCategory?: string;
  initialProductId?: string;
  initialSettings?: StoreSettings;
}

export default function MainStoreApp({
  initialProducts = [],
  initialCategories = [],
  initialTab = "home",
  initialCategory,
  initialProductId,
  initialSettings,
}: MainStoreAppProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Dynamic store settings (hero banner, about us, offer tags)
  const [settings, setSettings] = useState<StoreSettings>(initialSettings || defaultSettings);

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      })
      .catch(() => {});
  }, []);

  // Store channel mode: "retail" | "wholesale" (defaults to "retail" without login)
  const [storeMode, setStoreMode] = useState<"retail" | "wholesale">(() => {
    const urlMode = searchParams?.get("mode");
    if (urlMode === "wholesale" || urlMode === "retail") return urlMode;
    return "retail";
  });
  const [isWholesaleLoggedIn, setIsWholesaleLoggedIn] = useState(false);
  const [isRetailLoggedIn, setIsRetailLoggedIn] = useState(false);
  const [isWholesaleLoginOpen, setIsWholesaleLoginOpen] = useState(() => {
    return searchParams?.get("login") === "true";
  });
  const [isRetailLoginOpen, setIsRetailLoginOpen] = useState(false);
  const [retailAuthMode, setRetailAuthMode] = useState<"login" | "register">("login");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAboutUsOpen, setIsAboutUsOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);

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

  // Load user details, store mode, and initial cart count from database & storage
  useEffect(() => {
    let currentMode: "retail" | "wholesale" = "retail";
    try {
      const urlMode = searchParams?.get("mode");
      if (urlMode === "wholesale") {
        setStoreMode("wholesale");
        currentMode = "wholesale";
        localStorage.setItem("fc_store_mode", "wholesale");
      } else {
        // Any first visit or direct visit to domain MUST strictly default to retail portal
        setStoreMode("retail");
        currentMode = "retail";
        localStorage.setItem("fc_store_mode", "retail");
      }

      if (searchParams?.get("login") === "true") {
        setIsWholesaleLoginOpen(true);
      }

      const wholesaleAuth = localStorage.getItem("fc_wholesale_logged_in") === "true";
      setIsWholesaleLoggedIn(wholesaleAuth);

      const retailAuth =
        localStorage.getItem("fc_retail_logged_in") === "true" ||
        localStorage.getItem("fc_user_logged_in") === "true";
      setIsRetailLoggedIn(retailAuth);

      const mobile =
        currentMode === "wholesale"
          ? localStorage.getItem("fc_wholesale_mobile")
          : localStorage.getItem("fc_retail_email") ||
            localStorage.getItem("fc_retail_mobile") ||
            localStorage.getItem("fc_user_email") ||
            localStorage.getItem("fc_user_mobile");
      if (mobile) setUserMobile(mobile);

      setCartCount(getCartCount(currentMode));
    } catch {
      // ignore
    }

    // Sync from server database for both modes
    fetchCartFromServer("wholesale").catch(console.error);
    fetchCartFromServer("retail").catch(console.error);

    const handleCartUpdate = (e?: Event) => {
      const detail = (e as CustomEvent)?.detail;
      const targetMode = detail?.mode || storeMode;
      if (targetMode === storeMode || !detail?.mode) {
        setCartCount(getCartCount(storeMode));
      }
    };

    const handleAuthChange = () => {
      try {
        const wholesaleAuth = localStorage.getItem("fc_wholesale_logged_in") === "true";
        setIsWholesaleLoggedIn(wholesaleAuth);

        const retailAuth =
          localStorage.getItem("fc_retail_logged_in") === "true" ||
          localStorage.getItem("fc_user_logged_in") === "true";
        setIsRetailLoggedIn(retailAuth);

        const mobile =
          storeMode === "wholesale"
            ? localStorage.getItem("fc_wholesale_mobile")
            : localStorage.getItem("fc_retail_email") ||
              localStorage.getItem("fc_retail_mobile") ||
              localStorage.getItem("fc_user_email") ||
              localStorage.getItem("fc_user_mobile");
        if (mobile) setUserMobile(mobile);
      } catch {}
    };

    window.addEventListener("cart_updated", handleCartUpdate);
    window.addEventListener("wholesale_auth_changed", handleAuthChange);
    window.addEventListener("retail_auth_changed", handleAuthChange);
    window.addEventListener("storage", handleCartUpdate);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener("cart_updated", handleCartUpdate);
      window.removeEventListener("wholesale_auth_changed", handleAuthChange);
      window.removeEventListener("retail_auth_changed", handleAuthChange);
      window.removeEventListener("storage", handleCartUpdate);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, [storeMode]);

  const handleSwitchStoreMode = (mode: "retail" | "wholesale") => {
    setStoreMode(mode);
    setCartCount(getCartCount(mode));
    try {
      localStorage.setItem("fc_store_mode", mode);
    } catch {}
    if (typeof window !== "undefined") {
      const currentUrl = new URL(window.location.href);
      if (mode === "wholesale") {
        currentUrl.searchParams.set("mode", "wholesale");
      } else {
        currentUrl.searchParams.delete("mode");
      }
      window.history.replaceState(null, "", currentUrl.toString());
    }
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
      if (storeMode === "wholesale") {
        localStorage.removeItem("fc_wholesale_logged_in");
        localStorage.removeItem("fc_wholesale_mobile");
        localStorage.removeItem("fc_wholesale_company");
        window.dispatchEvent(new Event("wholesale_auth_changed"));
        setIsWholesaleLoggedIn(false);
      } else {
        localStorage.removeItem("fc_retail_logged_in");
        localStorage.removeItem("fc_user_logged_in");
        localStorage.removeItem("fc_retail_email");
        localStorage.removeItem("fc_retail_mobile");
        localStorage.removeItem("fc_user_mobile");
        localStorage.removeItem("fc_user_name");
        localStorage.removeItem("fc_user_email");
        window.dispatchEvent(new Event("retail_auth_changed"));
        setIsRetailLoggedIn(false);
      }
    } catch {}
    goToHome();
  };

  const [pendingCartProduct, setPendingCartProduct] = useState<{
    product: Product;
    quantity: number;
  } | null>(null);

  const openRetailLogin = (productToBuy?: Product | null, quantity = 1) => {
    if (productToBuy) {
      setPendingCartProduct({ product: productToBuy, quantity });
    } else {
      setPendingCartProduct(null);
    }
    setRetailAuthMode("login");
    setIsRetailLoginOpen(true);
  };

  const openRetailRegister = (productToBuy?: Product | null, quantity = 1) => {
    if (productToBuy) {
      setPendingCartProduct({ product: productToBuy, quantity });
    } else {
      setPendingCartProduct(null);
    }
    setRetailAuthMode("register");
    setIsRetailLoginOpen(true);
  };

  return (
    <>
      <NavigationDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        storeMode={storeMode}
        onSwitchStoreMode={handleSwitchStoreMode}
        isWholesaleLoggedIn={isWholesaleLoggedIn}
        isRetailLoggedIn={isRetailLoggedIn}
        onOpenWholesaleLogin={() => setIsWholesaleLoginOpen(true)}
        onNavigateHome={goToHome}
        onNavigateShop={goToShop}
        onNavigateCart={goToCart}
        onNavigateAccount={goToAccount}
        onOpenAboutUs={() => setIsAboutUsOpen(true)}
        onOpenCategories={() => setIsCategoriesOpen(true)}
        onSignOut={handleSignOut}
        cartCount={cartCount}
      />

      <WholesaleLoginModal
        isOpen={isWholesaleLoginOpen}
        onClose={() => setIsWholesaleLoginOpen(false)}
        onSuccess={(mob) => {
          setIsWholesaleLoggedIn(true);
          setUserMobile(mob);
        }}
      />

      <RetailLoginModal
        isOpen={isRetailLoginOpen}
        onClose={() => {
          setIsRetailLoginOpen(false);
          setPendingCartProduct(null);
        }}
        initialMode={retailAuthMode}
        onSuccess={(identifier) => {
          setIsRetailLoggedIn(true);
          setIsRetailLoginOpen(false);
          setUserMobile(identifier);
          try {
            window.dispatchEvent(new Event("retail_auth_changed"));
          } catch {}

          if (pendingCartProduct) {
            const { items } = addToCartByMode(
              pendingCartProduct.product,
              "retail",
              pendingCartProduct.quantity
            );
            setCartCount(items.reduce((s: number, i: OrderItem) => s + i.quantity, 0));
            setPendingCartProduct(null);
            // Go to checkout page immediately
            goToCart();
          }
        }}
      />

      <AboutUsModal
        isOpen={isAboutUsOpen}
        onClose={() => setIsAboutUsOpen(false)}
        settings={settings}
      />

      <CategoriesModal
        isOpen={isCategoriesOpen}
        onClose={() => setIsCategoriesOpen(false)}
        categories={initialCategories}
        onSelectCategory={goToShop}
      />

      {/* WHOLESALE ACCESS GATE: If in wholesale mode and not logged in as approved partner */}
      {storeMode === "wholesale" && !isWholesaleLoggedIn ? (
        <WholesaleGateScreen
          onSuccess={(mob) => {
            setIsWholesaleLoggedIn(true);
            if (mob) setUserMobile(mob);
            setCartCount(getCartCount("wholesale"));
          }}
          onReturnToRetail={() => handleSwitchStoreMode("retail")}
        />
      ) : (
        <>
          {tab === "shop" && (
            <ShopScreen
              products={initialProducts}
              categories={initialCategories}
              cartCount={cartCount}
              selectedCategory={selectedCategory}
              storeMode={storeMode}
              settings={settings}
              onSwitchStoreMode={handleSwitchStoreMode}
              isWholesaleLoggedIn={isWholesaleLoggedIn}
              isRetailLoggedIn={isRetailLoggedIn}
              onOpenWholesaleLogin={() => setIsWholesaleLoginOpen(true)}
              onOpenRetailLogin={openRetailLogin}
              onOpenRetailRegister={openRetailRegister}
              onOpenAboutUs={() => setIsAboutUsOpen(true)}
              onNavigateHome={goToHome}
              onNavigateCart={goToCart}
              onNavigateAccount={goToAccount}
              onSelectProduct={goToProduct}
              onSelectCategory={goToShop}
              onSignOut={handleSignOut}
              onOpenMenu={() => setIsMenuOpen(true)}
            />
          )}

          {tab === "cart" && (
            <CartScreen
              userMobile={userMobile}
              categories={initialCategories}
              products={initialProducts}
              storeMode={storeMode}
              onSwitchStoreMode={handleSwitchStoreMode}
              isWholesaleLoggedIn={isWholesaleLoggedIn}
              onOpenWholesaleLogin={() => setIsWholesaleLoginOpen(true)}
              onNavigateHome={goToHome}
              onNavigateShop={goToShop}
              onNavigateAccount={goToAccount}
              onSelectCategory={goToShop}
              onSelectProduct={goToProduct}
              onSignOut={handleSignOut}
            />
          )}

          {tab === "account" && (
            <AccountScreen
              userMobile={userMobile}
              categories={initialCategories}
              cartCount={cartCount}
              storeMode={storeMode}
              onSwitchStoreMode={handleSwitchStoreMode}
              isWholesaleLoggedIn={isWholesaleLoggedIn}
              isRetailLoggedIn={isRetailLoggedIn}
              onOpenWholesaleLogin={() => setIsWholesaleLoginOpen(true)}
              onOpenRetailLogin={openRetailLogin}
              onOpenRetailRegister={openRetailRegister}
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
          isRetailLoggedIn={isRetailLoggedIn}
          onOpenWholesaleLogin={() => setIsWholesaleLoginOpen(true)}
          onOpenRetailLogin={openRetailLogin}
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
          settings={settings}
          onSwitchStoreMode={handleSwitchStoreMode}
          isWholesaleLoggedIn={isWholesaleLoggedIn}
          isRetailLoggedIn={isRetailLoggedIn}
          onOpenWholesaleLogin={() => setIsWholesaleLoginOpen(true)}
          onOpenRetailLogin={openRetailLogin}
          onOpenRetailRegister={openRetailRegister}
          onOpenAboutUs={() => setIsAboutUsOpen(true)}
          onNavigateShop={goToShop}
          onNavigateCart={goToCart}
          onNavigateAccount={goToAccount}
          onSelectProduct={goToProduct}
          onSelectCategory={goToShop}
          onSignOut={handleSignOut}
          onOpenMenu={() => setIsMenuOpen(true)}
        />
      )}
        </>
      )}
    </>
  );
}
