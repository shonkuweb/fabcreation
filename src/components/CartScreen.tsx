"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Trash2,
  Truck,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Home,
  Grid,
  User,
  Check,
  CheckCircle,
} from "lucide-react";
import CategoriesModal from "@/components/CategoriesModal";
import type { OrderItem, Category } from "@/lib/db";

interface CartScreenProps {
  cart?: OrderItem[];
  userMobile?: string;
  categories?: Category[];
  onUpdateQuantity?: (id: string, quantity: number) => void;
  onRemoveItem?: (id: string) => void;
  onClearCart?: () => void;
  onNavigateHome?: () => void;
  onNavigateShop?: () => void;
  onNavigateAccount?: () => void;
  onSelectCategory?: (category: string | null) => void;
  onSignOut?: () => void;
}

export default function CartScreen({
  cart: initialCart = [],
  userMobile = "6289417338",
  categories: initialCategories = [],
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onNavigateHome,
  onNavigateShop,
  onNavigateAccount,
  onSelectCategory,
  onSignOut,
}: CartScreenProps) {
  const router = useRouter();
  const [cart, setCart] = useState<OrderItem[]>(initialCart);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  // Sync with prop or load from localStorage
  useEffect(() => {
    if (initialCart && initialCart.length > 0) {
      setCart(initialCart);
      setSelectedItems(initialCart.map((i) => i.id));
    } else {
      try {
        const saved = localStorage.getItem("fc_b2b_cart");
        if (saved) {
          const parsed = JSON.parse(saved);
          setCart(parsed);
          setSelectedItems(parsed.map((i: OrderItem) => i.id));
        }
      } catch {
        // ignore
      }
    }
  }, [initialCart]);

  // Fetch categories if not provided
  useEffect(() => {
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
  }, [initialCategories]);

  // Navigation helpers with fallback
  const navHome = () => {
    if (onNavigateHome) onNavigateHome();
    else router.push("/home");
  };

  const navShop = () => {
    if (onNavigateShop) onNavigateShop();
    else router.push("/shop");
  };

  const navAccount = () => {
    if (onNavigateAccount) onNavigateAccount();
    else router.push("/account");
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Subtotal of all items
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const gst = Number((subtotal * 0.03).toFixed(1));
  const shipping = cart.length > 0 ? 125 : 0;
  const total = Number((subtotal + gst + shipping).toFixed(1));
  const b2bMin = 3000;
  const remaining = Math.max(0, b2bMin - subtotal);
  const progressPercent = Math.min(100, Math.max(3, (subtotal / b2bMin) * 100));

  const toggleSelectItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleUpdateQty = (id: string, qty: number) => {
    onUpdateQuantity?.(id, qty);
    setCart((prev) => {
      let updated: OrderItem[];
      if (qty <= 0) {
        updated = prev.filter((i) => i.id !== id);
      } else {
        updated = prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i));
      }
      try {
        localStorage.setItem("fc_b2b_cart", JSON.stringify(updated));
        window.dispatchEvent(new Event("cart_updated"));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleRemove = (id: string) => {
    onRemoveItem?.(id);
    setCart((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      try {
        localStorage.setItem("fc_b2b_cart", JSON.stringify(updated));
        window.dispatchEvent(new Event("cart_updated"));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleCheckout = async () => {
    if (subtotal < b2bMin) {
      setNotification(`Minimum B2B order is ₹3,000. Please add ₹${remaining} more.`);
      setTimeout(() => setNotification(null), 3500);
      return;
    }

    const activeMobile = userMobile || (typeof window !== "undefined" ? localStorage.getItem("fc_user_mobile") : null) || "6289417338";

    setIsCheckingOut(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerMobile: activeMobile,
          items: cart,
          subtotal,
          gst,
          shipping,
          total,
        }),
      });

      const data = await res.json();
      if (data.success && data.order) {
        setCart([]);
        try {
          localStorage.removeItem("fc_b2b_cart");
          window.dispatchEvent(new Event("cart_updated"));
        } catch {
          // ignore
        }
        onClearCart?.();
        setOrderSuccess(data.order.orderNumber);
        setNotification(`Order placed successfully! Order #${data.order.orderNumber}`);
        setTimeout(() => {
          router.push("/account");
        }, 2000);
      } else {
        setNotification(data.message || "Failed to place order. Please try again.");
      }
    } catch (err) {
      console.error("Checkout request failed:", err);
      setNotification("Checkout request failed. Please check connection and try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#050505] text-white flex flex-col items-center justify-start pb-28 select-none">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-3 z-50 px-4 py-2 bg-[#1c160c] border border-[#e5a93c] text-[#f5c767] text-xs rounded-full shadow-2xl animate-fade-in">
          {notification}
        </div>
      )}

      {/* Mobile Frame Container */}
      <div className="w-full max-w-[440px] flex flex-col px-4">
        {/* Top Announcement Bar */}
        <div className="w-full -mx-4 py-2 bg-[#000000] border-b border-[#141414] text-center mb-3">
          <p className="text-[#e5a93c] text-[12.5px] font-medium tracking-wide">
            B2B Minimum Order: Rs 3000
          </p>
        </div>

        {/* Top Header Bar */}
        <div className="flex items-center justify-between py-2 mb-3">
          <Link
            href="/shop"
            className="w-9 h-9 rounded-full bg-[#141414] border border-[#262626] flex items-center justify-center text-white hover:text-[#e5a93c] transition-colors cursor-pointer"
            title="Continue Shopping"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-base font-serif font-medium text-white">Your Cart</h1>
          <button
            onClick={onClearCart}
            disabled={cart.length === 0}
            className="text-xs text-[#8e8e93] hover:text-rose-400 transition-colors disabled:opacity-0 cursor-pointer px-1"
          >
            Clear
          </button>
        </div>

        {/* Order Success Banner */}
        {orderSuccess && (
          <div className="mb-4 p-4 rounded-[18px] bg-emerald-950/60 border border-emerald-500/40 text-center animate-fade-in">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <h4 className="text-white text-base font-medium">Order Placed Successfully!</h4>
            <p className="text-emerald-300 text-xs mt-1">
              Order #{orderSuccess} has been confirmed. Redirecting to your account...
            </p>
          </div>
        )}

        {/* 1. Cart Items List or Empty State */}
        {cart.length > 0 ? (
          <div className="space-y-3 mb-4">
            {cart.map((item) => (
              <div
                key={item.id}
                className="w-full bg-[#0d0d0d] border border-[#222222] rounded-[18px] p-3.5 shadow-md flex items-center gap-3.5"
              >
                {/* Left Thumbnail */}
                <div className="relative w-[78px] h-[78px] rounded-xl overflow-hidden bg-[#141414] shrink-0 border border-[#1f1f1f]">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    unoptimized
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/products/moon-necklace.jpg";
                    }}
                    className="object-cover"
                  />
                </div>

                {/* Right Details */}
                <div className="flex-1 flex flex-col justify-between h-[78px]">
                  {/* Row 1: Checkbox + Title + Trash */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {/* Custom Checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleSelectItem(item.id)}
                        className={`w-[18px] h-[18px] rounded-[5px] flex items-center justify-center transition-all cursor-pointer ${
                          selectedItems.includes(item.id)
                            ? "bg-[#e5a93c] text-black"
                            : "border border-[#444444] bg-[#111111]"
                        }`}
                      >
                        {selectedItems.includes(item.id) && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>

                      <h3 className="text-white text-[14px] font-medium leading-tight max-w-[170px] truncate">
                        {item.name}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      className="text-[#8e8e93] hover:text-rose-400 p-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Row 2: Price + Quantity Stepper */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[#e5a93c] text-[16px] font-semibold">
                      ₹{item.price}
                    </span>

                    {/* Stepper */}
                    <div className="flex items-center h-[32px] rounded-[10px] bg-[#141414] border border-[#2a2a2a] px-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.id, Math.max(1, item.quantity - 1))}
                        className="text-[#8e8e93] hover:text-white text-xs font-bold px-1 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-white text-xs font-semibold min-w-[14px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                        className="text-[#8e8e93] hover:text-white text-xs font-bold px-1 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full bg-[#0d0d0d] border border-[#222222] rounded-[24px] p-8 sm:p-10 flex flex-col items-center text-center shadow-lg relative overflow-hidden mb-4">
            <div className="w-20 h-20 rounded-full bg-[#171207] border border-[#e5a93c]/50 flex items-center justify-center text-[#e5a93c] mb-5 shadow-[0_0_20px_rgba(229,169,60,0.2)]">
              <ShoppingBag className="w-9 h-9 stroke-[1.8]" />
            </div>
            <h3 className="text-white text-[20px] font-serif font-medium mb-1.5">
              Your Cart is Empty
            </h3>
            <p className="text-[#8e8e93] text-[13px] max-w-[260px] mb-6">
              Add wholesale jewelry items to your cart to meet the ₹3,000 B2B minimum.
            </p>
            <Link
              href="/shop"
              className="w-full h-[46px] rounded-[13px] bg-[#141109] border border-[#e5a93c] hover:bg-[#e5a93c] hover:text-black text-[#e5a93c] font-medium text-[13.5px] flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Browse Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* 2. Order Summary Card (Only if cart has items) */}
        {cart.length > 0 && (
          <div className="w-full bg-[#0d0d0d] border border-[#222222] rounded-[22px] p-4 sm:p-5 mb-4 shadow-md space-y-3">
            <h4 className="text-white text-[15.5px] font-serif font-medium pb-1 border-b border-[#1c1c1c]">
              Order Summary
            </h4>

            <div className="space-y-2 text-[13.5px]">
              <div className="flex items-center justify-between text-[#8e8e93]">
                <span>Items Subtotal</span>
                <span className="text-white font-medium">₹{subtotal.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between text-[#8e8e93]">
                <span>GST (3%)</span>
                <span className="text-white font-medium">₹{gst.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between text-[#8e8e93]">
                <span>Shipping</span>
                <span className="text-white font-medium">₹{shipping.toFixed(1)}</span>
              </div>
              <div className="pt-2 border-t border-[#1c1c1c] flex items-center justify-between text-[15px]">
                <span className="text-white font-semibold">Total</span>
                <span className="text-[#e5a93c] text-[18px] font-bold">₹{total.toFixed(1)}</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. B2B Shipping Information Box (Only if cart has items) */}
        {cart.length > 0 && (
          <div className="w-full rounded-[18px] border border-[#4a3816] bg-[#140f07] p-3.5 mb-4 flex items-start gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-[#1e170a] border border-[#e5a93c]/40 flex items-center justify-center text-[#e5a93c] shrink-0 mt-0.5">
              <Truck className="w-4 h-4 text-[#e5a93c]" />
            </div>
            <div className="flex-1">
              <h5 className="text-[#e5a93c] text-[13px] font-semibold mb-0.5">
                B2B Shipping Information
              </h5>
              <p className="text-[#a8a8a8] text-[11.5px] leading-relaxed">
                Standard B2B shipping is ₹125 for all orders. Free shipping on orders above ₹10,000. Orders are dispatched within 24-48 business hours with GST invoice.
              </p>
            </div>
          </div>
        )}

        {/* 4. Minimum Order Progress Bar & Action (Only if cart has items) */}
        {cart.length > 0 && (
          <div className="w-full bg-[#0d0d0d] border border-[#222222] rounded-[22px] p-4 sm:p-5 mb-4 shadow-md space-y-3.5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8e8e93]">B2B Order Minimum Progress</span>
                <span className="text-[#e5a93c] font-semibold">₹{subtotal} / ₹3,000</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#1c1c1c] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#d99726] to-[#f5c767] rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {subtotal < b2bMin ? (
                <p className="text-[#8e8e93] text-[11.5px]">
                  Add <span className="text-[#e5a93c] font-semibold">₹{remaining}</span> more to meet wholesale minimum.
                </p>
              ) : (
                <p className="text-emerald-400 text-[11.5px] font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Wholesale minimum met! Ready to order.</span>
                </p>
              )}
            </div>

            {/* Proceed to Checkout Button */}
            <button
              type="button"
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className={`w-full h-[50px] rounded-[14px] font-semibold text-[14.5px] flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                subtotal >= b2bMin
                  ? "bg-[#f0a939] hover:bg-[#f5b842] active:scale-[0.99] text-[#111111]"
                  : "bg-[#1c160c] border border-[#e5a93c]/50 text-[#e5a93c] hover:bg-[#e5a93c] hover:text-black"
              }`}
            >
              {isCheckingOut ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span>Placing B2B Order...</span>
                </div>
              ) : (
                <>
                  <span>PROCEED TO CHECKOUT</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Categories Pop-Up Modal */}
      <CategoriesModal
        isOpen={isCategoriesOpen}
        onClose={() => setIsCategoriesOpen(false)}
        categories={categories}
        onSelectCategory={(catName) => {
          if (onSelectCategory) {
            onSelectCategory(catName);
          } else {
            navShop();
          }
        }}
      />

      {/* Fixed Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#080808]/95 backdrop-blur-md border-t border-[#181818] flex justify-center pb-safe">
        <div className="w-full max-w-[440px] h-[64px] px-3 flex items-center justify-between relative">
          {/* 1. Home */}
          <Link
            href="/home"
            prefetch={true}
            className="flex flex-col items-center justify-center flex-1 text-[#8e8e93] hover:text-white transition-colors gap-1 cursor-pointer"
          >
            <Home className="w-5 h-5" />
            <span className="text-[11px] font-normal">Home</span>
          </Link>

          {/* 2. Shop */}
          <Link
            href="/shop"
            prefetch={true}
            className="flex flex-col items-center justify-center flex-1 text-[#8e8e93] hover:text-white transition-colors gap-1 cursor-pointer"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[11px] font-normal">Shop</span>
          </Link>

          {/* 3. Center Elevated Cart Button (ACTIVE) */}
          <div className="flex flex-col items-center justify-center flex-1 relative">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="w-[52px] h-[52px] rounded-full bg-[#f0a939] hover:bg-[#f5b842] text-[#111111] flex items-center justify-center shadow-[0_4px_20px_rgba(240,169,57,0.4)] -translate-y-5 transition-transform active:scale-95 cursor-pointer relative"
            >
              <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#e11d48] text-white text-[10px] font-bold flex items-center justify-center border-2 border-black">
                  {cartCount}
                </span>
              )}
            </button>
            <span className="text-[11px] text-[#e5a93c] font-medium -mt-4">Cart</span>
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
            prefetch={true}
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
