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
  Plus,
  Sparkles,
} from "lucide-react";
import CategoriesModal from "@/components/CategoriesModal";
import StoreModeToggle from "@/components/StoreModeToggle";
import RetailLoginModal from "@/components/RetailLoginModal";
import type { OrderItem, Category, Product } from "@/lib/db";
import {
  getCartItems,
  getCartCount,
  updateCartQtyByMode,
  removeFromCartByMode,
  clearCartByMode,
  fetchCartFromServer,
  addToCartByMode,
} from "@/lib/cart";

interface CartScreenProps {
  cart?: OrderItem[];
  userMobile?: string;
  categories?: Category[];
  products?: Product[];
  storeMode?: "retail" | "wholesale";
  onSwitchStoreMode?: (mode: "retail" | "wholesale") => void;
  isWholesaleLoggedIn?: boolean;
  onOpenWholesaleLogin?: () => void;
  onUpdateQuantity?: (id: string, quantity: number) => void;
  onRemoveItem?: (id: string) => void;
  onClearCart?: () => void;
  onNavigateHome?: () => void;
  onNavigateShop?: () => void;
  onNavigateAccount?: () => void;
  onSelectCategory?: (category: string | null) => void;
  onSelectProduct?: (product: Product) => void;
  onSignOut?: () => void;
}

