"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ArrowRight,
  Heart,
  ShoppingCart,
  Home,
  ShoppingBag,
  Grid,
  User,
  Star,
  Lock,
  Menu,
  X,
} from "lucide-react";
import Footer from "@/components/Footer";
import CategoriesModal from "@/components/CategoriesModal";
import StoreModeToggle from "@/components/StoreModeToggle";
import type { Product, Category } from "@/lib/db";
import {
  addToCartByMode,
  toggleWishlistByMode,
  getWishlistItems,
  getCartCount,
} from "@/lib/cart";

interface HomeScreenProps {
  products?: Product[];
  categories?: Category[];
  cartCount?: number;
  wishlist?: string[];
  storeMode?: "retail" | "wholesale";
  onSwitchStoreMode?: (mode: "retail" | "wholesale") => void;
  isWholesaleLoggedIn?: boolean;
  onOpenWholesaleLogin?: () => void;
  onToggleWishlist?: (productId: string) => void;
  onNavigateHome?: () => void;
  onSignOut?: () => void;
  onNavigateShop?: () => void;
  onNavigateCart?: () => void;
  onNavigateAccount?: () => void;
  onSelectProduct?: (product: Product) => void;
  onAddToCart?: (product: Product, quantity?: number) => void;
  onSelectCategory?: (category: string | null) => void;
  onOpenMenu?: () => void;
}

const R2_BASE = "https://pub-ce8688bc6c654bcfb99716f7c9373bcd.r2.dev/fab-creations";
const LOGO_R2_URL = `${R2_BASE}/brand-logo.png`;
const HERO_R2_URL = `${R2_BASE}/hero-banner.jpg`;

