"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  ShoppingCart,
  Layers,
  User,
  Calendar,
  ShieldCheck,
  CreditCard,
  Sparkles,
  Star,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ArrowLeft,
  Home,
  ShoppingBag,
  Grid,
  Lock,
} from "lucide-react";
import Footer from "@/components/Footer";
import CategoriesModal from "@/components/CategoriesModal";
import { Product, Category } from "@/lib/db";
import {
  addToCartByMode,
  toggleWishlistByMode,
  getWishlistItems,
  getCartCount,
} from "@/lib/cart";

interface ProductDetailsScreenProps {
  product?: Product | null;
  allProducts?: Product[];
  categories?: Category[];
  cartCount?: number;
  wishlist?: string[];
  storeMode?: "retail" | "wholesale";
  onSwitchStoreMode?: (mode: "retail" | "wholesale") => void;
  isWholesaleLoggedIn?: boolean;
  onOpenWholesaleLogin?: () => void;
  onToggleWishlist?: (productId: string) => void;
  onAddToCart?: (product: Product, quantity?: number) => void;
  onSelectProduct?: (product: Product) => void;
  onNavigateHome?: () => void;
  onNavigateShop?: () => void;
  onNavigateCart?: () => void;
  onNavigateAccount?: () => void;
  onSelectCategory?: (category: string | null) => void;
  onSignOut?: () => void;
  onBack?: () => void;
}

