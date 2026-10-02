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
import Header from "@/components/Header";
import CategoriesModal from "@/components/CategoriesModal";
import StoreModeToggle from "@/components/StoreModeToggle";
import type { Product, Category } from "@/lib/db";
import type { StoreSettings } from "@/lib/settings";
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
  isRetailLoggedIn?: boolean;
  onOpenWholesaleLogin?: () => void;
  onOpenRetailLogin?: (product?: Product | null) => void;
  onOpenRetailRegister?: (product?: Product | null) => void;
  onOpenAboutUs?: () => void;
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
  settings?: Partial<StoreSettings>;
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
  isRetailLoggedIn = false,
  onOpenWholesaleLogin,
  onOpenRetailLogin,
  onOpenRetailRegister,
  onOpenAboutUs,
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
  settings,
}: HomeScreenProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [cartCount, setCartCount] = useState<number>(initialCartCount);
  const [wishlist, setWishlist] = useState<string[]>(initialWishlist);
  const [logoSrc, setLogoSrc] = useState(LOGO_R2_URL);
  const [heroSrc, setHeroSrc] = useState(settings?.heroBannerImage || HERO_R2_URL);

  useEffect(() => {
    if (settings?.heroBannerImage) {
      setHeroSrc(settings.heroBannerImage);
    }
  }, [settings?.heroBannerImage]);

  const [notification, setNotification] = useState<string | null>(null);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Only display real categories that actually exist in the database / admin panel
  const displayedCategoryItems = React.useMemo(() => {
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

  const displayedCategories = React.useMemo(() => {
    return displayedCategoryItems.map((c) => c.name);
  }, [displayedCategoryItems]);

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
    if (storeMode === "wholesale") {
      if (!isWholesaleLoggedIn) {
        if (onOpenWholesaleLogin) onOpenWholesaleLogin();
        return;
      }
      const { items, effectivePrice } = addToCartByMode(product, storeMode, 1);
      setCartCount(items.reduce((s, i) => s + i.quantity, 0));
      onAddToCart?.({ ...product, price: effectivePrice }, 1);
      navigateToCart();
      return;
    }

    // Retail Store: User must be logged in to add to cart
    if (!isRetailLoggedIn) {
      if (onOpenRetailLogin) {
        onOpenRetailLogin(product);
      }
      return;
    }

    // If retail user is logged in, immediately add and go to checkout page!
    const { items, effectivePrice } = addToCartByMode(product, storeMode, 1);
    setCartCount(items.reduce((s, i) => s + i.quantity, 0));
    onAddToCart?.({ ...product, price: effectivePrice }, 1);
    navigateToCart();
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
        onNavigateShop={(cat) => {
          if (onSelectCategory) {
            onSelectCategory(cat || null);
          } else if (onNavigateShop) {
            onNavigateShop();
          }
        }}
        onNavigateCart={navigateToCart}
        onNavigateAccount={navigateToAccount}
        onOpenAboutUs={onOpenAboutUs}
        onOpenMenu={onOpenMenu}
        activeCategory={null}
        onSelectCategory={(cat) => {
          if (onSelectCategory) {
            onSelectCategory(cat);
          } else {
            navigateToShop();
          }
        }}
        categories={categories}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearchSubmit={navigateToShop}
        currentTab="home"
        navbarRetailOffer={settings?.navbarRetailOffer}
        navbarWholesaleOffer={settings?.navbarWholesaleOffer}
      />

      {/* Responsive Container */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col">

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
            <div className="absolute inset-0 p-5 sm:p-8 md:p-12 lg:p-14 flex flex-col justify-between md:justify-center md:gap-5 lg:gap-6 z-10">
              <div className="space-y-1.5 sm:space-y-2 md:space-y-2.5 max-w-[230px] sm:max-w-sm md:max-w-md lg:max-w-lg">
                <p className="text-[#e5a93c] text-[10.5px] sm:text-[11.5px] md:text-[12.5px] lg:text-[13.5px] font-semibold tracking-[0.2em] uppercase">
                  {settings?.heroSubtitle || "TIMELESS JEWELRY"}
                </p>

                <h2 className="text-white text-[23px] sm:text-[28px] md:text-[36px] lg:text-[42px] font-serif font-normal leading-[1.18] tracking-tight whitespace-pre-line">
                  {settings?.heroTitle ? (
                    settings.heroTitle
                  ) : (
                    <>
                      Designed <br />
                      for Every You
                    </>
                  )}
                </h2>

                <p className="text-[#a8a8a8] text-[9.5px] sm:text-[10.5px] md:text-[11.5px] lg:text-[12px] tracking-[0.14em] uppercase pt-0.5">
                  {settings?.heroTagline || (
                    <>ANTI TARNISH <span className="text-[#e5a93c] mx-1">|</span> PREMIUM QUALITY</>
                  )}
                </p>
              </div>

              <div>
                <button
                  onClick={onNavigateShop}
                  className="h-[34px] sm:h-[38px] md:h-[42px] px-4 sm:px-5 md:px-6 rounded-full border border-[#e5a93c] bg-black/40 backdrop-blur-sm text-[#e5a93c] hover:bg-[#e5a93c] hover:text-black transition-all text-[11.5px] sm:text-[12px] md:text-[13px] font-semibold tracking-wide flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                >
                  <span>{settings?.heroButtonText || "SHOP NOW"}</span>
                  <ArrowRight className="w-3 h-3 md:w-3.5 md:h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section (Mobile Only: lg:hidden - on desktop categories are directly in the navbar) */}
        {displayedCategoryItems.length > 0 && (
          <section className="lg:hidden px-4 py-2">
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

            <div className="flex items-center gap-3.5 sm:gap-4 overflow-x-auto pb-2 pt-1 scrollbar-none px-1">
              {displayedCategoryItems.map((catItem) => {
                const catName = catItem.name;
                // Fallback to product image if no category thumbnail is explicitly uploaded
                const categoryProduct = products.find(
                  (p) => p.category?.toLowerCase() === catName.toLowerCase() && p.image
                );
                const thumbnailSrc = catItem.image || categoryProduct?.image;

                return (
                  <button
                    key={catName}
                    type="button"
                    onClick={() => {
                      onSelectCategory?.(catName);
                      navigateToShop();
                    }}
                    className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group focus:outline-none"
                  >
                    {/* Round Shape Container with Luxury Gold Gradient Ring */}
                    <div className="relative w-[66px] h-[66px] sm:w-[72px] sm:h-[72px] rounded-full p-[2px] bg-gradient-to-tr from-[#d69e3d] via-[#f5c767] to-[#8a6828] group-hover:scale-105 group-hover:from-[#f5c767] group-hover:to-[#e5a93c] transition-all duration-300 shadow-md">
                      <div className="w-full h-full rounded-full bg-[#121212] overflow-hidden flex items-center justify-center p-[2px]">
                        {thumbnailSrc ? (
                          <img
                            src={thumbnailSrc}
                            alt={catName}
                            className="w-full h-full rounded-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-[#181308] border border-[#3a2c14] flex items-center justify-center text-[#e5a93c]">
                            <Grid className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Category Name */}
                    <span className="text-white text-[11.5px] sm:text-[12px] font-medium group-hover:text-[#e5a93c] transition-colors max-w-[76px] truncate text-center tracking-tight">
                      {catName}
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