export default function HomeScreen({
  products: initialProducts = [],
  categories: initialCategories = [],
  cartCount: initialCartCount = 0,
  wishlist: initialWishlist = [],
  storeMode = "retail",
  onSwitchStoreMode,
  isWholesaleLoggedIn = false,
  onOpenWholesaleLogin,
  onToggleWishlist,
  onNavigateHome,
  onSignOut,
  onNavigateShop,
  onNavigateCart,
  onNavigateAccount,
  onSelectProduct,
  onAddToCart,
  onSelectCategory,
  onOpenMenu,
}: HomeScreenProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [cartCount, setCartCount] = useState<number>(initialCartCount);
  const [wishlist, setWishlist] = useState<string[]>(initialWishlist);
  const [logoSrc, setLogoSrc] = useState(LOGO_R2_URL);
  const [heroSrc, setHeroSrc] = useState(HERO_R2_URL);
  const [notification, setNotification] = useState<string | null>(null);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Sync props if provided
  useEffect(() => {
    if (initialProducts.length > 0) {
      setProducts(initialProducts);
      try {
        localStorage.setItem("fc_cached_products", JSON.stringify(initialProducts));
      } catch {}
    }
  }, [initialProducts]);

  useEffect(() => {
    if (initialCategories.length > 0) {
      setCategories(initialCategories);
      try {
        localStorage.setItem("fc_cached_categories", JSON.stringify(initialCategories));
      } catch {}
    }
  }, [initialCategories]);

  useEffect(() => {
    if (initialCartCount > 0) setCartCount(initialCartCount);
  }, [initialCartCount]);

  useEffect(() => {
    if (initialWishlist.length > 0) setWishlist(initialWishlist);
  }, [initialWishlist]);

  // Instant SWR cache hydration (0ms render) + background revalidation
  useEffect(() => {
    try {
      if (!initialProducts.length) {
        const cached = localStorage.getItem("fc_cached_products");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) setProducts(parsed);
        }
      }
      if (!initialCategories.length) {
        const cachedCats = localStorage.getItem("fc_cached_categories");
        if (cachedCats) {
          const parsedCats = JSON.parse(cachedCats);
          if (Array.isArray(parsedCats) && parsedCats.length > 0) setCategories(parsedCats);
        }
      }
    } catch {}

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
      .catch((err) => console.error("Failed to load products in HomeScreen:", err));

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
      .catch((err) => console.error("Failed to load categories in HomeScreen:", err));

    setCartCount(getCartCount(storeMode));
    setWishlist(getWishlistItems(storeMode));
  }, [storeMode]);

  const toggleWishlist = (id: string) => {
    onToggleWishlist?.(id);
    const { items, isAdded } = toggleWishlistByMode(storeMode, id);
    setWishlist(items);
    setNotification(
      isAdded
        ? `Added to ${storeMode === "wholesale" ? "Wholesale" : "Retail"} Wishlist`
        : `Removed from ${storeMode === "wholesale" ? "Wholesale" : "Retail"} Wishlist`
    );
    setTimeout(() => setNotification(null), 2500);
  };

  const handleAddToCart = (product: Product) => {
    if (storeMode === "wholesale" && !isWholesaleLoggedIn) {
      if (onOpenWholesaleLogin) onOpenWholesaleLogin();
      return;
    }

    const { items, effectivePrice } = addToCartByMode(product, storeMode, 1);
    setCartCount(items.reduce((s, i) => s + i.quantity, 0));
    onAddToCart?.({ ...product, price: effectivePrice }, 1);

    const noticeText =
      storeMode === "wholesale"
        ? `Added ${product.name} to Wholesale Cart! (₹${effectivePrice})`
        : `Added ${product.name} to Retail Cart! (₹${effectivePrice})`;
    setNotification(noticeText);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleProductClick = (product: Product) => {
    try {
      localStorage.setItem("fc_selected_product", JSON.stringify(product));
    } catch {
      // ignore
    }
    if (onSelectProduct) {
      onSelectProduct(product);
    } else {
      router.push(`/product?id=${product.id}`);
    }
  };

  const navigateToHome = onNavigateHome || (() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  const navigateToShop = () => {
    if (onNavigateShop) onNavigateShop();
    else router.push("/shop");
  };

  const navigateToCart = () => {
    if (onNavigateCart) onNavigateCart();
    else router.push("/cart");
  };

  const navigateToAccount = () => {
    if (onNavigateAccount) onNavigateAccount();
    else router.push("/account");
  };

  // Filter products by active store mode channel
  const channelProducts = products.filter((p) => {
    if (storeMode === "wholesale") {
      return p.channel === "wholesale" || p.channel === "both" || !p.channel;
    }
    return p.channel === "retail" || p.channel === "both" || !p.channel;
  });

  const featured = channelProducts.filter((p) => p.featured);
  const displayProducts = featured.length > 0 ? featured.slice(0, 10) : channelProducts.slice(0, 10);

  return (
    <div className="relative min-h-screen w-full bg-[#050505] text-white flex flex-col items-center justify-start pb-28 select-none">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-3 z-50 px-4 py-2 bg-[#1c160c] border border-[#e5a93c] text-[#f5c767] text-xs rounded-full shadow-2xl animate-fade-in">
          {notification}
        </div>
      )}

      {/* Responsive Container */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col">
        {/* Top Announcement Bar */}
        <div className="w-full py-2 bg-[#000000] border-b border-[#141414] text-center my-1 rounded-xl">
          <p className="text-[#e5a93c] text-[12px] sm:text-[13px] font-medium tracking-wide">
            {storeMode === "wholesale"
              ? "B2B Wholesale • Minimum Order: Rs 3,000 • Verified Businesses Only"
              : "Retail Store • Free Shipping Over ₹999 • No Minimum Order"}
          </p>
        </div>

        {/* Wholesale Active Banner (Only shown when user enters Wholesale Portal) */}
        {storeMode === "wholesale" && (
          <div className="w-full mt-2 mb-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#1c1508] via-[#2a1d07] to-[#1c1508] border border-[#e5a93c]/50 flex items-center justify-between text-xs shadow-md">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[#f5c767] font-semibold text-xs sm:text-sm">Wholesale Portal Active</span>
              <span className="text-[#a0a0a0] text-xs hidden sm:inline">(Min. ₹3,000 order required)</span>
            </div>
            <button
              type="button"
              onClick={() => onSwitchStoreMode?.("retail")}
              className="text-xs text-[#e5a93c] hover:text-[#f5c767] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              <span>Switch to Retail Store</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Header Bar */}
        <header className="py-3 flex items-center justify-between gap-3 bg-[#050505] border-b border-[#161616] mb-3">
          {/* Left: Hamburger & Brand */}
          <div className="flex items-center gap-3">
            {/* Hamburger Menu Button */}
            <button
              type="button"
              onClick={onOpenMenu}
              aria-label="Open navigation menu"
              className="w-10 h-10 rounded-full bg-[#0e0e0e] border border-[#262626] flex items-center justify-center text-[#e5a93c] hover:text-[#f5c767] hover:border-[#e5a93c]/60 active:scale-95 transition-all shrink-0 cursor-pointer shadow-sm"
              title="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo + Brand Name */}
            <div
              onClick={navigateToHome}
              title="Fab Creations"
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 relative rounded-full overflow-hidden shrink-0 transition-transform group-hover:scale-105 border border-[#332512]">
                <Image
                  src={logoSrc}
                  alt="Fab Creations Logo"
                  width={56}
                  height={56}
                  priority
                  unoptimized
                  onError={() => setLogoSrc("/images/logo.png")}
                  className="object-contain w-full h-full"
                />
              </div>
              <div className="hidden sm:block">
                <span className="text-base sm:text-lg font-serif font-semibold text-white tracking-wide block leading-tight group-hover:text-[#e5a93c] transition-colors">
                  FAB CREATIONS
                </span>
                <span className="text-[10px] text-[#e5a93c] tracking-[0.2em] uppercase font-medium">
                  {storeMode === "wholesale" ? "Wholesale B2B" : "Luxury Jewellery"}
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6 ml-6 text-sm">
              <button
                type="button"
                onClick={() => {
                  if (storeMode === "wholesale") onSwitchStoreMode?.("retail");
                  navigateToHome();
                }}
                className={`transition-colors cursor-pointer font-medium ${
                  storeMode === "retail" ? "text-[#e5a93c]" : "text-[#a0a0a0] hover:text-white"
                }`}
              >
                Retail Store
              </button>
              <button
                type="button"
                onClick={navigateToShop}
                className="text-[#a0a0a0] hover:text-white transition-colors cursor-pointer font-medium"
              >
                Catalogue
              </button>
              <button
                type="button"
                onClick={() => onSwitchStoreMode?.("wholesale")}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  storeMode === "wholesale"
                    ? "bg-[#e5a93c] text-black shadow-md"
                    : "bg-[#161208] border border-[#e5a93c]/50 text-[#e5a93c] hover:bg-[#e5a93c] hover:text-black"
                }`}
              >
                <span>Wholesale Portal</span>
                <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-black/20 font-bold">B2B</span>
              </button>
              <button
                type="button"
                onClick={onOpenMenu}
                className="text-[#a0a0a0] hover:text-white transition-colors cursor-pointer font-medium"
              >
                About Us
              </button>
            </nav>
          </div>

          {/* Right: Search & Actions */}
          <div className="flex items-center gap-2.5 flex-1 justify-end max-w-xl">
            {/* Search Bar */}
            <div className="flex-1 flex items-center h-10 rounded-full bg-[#0e0e0e] border border-[#2a2a2a] px-3 gap-2 focus-within:border-[#e5a93c] transition-all">
              <Search className="w-4 h-4 text-[#8e8e93] shrink-0" />
              <input
                type="text"
                placeholder={storeMode === "wholesale" ? "Search wholesale..." : "Search jewellery..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") navigateToShop();
                }}
                className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-[#8e8e93] outline-none font-normal"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-[#8e8e93] hover:text-white p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={navigateToShop}
                className="text-[#e5a93c] hover:text-[#f5c767] transition-colors p-0.5"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Desktop Account Button */}
            <button
              type="button"
              onClick={navigateToAccount}
              className="hidden sm:flex items-center gap-1.5 h-10 px-3.5 rounded-full bg-[#0e0e0e] border border-[#262626] text-xs font-medium text-[#c5c5c5] hover:text-white hover:border-[#444] transition-all cursor-pointer"
            >
              <User className="w-4 h-4 text-[#e5a93c]" />
              <span>Account</span>
            </button>

            {/* Quick Cart Button */}
            <button
              type="button"
              onClick={navigateToCart}
              aria-label="View Cart"
              className="w-10 h-10 rounded-full bg-[#0e0e0e] border border-[#262626] flex items-center justify-center text-[#e5a93c] hover:text-[#f5c767] hover:border-[#e5a93c]/60 active:scale-95 transition-all shrink-0 cursor-pointer relative shadow-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-[#d4992e] to-[#f5c767] text-black text-[10px] font-bold rounded-full flex items-center justify-center shadow-md">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Hero Banner Section */}
        <section className="pt-1 pb-4">
          <div className="relative w-full h-[230px] sm:h-[320px] md:h-[400px] lg:h-[460px] rounded-[24px] overflow-hidden border border-[#222222] shadow-[0_8px_30px_rgba(0,0,0,0.85)]">
            <Image
              src={heroSrc}
              alt="Designed for Every You - Fab Creations"
              fill
              priority
              unoptimized
              onError={() => setHeroSrc("/images/hero-banner.jpg")}
              className="object-cover object-right sm:object-center"
            />

            {/* Gradient Dark Overlay on Left */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-transparent sm:via-black/60"
              style={{ width: "85%" }}
            />

            {/* Banner Content */}
            <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-between z-10">
              <div className="space-y-1.5 max-w-[230px]">
                <p className="text-[#e5a93c] text-[10.5px] sm:text-[11px] font-semibold tracking-[0.2em] uppercase">
                  TIMELESS JEWELRY
                </p>

                <h2 className="text-white text-[23px] sm:text-[25px] font-serif font-normal leading-[1.18] tracking-tight">
                  Designed <br />
                  for Every You
                </h2>

                <p className="text-[#a8a8a8] text-[9.5px] sm:text-[10px] tracking-[0.14em] uppercase pt-0.5">
                  ANTI TARNISH <span className="text-[#e5a93c] mx-1">|</span> PREMIUM QUALITY
                </p>
              </div>

              <div>
                <button
                  onClick={onNavigateShop}
                  className="h-[34px] px-4 rounded-full border border-[#e5a93c] bg-black/40 backdrop-blur-sm text-[#e5a93c] hover:bg-[#e5a93c] hover:text-black transition-all text-[11.5px] font-semibold tracking-wide flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                >
                  <span>SHOP NOW</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        {categories.length > 0 && (
          <section className="px-4 py-2">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-white text-[17px] font-serif font-medium tracking-tight">
                Shop by Category
              </h3>
              <button
                onClick={() => setIsCategoriesOpen(true)}
                className="text-[#e5a93c] hover:text-[#f5c767] text-[12px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => {
                const count = products.filter(
                  (p) => p.category?.toLowerCase() === cat.name.toLowerCase()
                ).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      onSelectCategory?.(cat.name);
                      navigateToShop();
                    }}
                    className="flex flex-col items-center justify-center min-w-[90px] px-3 py-2.5 rounded-[16px] bg-[#0d0d0d] border border-[#222222] hover:border-[#e5a93c] transition-all group shrink-0 cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#161208] border border-[#3a2c14] flex items-center justify-center text-[#e5a93c] mb-1.5 group-hover:scale-110 transition-transform">
                      <Grid className="w-4 h-4" />
                    </div>
                    <span className="text-white text-[12px] font-medium group-hover:text-[#e5a93c] transition-colors max-w-[85px] truncate">
                      {cat.name}
                    </span>
                    <span className="text-[#8e8e93] text-[10px] pt-0.5">
                      {count} items
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Featured Products Section */}
        <section className="px-4 py-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-white text-[19px] font-serif font-medium tracking-tight">
              Featured Products
            </h3>
            <button
              onClick={onNavigateShop}
              className="text-[#e5a93c] hover:text-[#f5c767] text-[13px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Dynamic Products Grid or Clean Empty State */}
          {displayProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4 md:gap-6">
              {displayProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className="bg-[#0d0d0d] border border-[#202020] rounded-[18px] overflow-hidden flex flex-col transition-all duration-300 hover:border-[#383838] cursor-pointer group"
                >
                  {/* Image & Wishlist Button */}
                  <div className="relative w-full aspect-[1.18] bg-[#141414] overflow-hidden">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      priority={displayProducts.indexOf(product) < 4}
                      sizes="(max-width: 640px) 50vw, 220px"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/products/moon-necklace.jpg";
                      }}
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product.id);
                      }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-[#e5a93c] hover:scale-110 active:scale-95 transition-all z-10"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          wishlist.includes(product.id)
                            ? "fill-[#e5a93c] text-[#e5a93c]"
                            : "text-[#e5a93c]"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between">
                    <div>
                      {/* Rating */}
                      <div className="flex items-center gap-1 mb-1">
                        <div className="flex items-center text-[#e5a93c]">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < Math.floor(product.rating || 5)
                                  ? "fill-[#e5a93c] text-[#e5a93c]"
                                  : "text-[#555555]"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[#8e8e93] text-[11px]">
                          ({product.reviewsCount || 0})
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="text-white text-[14.5px] font-medium leading-snug tracking-tight mb-0.5 line-clamp-1">
                        {product.name}
                      </h4>

                      {/* Subtitle */}
                      <p className="text-[#8e8e93] text-[12px] mb-2 font-normal line-clamp-1">
                        {product.subtitle || product.category}
                      </p>
                    </div>

                    {/* Price & Add to Cart */}
                    <div className="flex items-center justify-between pt-1">
                      {storeMode === "wholesale" && !isWholesaleLoggedIn ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenWholesaleLogin) onOpenWholesaleLogin();
                          }}
                          className="px-2 py-1 rounded-lg bg-[#1a140a] border border-[#e5a93c]/50 text-[#e5a93c] text-[11px] font-medium hover:bg-[#e5a93c] hover:text-black transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Lock className="w-3 h-3" />
                          <span>Login for Price</span>
                        </button>
                      ) : (
                        <div className="flex flex-col">
                          <span className="text-[#e5a93c] text-[16px] font-semibold leading-tight">
                            ₹{storeMode === "wholesale" ? (product.wholesalePrice ?? product.price) : (product.retailPrice ?? product.price)}
                          </span>
                          {storeMode === "wholesale" && (
                            <span className="text-[9.5px] text-[#8e8e93]">Wholesale</span>
                          )}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                        className="px-2.5 py-1 rounded-full bg-[#1c160c] border border-[#e5a93c] text-[#e5a93c] hover:bg-[#e5a93c] hover:text-black transition-all text-xs font-medium cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full bg-[#0d0d0d] border border-[#222222] rounded-[20px] p-8 text-center my-2">
              <ShoppingBag className="w-8 h-8 text-[#e5a93c] mx-auto mb-2 opacity-60" />
              <p className="text-white text-sm font-medium">No products available yet</p>
              <p className="text-[#8e8e93] text-xs mt-1">
                Products added via the admin panel will appear here.
              </p>
            </div>
          )}
        </section>

        {/* Luxury Footer */}
        <Footer
          onNavigateHome={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          onNavigateShop={navigateToShop}
          onNavigateAccount={navigateToAccount}
        />
      </div>

      {/* Categories Pop-up Modal */}
      <CategoriesModal
        isOpen={isCategoriesOpen}
        onClose={() => setIsCategoriesOpen(false)}
        categories={categories}
        onSelectCategory={(catName) => {
          if (onSelectCategory) {
            onSelectCategory(catName);
          } else {
            navigateToShop();
          }
        }}
      />

      {/* Fixed Bottom Navigation Bar (Mobile Only: hidden on md:) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080808]/95 backdrop-blur-md border-t border-[#181818] flex justify-center pb-safe">
        <div className="w-full max-w-[440px] h-[64px] px-3 flex items-center justify-between relative">
          {/* Home (ACTIVE) */}
          <button
            type="button"
            onClick={navigateToHome}
            className="flex flex-col items-center justify-center flex-1 text-[#e5a93c] gap-1 cursor-pointer"
          >
            <Home className="w-5 h-5 fill-[#e5a93c]" />
            <span className="text-[11px] font-medium">Home</span>
          </button>

          {/* Shop */}
          <button
            type="button"
            onClick={navigateToShop}
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

          {/* Categories */}
          <button
            type="button"
            onClick={() => setIsCategoriesOpen(true)}
            className="flex flex-col items-center justify-center flex-1 text-[#8e8e93] hover:text-[#e5a93c] transition-colors gap-1 cursor-pointer"
          >
            <Grid className="w-5 h-5" />
            <span className="text-[11px] font-normal">Categories</span>
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