export default function ProductDetailsScreen({
  product: initialProduct = null,
  allProducts: initialAllProducts = [],
  categories: initialCategories = [],
  cartCount: initialCartCount = 0,
  wishlist: initialWishlist = [],
  storeMode = "retail",
  onSwitchStoreMode,
  isWholesaleLoggedIn = false,
  onOpenWholesaleLogin,
  onToggleWishlist,
  onAddToCart,
  onSelectProduct,
  onNavigateHome,
  onNavigateShop,
  onNavigateCart,
  onNavigateAccount,
  onSelectCategory,
  onSignOut,
  onBack,
}: ProductDetailsScreenProps) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(initialProduct);
  const [allProducts, setAllProducts] = useState<Product[]>(initialAllProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [cartCount, setCartCount] = useState<number>(initialCartCount);
  const [wishlist, setWishlist] = useState<string[]>(initialWishlist);
  const [quantity, setQuantity] = useState(1);
  const [isReviewsOpen, setIsReviewsOpen] = useState(true);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [loading, setLoading] = useState(!initialProduct);

  // Navigation helpers with fallbacks
  const navHome = () => (onNavigateHome ? onNavigateHome() : router.push("/home"));
  const navShop = () => (onNavigateShop ? onNavigateShop() : router.push("/shop"));
  const navCart = () => (onNavigateCart ? onNavigateCart() : router.push("/cart"));
  const navAccount = () => (onNavigateAccount ? onNavigateAccount() : router.push("/account"));

  // Load product from prop, localStorage, or query param / API
  useEffect(() => {
    if (initialProduct) {
      setProduct(initialProduct);
      setLoading(false);
    } else {
      let loadedFromLocal = false;
      let paramId: string | null = null;
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        paramId = urlParams.get("id");
      }

      try {
        if (paramId) {
          const cachedProds = localStorage.getItem("fc_cached_products");
          if (cachedProds) {
            const parsed = JSON.parse(cachedProds);
            if (Array.isArray(parsed)) {
              const matched = parsed.find((p: Product) => p.id === paramId);
              if (matched) {
                setProduct(matched);
                setAllProducts(parsed);
                setLoading(false);
                loadedFromLocal = true;
              }
            }
          }
        }
        if (!loadedFromLocal) {
          const saved = localStorage.getItem("fc_selected_product");
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.id) {
              setProduct(parsed);
              setLoading(false);
              loadedFromLocal = true;
            }
          }
        }
      } catch {}

      fetch("/api/products")
        .then((r) => r.json())
        .then((d) => {
          if (d.success && Array.isArray(d.products)) {
            setAllProducts(d.products);
            try {
              localStorage.setItem("fc_cached_products", JSON.stringify(d.products));
            } catch {}
            if (paramId) {
              const matched = d.products.find((p: Product) => p.id === paramId);
              if (matched) {
                setProduct(matched);
                try {
                  localStorage.setItem("fc_selected_product", JSON.stringify(matched));
                } catch {}
              }
            } else if (!loadedFromLocal && d.products.length > 0) {
              setProduct(d.products[0]);
              try {
                localStorage.setItem("fc_selected_product", JSON.stringify(d.products[0]));
              } catch {}
            }
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }

    // Ensure allProducts is populated
    if (initialAllProducts && initialAllProducts.length > 0) {
      setAllProducts(initialAllProducts);
    } else {
      fetch("/api/products")
        .then((r) => r.json())
        .then((d) => {
          if (d.success && Array.isArray(d.products)) {
            setAllProducts(d.products);
            try {
              localStorage.setItem("fc_cached_products", JSON.stringify(d.products));
            } catch {}
          }
        })
        .catch(console.error);
    }

    // Fetch categories if empty
    if (initialCategories && initialCategories.length > 0) {
      setCategories(initialCategories);
    } else {
      fetch("/api/categories", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => {
          if (d.success && Array.isArray(d.categories)) setCategories(d.categories);
        })
        .catch(console.error);
    }

    // Sync cart & wishlist from localStorage
    setCartCount(getCartCount(storeMode));
    setWishlist(getWishlistItems(storeMode));
  }, [initialProduct, initialAllProducts, initialCategories, storeMode]);

  // Wishlist handler for current product
  const handleToggleWishlist = () => {
    if (!product) return;
    onToggleWishlist?.(product.id);
    const { items, isAdded } = toggleWishlistByMode(storeMode, product.id);
    setWishlist(items);
    setNotification(
      isAdded
        ? `Added ${product.name} to ${storeMode === "wholesale" ? "Wholesale" : "Retail"} Wishlist`
        : `Removed ${product.name} from wishlist.`
    );
    setTimeout(() => setNotification(null), 2500);
  };

  // Add to cart handler for current product
  const handleAddToCart = () => {
    if (!product) return;
    if (storeMode === "wholesale" && !isWholesaleLoggedIn) {
      if (onOpenWholesaleLogin) onOpenWholesaleLogin();
      return;
    }

    const { items, effectivePrice } = addToCartByMode(product, storeMode, quantity);
    setCartCount(items.reduce((s, i) => s + i.quantity, 0));
    onAddToCart?.({ ...product, price: effectivePrice }, quantity);

    const noticeText =
      storeMode === "wholesale"
        ? `Added ${quantity} ${product.name} to Wholesale Cart! (₹${effectivePrice})`
        : `Added ${quantity} ${product.name} to Retail Cart! (₹${effectivePrice})`;
    setNotification(noticeText);
    setTimeout(() => setNotification(null), 3000);
  };

  // Quick Add to cart for recommended product
  const handleAddToCartForRelated = (p: Product, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (storeMode === "wholesale" && !isWholesaleLoggedIn) {
      if (onOpenWholesaleLogin) onOpenWholesaleLogin();
      return;
    }

    const { items, effectivePrice } = addToCartByMode(p, storeMode, 1);
    setCartCount(items.reduce((s, i) => s + i.quantity, 0));
    onAddToCart?.({ ...p, price: effectivePrice }, 1);

    const noticeText =
      storeMode === "wholesale"
        ? `Added ${p.name} to Wholesale Cart! (₹${effectivePrice})`
        : `Added ${p.name} to Retail Cart! (₹${effectivePrice})`;
    setNotification(noticeText);
    setTimeout(() => setNotification(null), 2500);
  };

  // Toggle wishlist for recommended product
  const handleToggleWishlistForRelated = (pId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    onToggleWishlist?.(pId);
    const { items, isAdded } = toggleWishlistByMode(storeMode, pId);
    setWishlist(items);
    setNotification(isAdded ? "Added to Wishlist" : "Removed from Wishlist");
    setTimeout(() => setNotification(null), 2000);
  };

  // Select related product and scroll smoothly to top
  const handleSelectRelated = (p: Product) => {
    setProduct(p);
    try {
      localStorage.setItem("fc_selected_product", JSON.stringify(p));
    } catch {
      // ignore
    }
    if (onSelectProduct) {
      onSelectProduct(p);
    } else {
      router.push(`/product?id=${p.id}`);
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#050505] text-white flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-10 h-10 border-2 border-[#e5a93c]/30 border-t-[#e5a93c] rounded-full animate-spin mb-4" />
        <p className="text-[#8e8e93] text-sm font-medium">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen w-full bg-[#050505] text-white flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-16 h-16 rounded-full bg-[#141109] border border-[#e5a93c] flex items-center justify-center text-[#e5a93c] mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-serif font-medium mb-2">No Product Selected</h2>
        <p className="text-[#8e8e93] text-sm mb-6 max-w-[280px]">
          Please select a product from our shop to view its wholesale details.
        </p>
        <button
          type="button"
          onClick={navShop}
          className="px-6 py-2.5 rounded-full bg-[#e5a93c] text-black font-semibold text-sm hover:bg-[#f5c767] transition-all cursor-pointer"
        >
          Go to Shop
        </button>
      </div>
    );
  }

  const isWishlist = wishlist.includes(product.id);

  // Recommendations: prioritize same category, then other items, up to 8 products
  const otherProducts = React.useMemo(() => {
    if (!product) return [];
    const available = allProducts.filter((p) => p.id !== product.id);
    const sameCat = available.filter(
      (p) => p.category && product.category && p.category.toLowerCase() === product.category.toLowerCase()
    );
    const diffCat = available.filter(
      (p) => !p.category || !product.category || p.category.toLowerCase() !== product.category.toLowerCase()
    );
    return [...sameCat, ...diffCat].slice(0, 8);
  }, [allProducts, product]);

  return (
    <div className="relative min-h-screen w-full bg-[#050505] text-white flex flex-col items-center justify-start pb-28 select-none">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-3 z-50 px-4 py-2 bg-[#1c160c] border border-[#e5a93c] text-[#f5c767] text-xs rounded-full shadow-2xl animate-fade-in">
          {notification}
        </div>
      )}

      {/* Responsive Main Container */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 space-y-8">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between py-2 border-b border-[#181818]">
          <button
            type="button"
            onClick={() => {
              if (onBack) {
                onBack();
              } else if (typeof window !== "undefined" && window.history.length > 1) {
                window.history.back();
              } else {
                navShop();
              }
            }}
            className="h-9 px-3 rounded-full bg-[#141414] border border-[#262626] flex items-center justify-center gap-2 text-white hover:text-[#e5a93c] transition-colors cursor-pointer text-xs font-medium"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <span className="text-xs sm:text-sm font-serif tracking-widest text-[#e5a93c] uppercase font-semibold">
            Fab Creations Luxury Jewellery
          </span>
          <button
            type="button"
            onClick={navCart}
            className="w-9 h-9 rounded-full bg-[#141414] border border-[#262626] flex items-center justify-center text-white hover:text-[#e5a93c] transition-colors cursor-pointer relative"
            title="View Cart"
          >
            <ShoppingCart className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#e11d48] text-white text-[9px] font-bold flex items-center justify-center border border-black">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* 2-Column Responsive Layout for Desktop & Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Image Showcase + Trust Badges (md:col-span-6 lg:col-span-5 md:sticky md:top-6 space-y-4) */}
          <div className="md:col-span-6 lg:col-span-5 space-y-4 md:sticky md:top-6">
            <div className="relative w-full aspect-[1.08] rounded-[24px] overflow-hidden border border-[#3a2c16] bg-[#0e0e0e] shadow-2xl">
              <Image
                src={product.image}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 500px"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/images/products/moon-necklace.jpg";
                }}
                className="object-cover hover:scale-105 transition-transform duration-500"
              />

              {/* Heart Wishlist Button */}
              <button
                onClick={handleToggleWishlist}
                className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-neutral-800 flex items-center justify-center text-[#e5a93c] hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-md"
              >
                <Heart
                  className={`w-4 h-4 ${
                    isWishlist ? "fill-[#e5a93c] text-[#e5a93c]" : "text-[#e5a93c]"
                  }`}
                />
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 rounded-[16px] bg-[#0d0d0d] border border-[#202020] flex flex-col items-center">
                <ShieldCheck className="w-5 h-5 text-[#e5a93c] mb-1" />
                <span className="text-white text-[11px] font-medium">100% Authentic</span>
                <span className="text-[#8e8e93] text-[9.5px]">Factory direct</span>
              </div>
              <div className="p-3 rounded-[16px] bg-[#0d0d0d] border border-[#202020] flex flex-col items-center">
                <Sparkles className="w-5 h-5 text-[#e5a93c] mb-1" />
                <span className="text-white text-[11px] font-medium">Anti Tarnish</span>
                <span className="text-[#8e8e93] text-[9.5px]">Long lasting</span>
              </div>
              <div className="p-3 rounded-[16px] bg-[#0d0d0d] border border-[#202020] flex flex-col items-center">
                <CreditCard className="w-5 h-5 text-[#e5a93c] mb-1" />
                <span className="text-white text-[11px] font-medium">Insured Shipping</span>
                <span className="text-[#8e8e93] text-[9.5px]">Safe delivery</span>
              </div>
            </div>
          </div>

          {/* Right Column: Product Specs, Pricing & Purchase Actions (md:col-span-6 lg:col-span-7 space-y-5) */}
          <div className="md:col-span-6 lg:col-span-7 space-y-5">
            {/* Breadcrumbs, Title, SKU, Rating */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-[#8e8e93]">
                <button
                  type="button"
                  onClick={navHome}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Home
                </button>
                <span>/</span>
                <button
                  type="button"
                  onClick={navShop}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Shop
                </button>
                <span>/</span>
                <span className="text-[#e5a93c] truncate max-w-[200px]">{product.name}</span>
              </div>

              <div className="flex items-start justify-between gap-3 pt-1">
                <h1 className="text-white text-2xl sm:text-3xl lg:text-4xl font-serif font-medium leading-tight tracking-tight">
                  {product.name}
                </h1>
                <span className="px-3 py-1 rounded-full bg-[#18140c] border border-[#4a3816] text-[#e5a93c] text-xs font-semibold shrink-0">
                  SKU: {product.sku}
                </span>
              </div>

              <p className="text-[#a0a0a0] text-sm">
                {product.subtitle || "Premium anti-tarnish waterproof stainless steel jewellery"}
              </p>

              {/* Rating */}
              <div className="flex items-center gap-2 pt-1">
                <div className="flex items-center text-[#e5a93c]">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating || 5)
                          ? "fill-[#e5a93c] text-[#e5a93c]"
                          : "text-[#555555]"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[#8e8e93] text-xs font-normal">
                  ({product.reviewsCount || 0} customer reviews)
                </span>
              </div>
            </div>

            {/* Price & Stock Card */}
            <div className="w-full rounded-[22px] border border-[#222222] bg-[#0d0d0d] p-5 flex items-center justify-between shadow-md">
              <div>
                <span className="text-[#8e8e93] text-xs block mb-1">
                  {storeMode === "wholesale" ? "B2B Wholesale Price" : "Retail Price"}
                </span>
                {storeMode === "wholesale" && !isWholesaleLoggedIn ? (
                  <button
                    type="button"
                    onClick={onOpenWholesaleLogin}
                    className="px-3 py-1.5 rounded-xl bg-[#1c160c] border border-[#e5a93c] text-[#e5a93c] hover:bg-[#e5a93c] hover:text-black transition-all text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-sm mt-1"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Login to View Wholesale Price</span>
                  </button>
                ) : (
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[#e5a93c] text-3xl font-bold tracking-tight">
                      ₹{storeMode === "wholesale" ? (product.wholesalePrice ?? product.price) : (product.retailPrice ?? product.price)}
                    </span>
                    <span className="text-[#8e8e93] text-xs">/ piece (incl. GST)</span>
                  </div>
                )}
              </div>

              <div className="text-right">
                <span className="text-[#8e8e93] text-xs block mb-1">Stock Status</span>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    product.stock > 0
                      ? "bg-emerald-950/60 border border-emerald-500/40 text-emerald-400"
                      : "bg-rose-950/60 border border-rose-500/40 text-rose-400"
                  }`}
                >
                  {product.stock > 0 ? `${product.stock} In Stock` : "Out of Stock"}
                </span>
              </div>
            </div>

            {/* Quantity Stepper & Add to Cart */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {/* Stepper */}
                <div className="flex items-center h-[52px] rounded-[16px] bg-[#0e0e0e] border border-[#262626] px-3.5 gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-8 h-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-white hover:text-[#e5a93c] transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-white text-base font-semibold min-w-[24px] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(product.stock || 99, q + 1))}
                    disabled={quantity >= (product.stock || 99)}
                    className="w-8 h-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-white hover:text-[#e5a93c] transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className="flex-1 h-[52px] rounded-[16px] bg-gradient-to-r from-[#e5a93c] to-[#f5c767] hover:opacity-95 active:scale-[0.99] text-[#111111] font-semibold text-base flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
                  <span>ADD TO CART</span>
                </button>
              </div>

              <p className="text-[#8e8e93] text-xs text-center sm:text-left">
                {storeMode === "wholesale"
                  ? "B2B Wholesale Channel: Minimum order value is ₹3,000 across cart."
                  : "Retail Store: No minimum order requirement. Free delivery on orders over ₹999."}
              </p>
            </div>

            {/* Product Specifications Table */}
            <div className="w-full bg-[#0d0d0d] border border-[#222222] rounded-[22px] overflow-hidden shadow-sm divide-y divide-[#1a1a1a]">
              <div className="px-5 py-3.5 flex items-center justify-between text-sm">
                <span className="text-[#8e8e93]">Material</span>
                <span className="text-white font-medium">{product.metal || "Stainless Steel (Anti-Tarnish)"}</span>
              </div>
              <div className="px-5 py-3.5 flex items-center justify-between text-sm">
                <span className="text-[#8e8e93]">Target Audience</span>
                <span className="text-white font-medium">{product.target || "Women / Unisex"}</span>
              </div>
              <div className="px-5 py-3.5 flex items-center justify-between text-sm">
                <span className="text-[#8e8e93]">Ideal Occasion</span>
                <span className="text-white font-medium">{product.occasion || "Daily Wear / Party"}</span>
              </div>
              <div className="px-5 py-3.5 flex items-center justify-between text-sm">
                <span className="text-[#8e8e93]">Jewellery Category</span>
                <span className="text-[#e5a93c] font-medium">{product.category}</span>
              </div>
            </div>
          </div>
        </div>

        {/* You May Also Like Section (Responsive Grid) */}
        {otherProducts.length > 0 && (
          <section className="pt-8 pb-4 border-t border-[#1a1a1a]">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 gap-2">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-[#e5a93c] uppercase font-semibold tracking-wider mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Curated For You</span>
                </div>
                <h3 className="text-white text-xl sm:text-2xl font-serif font-medium tracking-tight">
                  You May Also Like
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (onSelectCategory && product?.category) {
                    onSelectCategory(product.category);
                  }
                  navShop();
                }}
                className="text-[#e5a93c] text-xs sm:text-sm font-medium hover:text-[#f5c767] transition-colors flex items-center gap-1 self-start sm:self-auto cursor-pointer"
              >
                <span>View More in {product?.category || "Catalogue"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3.5 sm:gap-4 md:gap-6">
              {otherProducts.map((p) => {
                const isItemInWishlist = wishlist.includes(p.id);
                const displayPrice =
                  storeMode === "wholesale"
                    ? p.wholesalePrice ?? p.price
                    : p.retailPrice ?? p.price;

                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectRelated(p)}
                    className="bg-[#0d0d0d] border border-[#202020] rounded-[18px] overflow-hidden flex flex-col justify-between transition-all duration-300 hover:border-[#383838] cursor-pointer group shadow-sm"
                  >
                    {/* Image & Wishlist Button */}
                    <div className="relative w-full aspect-[1.18] bg-[#141414] overflow-hidden">
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 250px"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/images/products/moon-necklace.jpg";
                        }}
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Same Category Badge */}
                      {p.category && product?.category && p.category.toLowerCase() === product.category.toLowerCase() && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-sm border border-[#e5a93c]/40 text-[#f5c767] text-[10px] font-semibold tracking-wide">
                          {p.category}
                        </div>
                      )}

                      {/* Wishlist Button */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleWishlistForRelated(p.id, e)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-[#e5a93c] hover:scale-110 active:scale-95 transition-all z-10"
                        title={isItemInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            isItemInWishlist
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
                                  i < Math.floor(p.rating || 5)
                                    ? "fill-[#e5a93c] text-[#e5a93c]"
                                    : "text-[#555555]"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[#8e8e93] text-[11px]">
                            ({p.reviewsCount || 0})
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-white text-[14px] font-medium leading-snug tracking-tight mb-0.5 line-clamp-1 group-hover:text-[#e5a93c] transition-colors">
                          {p.name}
                        </h4>

                        {/* Subtitle */}
                        <p className="text-[#8e8e93] text-[11.5px] mb-2 font-normal line-clamp-1">
                          {p.subtitle || p.category}
                        </p>
                      </div>

                      {/* Price & Add to Cart */}
                      <div className="flex items-center justify-between pt-1 border-t border-[#181818]/60">
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
                            <span className="text-[#e5a93c] text-[15px] sm:text-[16px] font-semibold leading-tight">
                              ₹{displayPrice}
                            </span>
                            {storeMode === "wholesale" && (
                              <span className="text-[9px] text-[#8e8e93]">Wholesale</span>
                            )}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleAddToCartForRelated(p, e)}
                          className="px-2.5 py-1 rounded-full bg-[#1c160c] border border-[#e5a93c] text-[#e5a93c] hover:bg-[#e5a93c] hover:text-black transition-all text-xs font-medium cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Luxury Footer */}
        <Footer
          onNavigateHome={navHome}
          onNavigateShop={navShop}
          onNavigateAccount={navAccount}
        />
      </div>

      {/* Categories Pop-Up Modal */}
      <CategoriesModal
        isOpen={isCategoriesOpen}
        onClose={() => setIsCategoriesOpen(false)}
        categories={categories}
        onSelectCategory={(catName) => {
          onSelectCategory?.(catName);
          navShop();
        }}
      />

      {/* Bottom Navigation Bar (Mobile Only: hidden on md:) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080808]/95 backdrop-blur-md border-t border-[#181818] flex justify-center pb-safe">
        <div className="w-full max-w-[440px] h-[64px] px-3 flex items-center justify-between relative">
          {/* Home */}
          <button
            type="button"
            onClick={navHome}
            className="flex flex-col items-center justify-center flex-1 text-[#8e8e93] hover:text-white transition-colors gap-1 cursor-pointer"
          >
            <Home className="w-5 h-5" />
            <span className="text-[11px] font-normal">Home</span>
          </button>

          {/* Shop */}
          <button
            type="button"
            onClick={navShop}
            className="flex flex-col items-center justify-center flex-1 text-[#8e8e93] hover:text-white transition-colors gap-1 cursor-pointer"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[11px] font-normal">Shop</span>
          </button>

          {/* Elevated Center Cart Button */}
          <div className="flex flex-col items-center justify-center flex-1 relative">
            <button
              type="button"
              onClick={navCart}
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
            onClick={navAccount}
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
