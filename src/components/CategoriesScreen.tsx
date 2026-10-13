"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Grid,
  LayoutGrid,
  Search,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShoppingBag,
  ShoppingCart,
  Home,
  User,
  X,
  ChevronRight,
  Layers,
} from "lucide-react";
import type { Product, Category } from "@/lib/db";
import { type StoreSettings, defaultSettings } from "@/lib/settings";
import { getCartCount, getWishlistItems } from "@/lib/cart";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface CategoriesScreenProps {
  products?: Product[];
  categories?: Category[];
  cartCount?: number;
  wishlist?: string[];
  storeMode?: "retail" | "wholesale";
  onSwitchStoreMode?: (mode: "retail" | "wholesale") => void;
  isWholesaleLoggedIn?: boolean;
  isRetailLoggedIn?: boolean;
  onOpenWholesaleLogin?: () => void;
  onOpenRetailLogin?: (product?: Product | null) => void;
  onOpenRetailRegister?: (product?: Product | null) => void;
  onOpenAboutUs?: () => void;
  onNavigateHome?: () => void;
  onNavigateShop?: (category?: string | null) => void;
  onNavigateCart?: () => void;
  onNavigateAccount?: () => void;
  onNavigateCategories?: () => void;
  onSelectProduct?: (product: Product) => void;
  onSelectCategory?: (category: string | null) => void;
  onSignOut?: () => void;
  onOpenMenu?: () => void;
  settings?: Partial<StoreSettings>;
}

