"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
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
} from "lucide-react";
import Footer from "@/components/Footer";
import CategoriesModal from "@/components/CategoriesModal";
import { Product, Category } from "@/lib/db";

interface ProductDetailsScreenProps {
  product?: Product | null;
  allProducts?: Product[];
  categories?: Category[];
  cartCount?: number;
  wishlist?: string[];
  onToggleWishlist?: (productId: string) => void;
  onAddToCart?: (product: Product, quantity?: number) => void;
  onSelectProduct?: (product: Product) => void;
  onNavigateHome?: () => void;
  onNavigateShop?: () => void;
  onNavigateCart?: () => void;
  onNavigateAccount?: () => void;
  onSelectCategory?: (category: string | null) => void;
  onSignOut?: () => void;
}

export default function ProductDetailsScreen({
  product: initialProduct = null,
  allProducts: initialAllProducts = [],
  categories: initialCategories = [],
  cartCount: initialCartCount = 0,
  wishlist: initialWishlist = [],
  onToggleWishlist,
  onAddToCart,
  onSelectProduct,
  onNavigateHome,
  onNavigateShop,
  onNavigateCart,
  onNavigateAccount,
  onSelectCategory,
  onSignOut,
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
      try {
        const saved = localStorage.getItem("fc_selected_product");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.id) {
            setProduct(parsed);
            loadedFromLocal = true;
          }
        }
      } catch {
        // ignore
      }

      // Check URL query param ?id=
      let paramId: string | null = null;
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        paramId = urlParams.get("id");
      }

      fetch("/api/products", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => {
          if (d.success && Array.isArray(d.products)) {
            setAllProducts(d.products);
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
    try {
      const savedCart = localStorage.getItem("fc_b2b_cart");
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        setCartCount(parsed.reduce((s: number, i: any) => s + (i.quantity || 1), 0));
      }
      const savedWishlist = localStorage.getItem("fc_b2b_wishlist");
      if (savedWishlist) {
        setWishlist(JSON.parse(savedWishlist));
      }
    } catch {
      // ignore
    }
  }, [initialProduct, initialCategories]);

  // Wishlist handler
  const handleToggleWishlist = () => {
    if (!product) return;
    onToggleWishlist?.(product.id);
    const isWishlist = wishlist.includes(product.id);
    const updated = isWishlist
      ? wishlist.filter((id) => id !== product.id)
      : [...wishlist, product.id];
    setWishlist(updated);
    try {
      localStorage.setItem("fc_b2b_wishlist", JSON.stringify(updated));
      window.dispatchEvent(new Event("wishlist_updated"));
    } catch {
      // ignore
    }
    setNotification(
      isWishlist
        ? `Removed ${product.name} from wishlist.`
        : `Added ${product.name} to wishlist!`
    );
    setTimeout(() => setNotification(null), 2500);
  };

  // Add to cart handler
  const handleAddToCart = () => {
    if (!product) return;
    if (onAddToCart) {
      onAddToCart(product, quantity);
    } else {
      try {
        const saved = localStorage.getItem("fc_b2b_cart");
        const cart = saved ? JSON.parse(saved) : [];
        const existing = cart.find((i: any) => i.id === product.id);
        let updated;
        if (existing) {
          updated = cart.map((i: any) =>
            i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
          );
        } else {
          updated = [
            ...cart,
            {
              id: product.id,
              name: product.name,
              price: product.price,
              quantity,
              image: product.image,
            },
          ];
        }
        localStorage.setItem("fc_b2b_cart", JSON.stringify(updated));
        setCartCount(updated.reduce((s: number, i: any) => s + i.quantity, 0));
        window.dispatchEvent(new Event("cart_updated"));
      } catch {
        // ignore
      }
    }
    setNotification(`Added ${quantity} ${product.name} to cart! (B2B Min: Rs 3000)`);
    setTimeout(() => setNotification(null), 3000);
  };

  // Select related product
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
          onClick={navShop}
          className="px-6 py-2.5 rounded-full bg-[#e5a93c] text-black font-semibold text-sm hover:bg-[#f5c767] transition-all cursor-pointer"
        >
          Go to Shop
        </button>
      </div>
    );
  }

  const isWishlist = wishlist.includes(product.id);
  const otherProducts = allProducts.filter((p) => p.id !== product.id).slice(0, 2);

  return (
    <div className="relative min-h-screen w-full bg-[#050505] text-white flex flex-col items-center justify-start pb-28 select-none">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-3 z-50 px-4 py-2 bg-[#1c160c] border border-[#e5a93c] text-[#f5c767] text-xs rounded-full shadow-2xl animate-fade-in">
          {notification}
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-[440px] flex flex-col px-4 pt-3 space-y-4">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between py-1">
          <button
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                window.history.back();
              } else {
                navShop();
              }
            }}
            className="w-9 h-9 rounded-full bg-[#141414] border border-[#262626] flex items-center justify-center text-white hover:text-[#e5a93c] transition-colors cursor-pointer"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-serif tracking-widest text-[#e5a93c] uppercase">Fab Creations</span>
          <button
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

        {/* 1. Big Image Showcase */}
        <div className="relative w-full aspect-[1.12] rounded-[24px] overflow-hidden border border-[#3a2c16] bg-[#0e0e0e] shadow-lg">
          <Image
            src={product.image}
            alt={product.name}
            fill
            priority
            unoptimized
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/images/products/moon-necklace.jpg";
            }}
            className="object-cover"
          />

          {/* Heart Wishlist Button */}
          <button
            onClick={handleToggleWishlist}
            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm border border-neutral-800 flex items-center justify-center text-[#e5a93c] hover:scale-110 active:scale-95 transition-all cursor-pointer"
          >
            <Heart
              className={`w-4 h-4 ${
                isWishlist ? "fill-[#e5a93c] text-[#e5a93c]" : "text-[#e5a93c]"
              }`}
            />
          </button>
        </div>

        {/* 2. Breadcrumbs, Title, SKU, Rating */}
        <div className="space-y-1.5">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-[11px] text-[#8e8e93]">
            <button
              onClick={navHome}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Home
            </button>
            <span>/</span>
            <button
              onClick={navShop}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Shop
            </button>
            <span>/</span>
            <span className="text-[#e5a93c]">{product.category}</span>
          </div>

          {/* Title & SKU */}
          <div className="flex items-start justify-between gap-3 pt-1">
            <h1 className="text-white text-[24px] font-serif font-medium leading-tight tracking-tight">
              {product.name}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#18140c] border border-[#4a3816] text-[#e5a93c] text-[11px] font-semibold shrink-0">
              SKU: {product.sku}
            </span>
          </div>

          {/* Subtitle */}
          <p className="text-[#8e8e93] text-[13px]">
            {product.subtitle || "Anti tarnish premium quality"}
          </p>

          {/* Rating Stars & Reviews */}
          <div className="flex items-center gap-2 pt-1">
            <div className="flex items-center text-[#e5a93c]">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < Math.floor(product.rating || 5)
                      ? "fill-[#e5a93c] text-[#e5a93c]"
                      : "text-[#555555]"
                  }`}
                />
              ))}
            </div>
            <span className="text-[#8e8e93] text-xs font-normal">
              ({product.reviewsCount || 0} reviews)
            </span>
          </div>
        </div>

        {/* 3. Price & Stock Details */}
        <div className="w-full rounded-[20px] border border-[#222222] bg-[#0d0d0d] p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[#8e8e93] text-xs block mb-0.5">B2B Wholesale Price</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[#e5a93c] text-[26px] font-bold tracking-tight">
                ₹{product.price}
              </span>
              <span className="text-[#8e8e93] text-xs">/ piece</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[#8e8e93] text-xs block mb-0.5">Availability</span>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                product.stock > 0
                  ? "bg-emerald-950/60 border border-emerald-500/40 text-emerald-400"
                  : "bg-rose-950/60 border border-rose-500/40 text-rose-400"
              }`}
            >
              {product.stock > 0 ? `${product.stock} In Stock` : "Out of Stock"}
            </span>
          </div>
        </div>

        {/* 4. Quantity Stepper & Add to Cart */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {/* Quantity Stepper */}
            <div className="flex items-center h-[50px] rounded-[14px] bg-[#0e0e0e] border border-[#262626] px-3 gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-7 h-7 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-white hover:text-[#e5a93c] transition-colors disabled:opacity-40 cursor-pointer"
              >
                -
              </button>
              <span className="text-white text-[15px] font-semibold min-w-[20px] text-center">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(product.stock || 99, q + 1))}
                disabled={quantity >= (product.stock || 99)}
                className="w-7 h-7 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-white hover:text-[#e5a93c] transition-colors disabled:opacity-40 cursor-pointer"
              >
                +
              </button>
            </div>

            {/* Add to Cart Button */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className="flex-1 h-[50px] rounded-[14px] bg-[#f0a939] hover:bg-[#f5b842] active:scale-[0.99] text-[#111111] font-semibold text-[15px] flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <ShoppingCart className="w-4 h-4 stroke-[2.2]" />
              <span>ADD TO CART</span>
            </button>
          </div>

          <p className="text-[#8e8e93] text-[11.5px] text-center">
            Wholesale minimum order requirement: ₹3,000 across cart.
          </p>
        </div>

        {/* 5. Product Attributes Table */}
        <div className="w-full bg-[#0d0d0d] border border-[#222222] rounded-[20px] overflow-hidden shadow-sm divide-y divide-[#1a1a1a]">
          <div className="px-4 py-3 flex items-center justify-between text-[13px]">
            <span className="text-[#8e8e93]">Metal</span>
            <span className="text-white font-medium">{product.metal || "Stainless Steel"}</span>
          </div>
          <div className="px-4 py-3 flex items-center justify-between text-[13px]">
            <span className="text-[#8e8e93]">Target</span>
            <span className="text-white font-medium">{product.target || "Women"}</span>
          </div>
          <div className="px-4 py-3 flex items-center justify-between text-[13px]">
            <span className="text-[#8e8e93]">Occasion</span>
            <span className="text-white font-medium">{product.occasion || "Daily Wear"}</span>
          </div>
          <div className="px-4 py-3 flex items-center justify-between text-[13px]">
            <span className="text-[#8e8e93]">Category</span>
            <span className="text-[#e5a93c] font-medium">{product.category}</span>
          </div>
        </div>

        {/* 6. Trust Badges */}
        <div className="grid grid-cols-3 gap-2 text-center">
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
            <span className="text-white text-[11px] font-medium">Secure B2B</span>
            <span className="text-[#8e8e93] text-[9.5px]">Verified orders</span>
          </div>
        </div>

        {/* 7. "You May Also Like" (Dynamic from other products) */}
        {otherProducts.length > 0 && (
          <section className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white text-[18px] font-serif font-medium tracking-tight">
                You May Also Like
              </h3>
              <button
                onClick={navShop}
                className="text-[#e5a93c] text-xs font-medium hover:text-[#f5c767] transition-colors"
              >
                View More
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {otherProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSelectRelated(p)}
                  className="bg-[#0d0d0d] border border-[#202020] rounded-[18px] overflow-hidden p-3 flex flex-col justify-between cursor-pointer group hover:border-[#383838] transition-all"
                >
                  <div className="relative w-full aspect-[1.18] rounded-xl overflow-hidden mb-2 bg-[#141414]">
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      unoptimized
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/products/moon-necklace.jpg";
                      }}
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div>
                    <h4 className="text-white text-[13.5px] font-medium truncate mb-0.5">
                      {p.name}
                    </h4>
                    <p className="text-[#8e8e93] text-[11px] truncate mb-2">
                      {p.subtitle || p.category}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[#e5a93c] text-[15px] font-semibold">
                        ₹{p.price}
                      </span>
                      <span className="text-xs text-[#8e8e93] group-hover:text-white transition-colors">
                        View →
                      </span>
                    </div>
                  </div>
                </div>
              ))}
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

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#080808]/95 backdrop-blur-md border-t border-[#181818] flex justify-center pb-safe">
        <div className="w-full max-w-[440px] h-[64px] px-3 flex items-center justify-between relative">
          {/* Home */}
          <button
            onClick={navHome}
            className="flex flex-col items-center justify-center flex-1 text-[#8e8e93] hover:text-white transition-colors gap-1 cursor-pointer"
          >
            <Home className="w-5 h-5" />
            <span className="text-[11px] font-normal">Home</span>
          </button>

          {/* Shop */}
          <button
            onClick={navShop}
            className="flex flex-col items-center justify-center flex-1 text-[#8e8e93] hover:text-white transition-colors gap-1 cursor-pointer"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[11px] font-normal">Shop</span>
          </button>

          {/* Elevated Center Cart Button */}
          <div className="flex flex-col items-center justify-center flex-1 relative">
            <button
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
            onClick={() => setIsCategoriesOpen(true)}
            className="flex flex-col items-center justify-center flex-1 text-[#8e8e93] hover:text-[#e5a93c] transition-colors gap-1 cursor-pointer"
          >
            <Grid className="w-5 h-5" />
            <span className="text-[11px] font-normal">Categories</span>
          </button>

          {/* Account */}
          <button
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