export default function CartScreen({
  cart: initialCart = [],
  userMobile = "6289417338",
  categories: initialCategories = [],
  products: initialProducts = [],
  storeMode = "retail",
  onSwitchStoreMode,
  isWholesaleLoggedIn = false,
  onOpenWholesaleLogin,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onNavigateHome,
  onNavigateShop,
  onNavigateAccount,
  onSelectCategory,
  onSelectProduct,
  onSignOut,
}: CartScreenProps) {
  const router = useRouter();
  const [activeCartMode, setActiveCartMode] = useState<"retail" | "wholesale">(storeMode);
  const [cart, setCart] = useState<OrderItem[]>(() => getCartItems(storeMode));
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [isRetailLoginOpen, setIsRetailLoginOpen] = useState(false);

  // Sync activeCartMode when storeMode prop changes
  useEffect(() => {
    setActiveCartMode(storeMode);
  }, [storeMode]);

  // Load cart items for active mode from database & local cache
  useEffect(() => {
    const items = getCartItems(activeCartMode);
    setCart(items);
    setSelectedItems(items.map((i) => i.id));

    fetchCartFromServer(activeCartMode)
      .then((serverItems) => {
        setCart(serverItems);
        setSelectedItems(serverItems.map((i) => i.id));
      })
      .catch(console.error);

    const handleCartUpdate = (e?: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (!detail?.mode || detail.mode === activeCartMode) {
        const updated = getCartItems(activeCartMode);
        setCart(updated);
        setSelectedItems(updated.map((i) => i.id));
      }
    };

    window.addEventListener("cart_updated", handleCartUpdate);
    return () => window.removeEventListener("cart_updated", handleCartUpdate);
  }, [activeCartMode]);

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

  // Load products for 'You May Also Like' recommendations
  const [allProducts, setAllProducts] = useState<Product[]>(initialProducts);

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setAllProducts(initialProducts);
    } else {
      fetch("/api/products", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => {
          if (d.success && Array.isArray(d.products)) {
            setAllProducts(d.products);
          }
        })
        .catch(console.error);
    }
  }, [initialProducts]);

  const cartProductIds = React.useMemo(() => new Set(cart.map((i) => i.id)), [cart]);

  const recommendedProducts = React.useMemo(() => {
    return allProducts
      .filter((p) => {
        if (cartProductIds.has(p.id)) return false;
        if (activeCartMode === "wholesale") {
          return p.channel === "wholesale" || p.channel === "both" || !p.channel;
        }
        return p.channel === "retail" || p.channel === "both" || !p.channel;
      })
      .slice(0, 4);
  }, [allProducts, cartProductIds, activeCartMode]);

  const handleQuickAdd = (p: Product) => {
    const { items, effectivePrice } = addToCartByMode(p, activeCartMode, 1);
    setCart(items);
    setNotification(`Added ${p.name} to cart! (₹${effectivePrice})`);
    setTimeout(() => setNotification(null), 2500);
  };

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
  const retailCount = getCartCount("retail");
  const wholesaleCount = getCartCount("wholesale");

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
    const updated = updateCartQtyByMode(activeCartMode, id, qty);
    setCart(updated);
    onUpdateQuantity?.(id, qty);
  };

  const handleRemove = (id: string) => {
    const updated = removeFromCartByMode(activeCartMode, id);
    setCart(updated);
    onRemoveItem?.(id);
  };

  const handleClearActiveCart = () => {
    clearCartByMode(activeCartMode);
    setCart([]);
    onClearCart?.();
  };

  const handleCheckout = async (overrideIdentifier?: string) => {
    // 1. Retail Login Check: Must be logged in before checking out from retail store
    if (activeCartMode === "retail") {
      const isRetailAuth =
        typeof window !== "undefined" &&
        (localStorage.getItem("fc_retail_logged_in") === "true" ||
          localStorage.getItem("fc_user_logged_in") === "true") &&
        Boolean(
          localStorage.getItem("fc_retail_email") ||
            localStorage.getItem("fc_retail_mobile") ||
            localStorage.getItem("fc_user_email") ||
            localStorage.getItem("fc_user_mobile")
        );
      if (!isRetailAuth && !overrideIdentifier) {
        setIsRetailLoginOpen(true);
        return;
      }
    }

    // 2. Wholesale Login Check: Must be logged in and meet ₹3,000 minimum
    if (activeCartMode === "wholesale") {
      const isWholesaleAuth =
        typeof window !== "undefined" &&
        localStorage.getItem("fc_wholesale_logged_in") === "true";
      if (!isWholesaleAuth) {
        if (onOpenWholesaleLogin) onOpenWholesaleLogin();
        return;
      }
      if (subtotal < b2bMin) {
        setNotification(`Minimum B2B wholesale order is ₹3,000. Please add ₹${remaining} more.`);
        setTimeout(() => setNotification(null), 3500);
        return;
      }
    }

    const storedEmail =
      typeof window !== "undefined"
        ? localStorage.getItem("fc_retail_email") ||
          localStorage.getItem("fc_user_email") ||
          localStorage.getItem("fc_wholesale_email")
        : null;

    const storedName =
      typeof window !== "undefined"
        ? localStorage.getItem("fc_user_name") ||
          localStorage.getItem("fc_wholesale_owner") ||
          localStorage.getItem("fc_wholesale_business")
        : null;

    const activeIdentifier =
      overrideIdentifier ||
      (activeCartMode === "wholesale"
        ? (userMobile || (typeof window !== "undefined" ? localStorage.getItem("fc_wholesale_mobile") || localStorage.getItem("fc_user_mobile") : null) || "6289417338")
        : (userMobile || storedEmail || (typeof window !== "undefined" ? localStorage.getItem("fc_retail_mobile") : null) || ""));

    if (!activeIdentifier) {
      setIsRetailLoginOpen(true);
      return;
    }

    const customerEmail =
      overrideIdentifier && overrideIdentifier.includes("@")
        ? overrideIdentifier
        : (storedEmail || (activeIdentifier.includes("@") ? activeIdentifier : undefined));

    const customerMobile =
      activeIdentifier.includes("@") ? "" : activeIdentifier;

    setIsCheckingOut(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType: activeCartMode,
          storeMode: activeCartMode,
          customerMobile: customerMobile || activeIdentifier,
          customerEmail,
          customerName: storedName || "Customer",
          items: cart,
          subtotal,
          gst,
          shipping,
          total,
        }),
      });

      const data = await res.json();
      if (data.success && data.order) {
        clearCartByMode(activeCartMode);
        setCart([]);
        onClearCart?.();
        setOrderSuccess(data.order.orderNumber);
        setNotification(`Order placed successfully! Order #${data.order.orderNumber}`);
        setTimeout(() => {
          navAccount();
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

      {/* Responsive Container */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Announcement Bar */}
        <div className="w-full py-2 bg-[#000000] border-b border-[#141414] text-center mb-4 rounded-xl">
          <p className="text-[#e5a93c] text-[12.5px] sm:text-[13.5px] font-medium tracking-wide">
            {storeMode === "wholesale"
              ? "B2B Wholesale • Minimum Order: Rs 3,000 • Verified Businesses Only"
              : "Retail Store • Free Shipping Over ₹999 • No Minimum Order"}
          </p>
        </div>

        {/* Top Header Bar */}
        <div className="flex items-center justify-between py-2 mb-4">
          <button
            type="button"
            onClick={navShop}
            className="h-10 px-3.5 rounded-full bg-[#141414] border border-[#262626] flex items-center justify-center gap-2 text-white hover:text-[#e5a93c] hover:border-[#e5a93c]/50 transition-colors cursor-pointer text-xs font-medium"
            title="Continue Shopping"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Continue Shopping</span>
          </button>
          <div className="text-center">
            <h1 className="text-lg sm:text-2xl font-serif font-medium text-white">
              {activeCartMode === "wholesale" ? "Wholesale B2B Cart" : "Your Shopping Cart"}
            </h1>
            <p className="text-[11px] sm:text-xs text-[#e5a93c] uppercase tracking-wider font-medium">
              {activeCartMode === "wholesale" ? "B2B Wholesale Portal (Min. ₹3,000)" : "Retail Store Channel"}
            </p>
          </div>
          <button
            onClick={handleClearActiveCart}
            disabled={cart.length === 0}
            className="text-xs sm:text-sm text-[#8e8e93] hover:text-rose-400 transition-colors disabled:opacity-0 cursor-pointer px-2 py-1 rounded-lg hover:bg-white/5"
          >
            Clear Cart
          </button>
        </div>

        {/* Order Success Banner */}
        {orderSuccess && (
          <div className="max-w-2xl mx-auto mb-6 p-5 rounded-[20px] bg-emerald-950/60 border border-emerald-500/40 text-center animate-fade-in shadow-xl">
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <h4 className="text-white text-lg font-serif font-medium">Order Placed Successfully!</h4>
            <p className="text-emerald-300 text-sm mt-1">
              Order #{orderSuccess} has been confirmed. Redirecting to your account & orders...
            </p>
          </div>
        )}

        {/* Cart Content: Empty State vs 2-Column Responsive Layout */}
        {cart.length === 0 ? (
          <div className="w-full max-w-lg mx-auto bg-[#0d0d0d] border border-[#222222] rounded-[24px] p-8 sm:p-12 flex flex-col items-center text-center shadow-2xl relative overflow-hidden my-8">
            <div className="w-20 h-20 rounded-full bg-[#171207] border border-[#e5a93c]/50 flex items-center justify-center text-[#e5a93c] mb-5 shadow-[0_0_25px_rgba(229,169,60,0.25)]">
              <ShoppingBag className="w-9 h-9 stroke-[1.8]" />
            </div>
            <h3 className="text-white text-xl sm:text-2xl font-serif font-medium mb-2">
              Your {activeCartMode === "wholesale" ? "Wholesale" : "Retail"} Cart is Empty
            </h3>
            <p className="text-[#8e8e93] text-sm max-w-sm mb-6 leading-relaxed">
              {activeCartMode === "wholesale"
                ? "Add wholesale jewellery items to your cart to meet the ₹3,000 B2B minimum threshold."
                : "Explore our stunning retail anti-tarnish collection and add items to your cart with no minimum order."}
            </p>
            <button
              type="button"
              onClick={navShop}
              className="h-[48px] px-8 rounded-full bg-gradient-to-r from-[#e5a93c] to-[#f5c767] text-black font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all cursor-pointer shadow-lg active:scale-95"
            >
              <span>Explore Products</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
            {/* Left Column: Cart Items List (lg:col-span-7 xl:col-span-8) */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#1f1f1f]">
                <span className="text-sm text-[#8e8e93] font-medium">
                  {cart.length} Item{cart.length > 1 ? "s" : ""} in Cart
                </span>
                <span className="text-xs text-[#e5a93c]">
                  {activeCartMode === "wholesale" ? "Wholesale Pricing Applied" : "Retail Prices"}
                </span>
              </div>

              {cart.map((item) => (
                <div
                  key={item.id}
                  className="w-full bg-[#0d0d0d] border border-[#222222] hover:border-[#333] transition-colors rounded-[18px] p-3.5 sm:p-4 shadow-md flex items-center gap-3.5 sm:gap-5"
                >
                  {/* Thumbnail */}
                  <div className="relative w-[78px] h-[78px] sm:w-[92px] sm:h-[92px] rounded-xl overflow-hidden bg-[#141414] shrink-0 border border-[#1f1f1f]">
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

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between min-h-[78px] sm:min-h-[92px]">
                    {/* Title + Trash */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => toggleSelectItem(item.id)}
                          className={`w-[18px] h-[18px] rounded-[5px] flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                            selectedItems.includes(item.id)
                              ? "bg-[#e5a93c] text-black"
                              : "border border-[#444444] bg-[#111111]"
                          }`}
                        >
                          {selectedItems.includes(item.id) && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>
                        <div>
                          <h3 className="text-white text-sm sm:text-base font-medium leading-tight">
                            {item.name}
                          </h3>
                          <span className="text-[11px] text-[#8e8e93]">
                            Qty: {item.quantity} × ₹{item.price}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        className="text-[#8e8e93] hover:text-rose-400 p-1.5 transition-colors cursor-pointer rounded-lg hover:bg-rose-500/10"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Price + Stepper */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[#e5a93c] text-base sm:text-lg font-semibold">
                          ₹{(item.price * item.quantity).toFixed(1)}
                        </span>
                        {item.quantity > 1 && (
                          <span className="text-xs text-[#8e8e93]">
                            (₹{item.price} each)
                          </span>
                        )}
                      </div>

                      {/* Stepper */}
                      <div className="flex items-center h-[34px] rounded-[10px] bg-[#141414] border border-[#2a2a2a] px-2 gap-3">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.id, Math.max(1, item.quantity - 1))}
                          className="text-[#8e8e93] hover:text-white text-sm font-bold px-1.5 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-white text-xs sm:text-sm font-semibold min-w-[16px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                          className="text-[#8e8e93] hover:text-white text-sm font-bold px-1.5 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column: Sticky Summary & Checkout CTA (lg:col-span-5 xl:col-span-4) */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-4 lg:sticky lg:top-6">
              {/* Order Summary Card */}
              <div className="w-full bg-[#0d0d0d] border border-[#222222] rounded-[22px] p-5 shadow-lg space-y-3.5">
                <h4 className="text-white text-base sm:text-lg font-serif font-medium pb-2 border-b border-[#1c1c1c]">
                  Order Summary ({activeCartMode === "wholesale" ? "Wholesale" : "Retail"})
                </h4>

                <div className="space-y-2.5 text-sm">
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
                  <div className="pt-3 border-t border-[#1c1c1c] flex items-center justify-between text-base sm:text-lg">
                    <span className="text-white font-semibold">Total Payable</span>
                    <span className="text-[#e5a93c] text-xl font-bold">₹{total.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Information Box */}
              <div className="w-full rounded-[20px] border border-[#4a3816] bg-[#140f07] p-4 flex items-start gap-3.5 shadow-sm">
                <div className="w-9 h-9 rounded-full bg-[#1e170a] border border-[#e5a93c]/40 flex items-center justify-center text-[#e5a93c] shrink-0 mt-0.5">
                  <Truck className="w-4 h-4 text-[#e5a93c]" />
                </div>
                <div className="flex-1">
                  <h5 className="text-[#e5a93c] text-sm font-semibold mb-0.5">
                    {activeCartMode === "wholesale" ? "B2B Wholesale Shipping" : "Retail Fast Shipping"}
                  </h5>
                  <p className="text-[#a8a8a8] text-xs leading-relaxed">
                    {activeCartMode === "wholesale"
                      ? "Standard B2B shipping is ₹125 for all orders. Free shipping on orders above ₹10,000. Orders are dispatched within 24-48 business hours with GST invoice."
                      : "Standard retail shipping is ₹125. Fast and safe insured delivery across India."}
                  </p>
                </div>
              </div>

              {/* Minimum Order / Progress & Checkout Action */}
              <div className="w-full bg-[#0d0d0d] border border-[#222222] rounded-[22px] p-5 shadow-lg space-y-4">
                {activeCartMode === "wholesale" ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#8e8e93]">B2B Order Minimum Progress</span>
                      <span className="text-[#e5a93c] font-semibold">₹{subtotal.toFixed(0)} / ₹3,000</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#1c1c1c] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#d99726] to-[#f5c767] rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    {subtotal < b2bMin ? (
                      <p className="text-[#8e8e93] text-xs">
                        Add <span className="text-[#e5a93c] font-semibold">₹{remaining.toFixed(0)}</span> more to meet wholesale minimum.
                      </p>
                    ) : (
                      <p className="text-emerald-400 text-xs font-medium flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Wholesale minimum met! Ready to place order.</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#8e8e93]">Retail Checkout</span>
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>No Minimum Order</span>
                      </span>
                    </div>
                    <p className="text-[#8e8e93] text-xs">
                      Browse freely and order any quantity. Secure login via mobile OTP at checkout.
                    </p>
                  </div>
                )}

                {/* Proceed to Checkout Button */}
                <button
                  type="button"
                  onClick={() => handleCheckout()}
                  disabled={isCheckingOut}
                  className={`w-full h-[52px] rounded-[16px] font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer ${
                    activeCartMode === "retail" || subtotal >= b2bMin
                      ? "bg-gradient-to-r from-[#e5a93c] to-[#f5c767] hover:opacity-95 active:scale-[0.99] text-[#111111]"
                      : "bg-[#1c160c] border border-[#e5a93c]/50 text-[#e5a93c] hover:bg-[#e5a93c] hover:text-black"
                  }`}
                >
                  {isCheckingOut ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      <span>Placing Order...</span>
                    </div>
                  ) : (
                    <>
                      <span>PROCEED TO CHECKOUT</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Continue Shopping Button */}
                <button
                  type="button"
                  onClick={navShop}
                  className="w-full h-[48px] rounded-[16px] bg-[#141414] hover:bg-[#1c1c1c] border border-[#2a2a2a] hover:border-[#e5a93c]/60 text-[#c5c5c5] hover:text-white font-medium text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]"
                >
                  <ArrowLeft className="w-4 h-4 text-[#e5a93c]" />
                  <span>Continue Shopping</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* YOU MAY ALSO LIKE SECTION                                */}
        {/* ======================================================== */}
        {recommendedProducts.length > 0 && (
          <section className="mt-10 pt-8 border-t border-[#1c1c1c] mb-12">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#1c160c] border border-[#e5a93c]/40 flex items-center justify-center text-[#e5a93c]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-white text-lg sm:text-xl font-serif font-medium">
                    You May Also Like
                  </h3>
                  <p className="text-[#8e8e93] text-xs">
                    Popular jewellery pieces that pair well with your cart
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={navShop}
                className="text-xs text-[#e5a93c] hover:text-[#f5c767] hover:underline flex items-center gap-1 font-medium cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {recommendedProducts.map((p) => {
                const effectivePrice =
                  activeCartMode === "wholesale"
                    ? p.wholesalePrice ?? p.price
                    : p.retailPrice ?? p.price;

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (onSelectProduct) {
                        onSelectProduct(p);
                      } else {
                        router.push(`/product?id=${p.id}`);
                      }
                    }}
                    className="group bg-[#0d0d0d] border border-[#222222] hover:border-[#e5a93c]/50 rounded-[18px] p-3 flex flex-col justify-between transition-all cursor-pointer shadow-md hover:shadow-[0_4px_20px_rgba(229,169,60,0.15)]"
                  >
                    <div>
                      <div className="relative w-full aspect-square rounded-[14px] overflow-hidden bg-[#141414] mb-2.5 border border-[#1f1f1f]">
                        <Image
                          src={p.image || "/images/products/moon-necklace.jpg"}
                          alt={p.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      <span className="text-[10px] text-[#e5a93c] uppercase tracking-wider font-semibold">
                        {p.category || "Jewellery"}
                      </span>
                      <h4 className="text-white text-xs sm:text-sm font-medium line-clamp-1 group-hover:text-[#f5c767] transition-colors mt-0.5">
                        {p.name}
                      </h4>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#1c1c1c] flex items-center justify-between">
                      <span className="text-white text-xs sm:text-sm font-bold">
                        ₹{Number(effectivePrice).toLocaleString("en-IN")}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickAdd(p);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#1c160c] hover:bg-[#e5a93c] border border-[#e5a93c]/50 hover:border-[#e5a93c] text-[#e5a93c] hover:text-black text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer active:scale-95 shadow-sm"
                        title="Add to Cart"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
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

      {/* Retail Login Modal: Required before checkout for retail users */}
      <RetailLoginModal
        isOpen={isRetailLoginOpen}
        onClose={() => setIsRetailLoginOpen(false)}
        onSuccess={(verifiedMobile) => {
          handleCheckout(verifiedMobile);
        }}
      />

      {/* Fixed Bottom Navigation Bar (Mobile Only: hidden on md:) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080808]/95 backdrop-blur-md border-t border-[#181818] flex justify-center pb-safe">
        <div className="w-full max-w-[440px] h-[64px] px-3 flex items-center justify-between relative">
          {/* 1. Home */}
          <button
            type="button"
            onClick={navHome}
            className="flex flex-col items-center justify-center flex-1 text-[#8e8e93] hover:text-white transition-colors gap-1 cursor-pointer"
          >
            <Home className="w-5 h-5" />
            <span className="text-[11px] font-normal">Home</span>
          </button>

          {/* 2. Shop */}
          <button
            type="button"
            onClick={navShop}
            className="flex flex-col items-center justify-center flex-1 text-[#8e8e93] hover:text-white transition-colors gap-1 cursor-pointer"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[11px] font-normal">Shop</span>
          </button>

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
