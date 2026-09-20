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
  Tag,
} from "lucide-react";
import Footer from "@/components/Footer";
import CategoriesModal from "@/components/CategoriesModal";
import type { Product, Category } from "@/lib/db";

interface ShopScreenProps {
  products?: Product[];
  categories?: Category[];
  cartCount?: number;
  wishlist?: string[];
  onToggleWishlist?: (productId: string) => void;
  selectedCategory?: string | null;
  onNavigateHome?: () => void;
  onNavigateCart?: () => void;
  onNavigateAccount?: () => void;
  onSelectProduct?: (product: Product) => void;
  onAddToCart?: (product: Product, quantity?: number) => void;
  onSelectCategory?: (category: string | null) => void;
  onSignOut?: () => void;
}

const R2_BASE = "https://pub-ce8688bc6c654bcfb99716f7c9373bcd.r2.dev/fab-creations";
const LOGO_R2_URL = `${R2_BASE}/logo.png`;
const HERO_R2_URL = `${R2_BASE}/hero-banner.jpg`;

export default function ShopScreen({
  products: initialProducts = [],
  categories: initialCategories = [],
  cartCount: initialCartCount = 0,
  wishlist: initialWishlist = [],
  onToggleWishlist,
  selectedCategory: initialCategory = null,
  onNavigateHome,
  onNavigateCart,
  onNavigateAccount,
  onSelectProduct,
  onAddToCart,
  onSelectCategory,
  onSignOut,
}: ShopScreenProps) {
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
  const [activeCategory, setActiveCategory] = useState<string | null>(initialCategory);

  // Sync props if provided
  useEffect(() => {
    if (initialProducts.length > 0) setProducts(initialProducts);
  }, [initialProducts]);

  useEffect(() => {
    if (initialCategories.length > 0) setCategories(initialCategories);
  }, [initialCategories]);

  useEffect(() => {
    if (initialCartCount > 0) setCartCount(initialCartCount);
  }, [initialCartCount]);

  useEffect(() => {
    if (initialWishlist.length > 0) setWishlist(initialWishlist);
  }, [initialWishlist]);

  // Always fetch latest products and categories on mount
  useEffect(() => {
    fetch("/api/products", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.products)) setProducts(d.products);
      })
      .catch((err) => console.error("Failed to load products in ShopScreen:", err));

    fetch("/api/categories", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.categories)) setCategories(d.categories);
      })
      .catch((err) => console.error("Failed to load categories in ShopScreen:", err));

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

  const navigateToHome = () => {
    if (onNavigateHome) onNavigateHome();
    else router.push("/home");
  };

  const navigateToCart = () => {
    if (onNavigateCart) onNavigateCart();
    else router.push("/cart");
  };

  const navigateToAccount = () => {
    if (onNavigateAccount) onNavigateAccount();
    else router.push("/account");
  };

  // Filter products by search and category
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.subtitle?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      !activeCategory || p.category?.toLowerCase() === activeCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="relative min-h-screen w-full bg-[#050505] text-white flex flex-col items-center justify-start pb-28 select-none">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-3 z-50 px-4 py-2 bg-[#1c160c] border border-[#e5a93c] text-[#f5c767] text-xs rounded-full shadow-2xl animate-fade-in">
          {notification}
        </div>
      )}

      {/* Mobile Frame Container */}
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
            onClick={onNavigateHome}
            title="Go to Home"
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
              placeholder="Search in catalogue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-[13.5px] text-white placeholder-[#8e8e93] outline-none font-normal"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-[#8e8e93] hover:text-white text-xs px-1"
              >
                Clear
              </button>
            )}
          </div>
        </header>

        {/* Hero Banner Section */}
        <section className="px-4 pt-1 pb-3">
          <div className="relative w-full h-[200px] rounded-[22px] overflow-hidden border border-[#222222] shadow-[0_8px_30px_rgba(0,0,0,0.85)]">
            <Image
              src={heroSrc}
              alt="Designed for Every You - Fab Creations"
              fill
              priority
              unoptimized
              onError={() => setHeroSrc("/images/hero-banner.jpg")}
              className="object-cover object-right sm:object-center"
            />

            <div
              className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 to-transparent sm:via-black/60"
              style={{ width: "90%" }}
            />

            <div className="absolute inset-0 p-5 flex flex-col justify-between z-10">
              <div className="space-y-1 max-w-[240px]">
                <p className="text-[#e5a93c] text-[10px] font-semibold tracking-[0.2em] uppercase">
                  WHOLESALE STORE
                </p>
                <h2 className="text-white text-[22px] font-serif font-normal leading-[1.2] tracking-tight">
                  Premium B2B <br />
                  Jewelry Catalog
                </h2>
                <p className="text-[#a8a8a8] text-[9.5px] tracking-[0.14em] uppercase pt-0.5">
                  FACTORY DIRECT <span className="text-[#e5a93c] mx-1">|</span> ANTI TARNISH
                </p>
              </div>

              {/* Dynamic Stats Row */}
              <div className="pt-2 border-t border-[#333333]/60 max-w-[340px]">
                <div className="flex items-center justify-between text-center pr-4">
                  {/* Col 1: Dynamic Products Count */}
                  <div className="flex flex-col">
                    <span className="text-[#e5a93c] text-[18px] font-semibold leading-tight">
                      {products.length}
                    </span>
                    <span className="text-[#8e8e93] text-[11px] font-normal">
                      Products
                    </span>
                  </div>

                  <div className="w-[1px] h-7 bg-[#3a3a3a]" />

                  {/* Col 2: Authentic */}
                  <div className="flex flex-col">
                    <span className="text-[#e5a93c] text-[18px] font-semibold leading-tight">
                      100%
                    </span>
                    <span className="text-[#8e8e93] text-[11px] font-normal">
                      Authentic
                    </span>
                  </div>

                  <div className="w-[1px] h-7 bg-[#3a3a3a]" />

                  {/* Col 3: Rating */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-0.5 text-[#e5a93c] text-[18px] font-semibold leading-tight">
                      <span>4.8</span>
                      <span className="text-[14px]">★</span>
                    </div>
                    <span className="text-[#8e8e93] text-[11px] font-normal">
                      Rating
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Pills Filter */}
        {categories.length > 0 && (
          <section className="px-4 py-2">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => {
                  setActiveCategory(null);
                  onSelectCategory?.(null);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  !activeCategory
                    ? "bg-[#e5a93c] text-black font-semibold shadow-md"
                    : "bg-[#111111] border border-[#262626] text-[#8e8e93] hover:text-white hover:border-[#383838]"
                }`}
              >
                All ({products.length})
              </button>

              {categories.map((cat) => {
                const count = products.filter(
                  (p) => p.category?.toLowerCase() === cat.name.toLowerCase()
                ).length;
                const isSelected = activeCategory?.toLowerCase() === cat.name.toLowerCase();

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      const next = isSelected ? null : cat.name;
                      setActiveCategory(next);
                      onSelectCategory?.(next);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? "bg-[#e5a93c] text-black font-semibold shadow-md"
                        : "bg-[#111111] border border-[#262626] text-[#8e8e93] hover:text-white hover:border-[#383838]"
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-[10px] opacity-75">({count})</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Dynamic Products Grid */}
        <section className="px-4 py-2">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => onSelectProduct?.(product)}
                  className="bg-[#0d0d0d] border border-[#202020] rounded-[18px] overflow-hidden flex flex-col transition-all duration-300 hover:border-[#383838] cursor-pointer group"
                >
                  {/* Image & Wishlist Button */}
                  <div className="relative w-full aspect-[1.18] bg-[#141414] overflow-hidden">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
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
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-[#e5a93c] hover:scale-110 active:scale-95 transition-all cursor-pointer z-10"
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
              <p className="text-white text-sm font-medium">No products found</p>
              <p className="text-[#8e8e93] text-xs mt-1">
                {activeCategory
                  ? `No products currently in "${activeCategory}".`
                  : "Add products in the /admin panel to view them here."}
              </p>
            </div>
          )}
        </section>

        {/* Luxury Footer */}
        <Footer
          onNavigateHome={onNavigateHome}
          onNavigateShop={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          onNavigateAccount={onNavigateAccount}
        />
      </div>

      {/* Categories Pop-Up Modal */}
      <CategoriesModal
        isOpen={isCategoriesOpen}
        onClose={() => setIsCategoriesOpen(false)}
        categories={categories}
        onSelectCategory={(catName) => {
          setActiveCategory(catName);
          onSelectCategory?.(catName);
        }}
      />

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#080808]/95 backdrop-blur-md border-t border-[#181818] flex justify-center pb-safe">
        <div className="w-full max-w-[440px] h-[64px] px-3 flex items-center justify-between relative">
          {/* 1. Home */}
          <Link
            href="/home"
            onClick={() => navigateToHome()}
            className="flex flex-col items-center justify-center flex-1 text-[#8e8e93] hover:text-white transition-colors gap-1 cursor-pointer"
          >
            <Home className="w-5 h-5" />
            <span className="text-[11px] font-normal">Home</span>
          </Link>

          {/* 2. Shop (ACTIVE) */}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex flex-col items-center justify-center flex-1 text-[#e5a93c] gap-1 cursor-pointer"
          >
            <ShoppingBag className="w-5 h-5 fill-[#e5a93c]" />
            <span className="text-[11px] font-medium">Shop</span>
          </button>

          {/* 3. Center Elevated Cart Button */}
          <div className="flex flex-col items-center justify-center flex-1 relative">
            <Link
              href="/cart"
              onClick={() => navigateToCart()}
              className="w-[52px] h-[52px] rounded-full bg-[#f0a939] hover:bg-[#f5b842] text-[#111111] flex items-center justify-center shadow-[0_4px_20px_rgba(240,169,57,0.4)] -translate-y-5 transition-transform active:scale-95 cursor-pointer relative"
            >
              <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#e11d48] text-white text-[10px] font-bold flex items-center justify-center border-2 border-black">
                  {cartCount}
                </span>
              )}
            </Link>
            <span className="text-[11px] text-[#8e8e93] -mt-4">Cart</span>
          </div>

          {/* 4. Categories */}
          <button
            type="button"
            onClick={() => setIsCategoriesOpen(true)}
            className="flex flex-col items-center justify-center flex-1 text-[#8e8e93] hover:text-[#e5a93c] transition-colors gap-1 cursor-pointer"
          >
            <Grid className="w-5 h-5" />
            <span className="text-[11px] font-normal">Categories</span>
          </button>

          {/* 5. Account */}
          <Link
            href="/account"
            onClick={() => navigateToAccount()}
            className="flex flex-col items-center justify-center flex-1 text-[#8e8e93] hover:text-white transition-colors gap-1 cursor-pointer"
          >
            <User className="w-5 h-5" />
            <span className="text-[11px] font-normal">Account</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
