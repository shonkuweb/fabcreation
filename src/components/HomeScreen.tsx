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
} from "lucide-react";
import Footer from "@/components/Footer";
import CategoriesModal from "@/components/CategoriesModal";
import type { Product, Category } from "@/lib/db";

interface HomeScreenProps {
  products?: Product[];
  categories?: Category[];
  cartCount?: number;
  wishlist?: string[];
  onToggleWishlist?: (productId: string) => void;
  onNavigateHome?: () => void;
  onSignOut?: () => void;
  onNavigateShop?: () => void;
  onNavigateCart?: () => void;
  onNavigateAccount?: () => void;
  onSelectProduct?: (product: Product) => void;
  onAddToCart?: (product: Product, quantity?: number) => void;
  onSelectCategory?: (category: string | null) => void;
}

const R2_BASE = "https://pub-ce8688bc6c654bcfb99716f7c9373bcd.r2.dev/fab-creations";
const LOGO_R2_URL = `${R2_BASE}/logo.png`;
const HERO_R2_URL = `${R2_BASE}/hero-banner.jpg`;

export default function HomeScreen({
  products: initialProducts = [],
  categories: initialCategories = [],
  cartCount: initialCartCount = 0,
  wishlist: initialWishlist = [],
  onToggleWishlist,
  onNavigateHome,
  onSignOut,
  onNavigateShop,
  onNavigateCart,
  onNavigateAccount,
  onSelectProduct,
  onAddToCart,
  onSelectCategory,
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

    try {
      const savedCart = localStorage.getItem("fc_b2b_cart");
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        setCartCount(parsed.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0));
      }
      const savedWishlist = localStorage.getItem("fc_b2b_wishlist");
      if (savedWishlist) {
        setWishlist(JSON.parse(savedWishlist));
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleWishlist = (id: string) => {
    if (onToggleWishlist) {
      onToggleWishlist(id);
    }
    setWishlist((prev) => {
      const exists = prev.includes(id);
      const updated = exists ? prev.filter((i) => i !== id) : [...prev, id];
      try {
        localStorage.setItem("fc_b2b_wishlist", JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleAddToCart = (product: Product) => {
    if (onAddToCart) {
      onAddToCart(product, 1);
    } else {
      try {
        const saved = localStorage.getItem("fc_b2b_cart");
        const cart = saved ? JSON.parse(saved) : [];
        const existing = cart.find((i: any) => i.id === product.id);
        let updated;
        if (existing) {
          updated = cart.map((i: any) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
        } else {
          updated = [...cart, { id: product.id, name: product.name, price: product.price, quantity: 1, image: product.image }];
        }
        localStorage.setItem("fc_b2b_cart", JSON.stringify(updated));
        setCartCount(updated.reduce((s: number, i: any) => s + i.quantity, 0));
      } catch {
        // ignore
      }
    }
    setNotification(`Added ${product.name} to cart! (B2B Min: Rs 3000)`);
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

  // Filter featured or first 4 products
  const featured = products.filter((p) => p.featured);
  const displayProducts = featured.length > 0 ? featured.slice(0, 4) : products.slice(0, 4);

  return (
    <div className="relative min-h-screen w-full bg-[#050505] text-white flex flex-col items-center justify-start pb-28 select-none">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-3 z-50 px-4 py-2 bg-[#1c160c] border border-[#e5a93c] text-[#f5c767] text-xs rounded-full shadow-2xl animate-fade-in">
          {notification}
        </div>
      )}

      {/* Mobile container */}
      <div className="w-full max-w-[440px] flex flex-col">
        {/* Top Announcement Bar */}
        <div className="w-full py-2 bg-[#000000] border-b border-[#141414] text-center">
          <p className="text-[#e5a93c] text-[12.5px] font-medium tracking-wide">
            B2B Minimum Order: Rs 3000
          </p>
        </div>

        {/* Header Bar */}
        <header className="px-4 py-3 flex items-center justify-between gap-3 bg-[#050505]">
          {/* Logo */}
          <div
            onClick={navigateToHome}
            title="Fab Creations"
            className="w-[48px] h-[48px] relative rounded-full overflow-hidden shrink-0 cursor-pointer transition-transform hover:scale-105"
          >
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

          {/* Search Bar */}
          <div className="flex-1 flex items-center h-[44px] rounded-full bg-[#0e0e0e] border border-[#2a2a2a] px-3.5 gap-2.5 focus-within:border-[#e5a93c] transition-all">
            <Search className="w-4 h-4 text-[#8e8e93] shrink-0" />
            <input
              type="text"
              placeholder="Search jewelry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") navigateToShop();
              }}
              className="flex-1 bg-transparent text-[13.5px] text-white placeholder-[#8e8e93] outline-none font-normal"
            />
            <div className="h-4 w-[1px] bg-[#2a2a2a]" />
            <button
              type="button"
              onClick={onNavigateShop}
              className="text-[#e5a93c] hover:text-[#f5c767] transition-colors p-0.5"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Hero Banner Section */}
        <section className="px-4 pt-1 pb-4">
          <div className="relative w-full h-[225px] sm:h-[235px] rounded-[22px] overflow-hidden border border-[#222222] shadow-[0_8px_30px_rgba(0,0,0,0.85)]">
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

            {/* Carousel Indicators */}
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
              <span className="w-6 h-1.5 bg-[#e5a93c] rounded-full shadow-sm" />
              <span className="w-1.5 h-1.5 bg-[#4a4a4a] rounded-full" />
              <span className="w-1.5 h-1.5 bg-[#4a4a4a] rounded-full" />
              <span className="w-1.5 h-1.5 bg-[#4a4a4a] rounded-full" />
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
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
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
                      <span className="text-[#e5a93c] text-[16px] font-semibold">
                        ₹{product.price}
                      </span>
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

      {/* Fixed Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#080808]/95 backdrop-blur-md border-t border-[#181818] flex justify-center pb-safe">
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