export default function CategoriesScreen({
  products: initialProducts = [],
  categories: initialCategories = [],
  cartCount: initialCartCount = 0,
  wishlist: initialWishlist = [],
  storeMode = "retail",
  onSwitchStoreMode,
  isWholesaleLoggedIn = false,
  isRetailLoggedIn = false,
  onOpenWholesaleLogin,
  onOpenRetailLogin,
  onOpenRetailRegister,
  onOpenAboutUs,
  onNavigateHome,
  onNavigateShop,
  onNavigateCart,
  onNavigateAccount,
  onNavigateCategories,
  onSelectProduct,
  onSelectCategory,
  onSignOut,
  onOpenMenu,
  settings,
}: CategoriesScreenProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [cartCount, setCartCount] = useState<number>(initialCartCount);
  const [wishlist, setWishlist] = useState<string[]>(initialWishlist);
  const [searchQuery, setSearchQuery] = useState("");

  // Sync props if provided
  useEffect(() => {
    if (initialProducts.length > 0) {
      setProducts(initialProducts);
    }
  }, [initialProducts]);

  useEffect(() => {
    if (initialCategories.length > 0) {
      setCategories(initialCategories);
    }
  }, [initialCategories]);

  useEffect(() => {
    if (initialCartCount > 0) setCartCount(initialCartCount);
  }, [initialCartCount]);

  useEffect(() => {
    if (initialWishlist.length > 0) setWishlist(initialWishlist);
  }, [initialWishlist]);

  // SWR hydration and background revalidation
  useEffect(() => {
    try {
      if (!initialCategories.length) {
        const cachedCats = localStorage.getItem("fc_cached_categories");
        if (cachedCats) {
          const parsed = JSON.parse(cachedCats);
          if (Array.isArray(parsed) && parsed.length > 0) setCategories(parsed);
        }
      }
      if (!initialProducts.length) {
        const cachedProds = localStorage.getItem("fc_cached_products");
        if (cachedProds) {
          const parsed = JSON.parse(cachedProds);
          if (Array.isArray(parsed) && parsed.length > 0) setProducts(parsed);
        }
      }
    } catch {}

    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.categories)) {
          setCategories(d.categories);
          try {
            localStorage.setItem("fc_cached_categories", JSON.stringify(d.categories));
          } catch {}
        }
      })
      .catch(() => {});

    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.products)) {
          setProducts(d.products);
          try {
            localStorage.setItem("fc_cached_products", JSON.stringify(d.products));
          } catch {}
        }
      })
      .catch(() => {});

    setCartCount(getCartCount(storeMode));
    setWishlist(getWishlistItems(storeMode));
  }, [storeMode, initialCategories.length, initialProducts.length]);

  // Clean, unique categories listed from the admin panel / database
  const validCategories = useMemo(() => {
    if (!Array.isArray(categories) || categories.length === 0) return [];
    const list: Array<{ id: string; name: string; image?: string }> = [];
    categories.forEach((c) => {
      if (
        c &&
        c.name &&
        c.name.trim() &&
        c.name.toLowerCase() !== "test" &&
        !list.some((item) => item.name.toLowerCase() === c.name.trim().toLowerCase())
      ) {
        list.push({
          id: c.id,
          name: c.name.trim(),
          image: c.image || "",
        });
      }
    });
    return list;
  }, [categories]);

  // Filter categories by search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return validCategories;
    const q = searchQuery.toLowerCase().trim();
    return validCategories.filter((c) => c.name.toLowerCase().includes(q));
  }, [validCategories, searchQuery]);

  // Total available products relevant to current channel
  const totalChannelProductsCount = useMemo(() => {
    return products.filter((p) => {
      if (storeMode === "wholesale") {
        return p.channel === "wholesale" || p.channel === "both" || !p.channel;
      }
      return p.channel === "retail" || p.channel === "both" || !p.channel;
    }).length;
  }, [products, storeMode]);

  // Helper to count products in a given category for current channel
  const getProductCountForCategory = (categoryName: string) => {
    return products.filter((p) => {
      const matchesCategory =
        p.category && p.category.trim().toLowerCase() === categoryName.trim().toLowerCase();
      if (!matchesCategory) return false;
      if (storeMode === "wholesale") {
        return p.channel === "wholesale" || p.channel === "both" || !p.channel;
      }
      return p.channel === "retail" || p.channel === "both" || !p.channel;
    }).length;
  };

  // Find representative image for category
  const getCategoryThumbnail = (catItem: { id: string; name: string; image?: string }) => {
    if (catItem.image && catItem.image.trim()) return catItem.image;
    const prod = products.find(
      (p) =>
        p.category &&
        p.category.trim().toLowerCase() === catItem.name.trim().toLowerCase() &&
        p.image
    );
    return prod?.image || "";
  };

  // Selection handler: navigates directly to Shop with the category filter applied
  const handleSelectCategory = (catName: string | null) => {
    if (onSelectCategory) {
      onSelectCategory(catName);
    }
    if (onNavigateShop) {
      onNavigateShop(catName);
    } else {
      router.push(catName ? `/shop?cat=${encodeURIComponent(catName)}` : "/shop");
    }
  };

  const navigateToHome = () => {
    if (onNavigateHome) onNavigateHome();
    else router.push("/home");
  };

  const navigateToShop = (cat?: string | null) => {
    if (onNavigateShop) onNavigateShop(cat);
    else router.push(cat ? `/shop?cat=${encodeURIComponent(cat)}` : "/shop");
  };

  const navigateToCart = () => {
    if (onNavigateCart) onNavigateCart();
    else router.push("/cart");
  };

  const navigateToAccount = () => {
    if (onNavigateAccount) onNavigateAccount();
    else router.push("/account");
  };

  return (
    <div className="relative min-h-screen w-full bg-[#050505] text-white flex flex-col items-center justify-start pb-28 select-none">
      {/* Unified Luxury Header */}
      <Header
        storeMode={storeMode}
        onSwitchStoreMode={(mode) => onSwitchStoreMode?.(mode)}
        isWholesaleLoggedIn={isWholesaleLoggedIn}
        onOpenWholesaleLogin={onOpenWholesaleLogin}
        onOpenRetailLogin={onOpenRetailLogin}
        onOpenRetailRegister={onOpenRetailRegister}
        cartCount={cartCount}
        wishlistCount={wishlist.length}
        onNavigateHome={navigateToHome}
        onNavigateShop={(cat) => handleSelectCategory(cat || null)}
        onNavigateCart={navigateToCart}
        onNavigateAccount={navigateToAccount}
        onOpenAboutUs={onOpenAboutUs}
        onOpenMenu={onOpenMenu}
        activeCategory={null}
        onSelectCategory={(cat) => handleSelectCategory(cat || null)}
        categories={categories}
        currentTab="categories"
        navbarRetailOffer={settings?.navbarRetailOffer}
        navbarWholesaleOffer={settings?.navbarWholesaleOffer}
      />

      {/* Main Container */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12 flex flex-col">
        {/* Navigation Breadcrumb & Back Button */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <button
            type="button"
            onClick={navigateToHome}
            className="flex items-center gap-2 text-xs sm:text-sm text-[#8e8e93] hover:text-[#f5c767] transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Home</span>
          </button>

          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-[#666]">
            <span
              onClick={navigateToHome}
              className="hover:text-white cursor-pointer transition-colors"
            >
              Home
            </span>
            <ChevronRight className="w-3 h-3 text-[#444]" />
            <span className="text-[#e5a93c] font-medium">Categories</span>
          </div>
        </div>

        {/* Hero Banner / Header for Categories Page */}
        <div className="relative w-full rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#141008] via-[#100c06] to-[#0a0804] border border-[#2d2212] p-5 sm:p-8 md:p-10 mb-6 sm:mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.6)] overflow-hidden">
          {/* Subtle Golden Glow Background Accent */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#e5a93c]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1c160a] border border-[#e5a93c]/40 text-[#f5c767] text-[11px] sm:text-xs font-medium mb-2.5">
                <Sparkles className="w-3.5 h-3.5 text-[#e5a93c]" />
                <span>Curated Fine Collections</span>
                <span className="w-1 h-1 rounded-full bg-[#e5a93c]" />
                <span>{storeMode === "wholesale" ? "Wholesale B2B" : "Direct Retail"}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-white tracking-tight">
                All Jewellery Categories
              </h1>
              <p className="text-[#a0a0a0] text-xs sm:text-sm mt-1.5 max-w-xl leading-relaxed">
                Explore our full spectrum of signature craftsmanship. Select any category below to
                view and filter all matching jewellery pieces.
              </p>
            </div>

            {/* Quick Stats Pill */}
            <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
              <div className="px-4 py-2.5 rounded-xl bg-[#181308] border border-[#3a2c14] flex flex-col items-center">
                <span className="text-[17px] sm:text-xl font-bold text-[#f5c767] leading-none">
                  {validCategories.length}
                </span>
                <span className="text-[10px] sm:text-[11px] text-[#8e8e93] uppercase tracking-wider mt-0.5">
                  Categories
                </span>
              </div>

              <div className="px-4 py-2.5 rounded-xl bg-[#181308] border border-[#3a2c14] flex flex-col items-center">
                <span className="text-[17px] sm:text-xl font-bold text-white leading-none">
                  {totalChannelProductsCount}
                </span>
                <span className="text-[10px] sm:text-[11px] text-[#8e8e93] uppercase tracking-wider mt-0.5">
                  Products
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          {/* Category Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8e8e93]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search categories (e.g. Earrings, Necklace, Rings)..."
              className="w-full pl-10 pr-9 py-2.5 bg-[#0f0f0f] border border-[#222222] focus:border-[#e5a93c] text-white text-xs sm:text-sm rounded-xl placeholder:text-[#555] outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777] hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* "View All Jewellery" Instant CTA */}
          <button
            type="button"
            onClick={() => handleSelectCategory(null)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#141414] hover:bg-[#1c160c] border border-[#282828] hover:border-[#e5a93c]/60 text-white hover:text-[#f5c767] text-xs sm:text-sm font-medium transition-all cursor-pointer group shadow-sm shrink-0"
          >
            <Layers className="w-4 h-4 text-[#e5a93c] group-hover:scale-110 transition-transform" />
            <span>View All Jewellery ({totalChannelProductsCount})</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#e5a93c] group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Categories Grid */}
        {filteredCategories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4 md:gap-5">
            {filteredCategories.map((catItem) => {
              const catName = catItem.name;
              const thumbnail = getCategoryThumbnail(catItem);
              const count = getProductCountForCategory(catName);

              return (
                <div
                  key={catItem.id || catName}
                  onClick={() => handleSelectCategory(catName)}
                  className="group relative bg-[#0e0e0e] hover:bg-[#141008] border border-[#222222] hover:border-[#e5a93c] rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(229,169,60,0.18)] hover:-translate-y-1 cursor-pointer flex flex-col"
                >
                  {/* Category Image Area */}
                  <div className="relative w-full aspect-square bg-[#121212] overflow-hidden">
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt={catName}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#181308] to-[#0e0b05] text-[#e5a93c] p-4">
                        <Grid className="w-10 h-10 group-hover:scale-110 transition-transform text-[#e5a93c]" />
                        <span className="text-[10px] text-[#8e8e93] mt-2 text-center uppercase tracking-wider">
                          Fab Creations
                        </span>
                      </div>
                    )}

                    {/* Gradient Overlay for Text Readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                    {/* Top Right Items Count Pill */}
                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md border border-[#3a2c14] text-[#f5c767] text-[10px] font-semibold flex items-center gap-1 shadow-sm">
                      <span>{count}</span>
                      <span className="text-[8.5px] text-[#8e8e93]">items</span>
                    </div>
                  </div>

                  {/* Category Card Footer */}
                  <div className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between bg-gradient-to-b from-[#111111] to-[#0a0a0a]">
                    <div>
                      <h3 className="text-white group-hover:text-[#f5c767] font-serif font-semibold text-sm sm:text-[15px] leading-snug tracking-tight transition-colors line-clamp-1">
                        {catName}
                      </h3>
                      <p className="text-[#888] text-[11px] mt-0.5 line-clamp-1">
                        {count > 0 ? `${count} designs available` : "Exclusive collection"}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#1e1e1e] group-hover:border-[#3a2c14] flex items-center justify-between text-[11px] text-[#e5a93c] font-medium transition-colors">
                      <span>View Products</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty Search State */
          <div className="w-full py-16 px-4 rounded-2xl bg-[#0d0d0d] border border-[#222222] flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-full bg-[#181308] border border-[#3a2c14] flex items-center justify-center text-[#e5a93c] mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-white text-base font-serif font-medium">No Categories Found</h3>
            <p className="text-[#8e8e93] text-xs mt-1 max-w-sm">
              We couldn&apos;t find any categories matching &ldquo;{searchQuery}&rdquo;. Try another
              search or browse all available products.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="px-4 py-2 rounded-xl bg-[#1c160a] border border-[#e5a93c]/50 text-[#f5c767] text-xs font-medium hover:bg-[#261d0d] transition-colors cursor-pointer"
              >
                Clear Search
              </button>
              <button
                type="button"
                onClick={() => handleSelectCategory(null)}
                className="px-4 py-2 rounded-xl bg-[#141414] border border-[#2a2a2a] text-white text-xs font-medium hover:bg-[#1e1e1e] transition-colors cursor-pointer"
              >
                View All Products
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer
        onNavigateHome={navigateToHome}
        onNavigateShop={() => navigateToShop(null)}
        onNavigateAccount={navigateToAccount}
      />

      {/* Fixed Bottom Navigation Bar (Mobile Only: hidden on md:) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080808]/95 backdrop-blur-md border-t border-[#181818] flex justify-center pb-safe">
        <div className="w-full max-w-[440px] h-[64px] px-3 flex items-center justify-between relative">
          {/* Home */}
          <button
            type="button"
            onClick={navigateToHome}
            className="flex flex-col items-center justify-center flex-1 text-[#8e8e93] hover:text-white transition-colors gap-1 cursor-pointer"
          >
            <Home className="w-5 h-5" />
            <span className="text-[11px] font-normal">Home</span>
          </button>

          {/* Shop */}
          <button
            type="button"
            onClick={() => navigateToShop(null)}
            className="flex flex-col items-center justify-center flex-1 text-[#8e8e93] hover:text-white transition-colors gap-1 cursor-pointer"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[11px] font-normal">Shop</span>
          </button>

          {/* Elevated Center Cart Button */}
          <div className="flex flex-col items-center justify-center flex-1 relative">
            <button
              type="button"
              onClick={navigateToCart}
              className="w-[52px] h-[52px] rounded-full bg-[#f0a939] hover:bg-[#f5b842] text-[#111111] flex items-center justify-center shadow-[0_4px_20px_rgba(240,169,57,0.4)] -translate-y-5 transition-transform active:scale-95 cursor-pointer relative"
            >
              <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#e11d48] text-white text-[10px] font-bold flex items-center justify-center border-2 border-black">
                  {cartCount}
                </span>
              )}
            </button>
            <span className="text-[11px] text-[#8e8e93] -mt-4">Cart</span>
          </div>

          {/* Categories (ACTIVE) */}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex flex-col items-center justify-center flex-1 text-[#e5a93c] gap-1 cursor-pointer"
          >
            <Grid className="w-5 h-5 fill-[#e5a93c]" />
            <span className="text-[11px] font-medium">Categories</span>
          </button>

          {/* Account */}
          <button
            type="button"
            onClick={navigateToAccount}
            className="flex flex-col items-center justify-center flex-1 text-[#8e8e93] hover:text-white transition-colors gap-1 cursor-pointer"
          >
            <User className="w-5 h-5" />
            <span className="text-[11px] font-normal">Account</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
