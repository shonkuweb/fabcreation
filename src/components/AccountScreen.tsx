"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Package,
  Heart,
  MapPin,
  LogOut,
  Pencil,
  Lock,
  Mail,
  Phone,
  Info,
  Crown,
  ShoppingBag,
  Star,
  ArrowRight,
  ArrowLeft,
  Home,
  Grid,
  Plus,
  Trash2,
  CheckCircle2,
  Truck,
  Building,
  ShieldCheck,
  X,
} from "lucide-react";
import CategoriesModal from "@/components/CategoriesModal";
import type { Order, Category, Product } from "@/lib/db";
import {
  getWishlistItems,
  toggleWishlistByMode,
  getCartCount,
  addToCartByMode,
  getAccountProfile,
  saveAccountProfile,
  getAccountAddresses,
  saveAccountAddresses,
  fetchAccountProfileFromServer,
} from "@/lib/cart";

export interface UserAddress {
  id: string;
  businessName?: string;
  contactName: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  gstin?: string;
}

interface AccountScreenProps {
  userMobile?: string;
  cartCount?: number;
  categories?: Category[];
  wishlist?: string[];
  wishlistProducts?: Product[];
  storeMode?: "retail" | "wholesale";
  onSwitchStoreMode?: (mode: "retail" | "wholesale") => void;
  isWholesaleLoggedIn?: boolean;
  isRetailLoggedIn?: boolean;
  onOpenWholesaleLogin?: () => void;
  onOpenRetailLogin?: () => void;
  onOpenRetailRegister?: () => void;
  onToggleWishlist?: (productId: string) => void;
  onAddToCart?: (product: Product, quantity?: number) => void;
  onSelectProduct?: (product: Product) => void;
  onNavigateHome?: () => void;
  onNavigateShop?: () => void;
  onNavigateCart?: () => void;
  onSelectCategory?: (category: string | null) => void;
  onSignOut?: () => void;
}

export default function AccountScreen({
  userMobile = "6289417338",
  cartCount: initialCartCount = 0,
  categories: initialCategories = [],
  wishlist: initialWishlist = [],
  wishlistProducts: initialWishlistProducts = [],
  storeMode = "retail",
  onSwitchStoreMode,
  isWholesaleLoggedIn = false,
  isRetailLoggedIn = false,
  onOpenWholesaleLogin,
  onOpenRetailLogin,
  onOpenRetailRegister,
  onToggleWishlist,
  onAddToCart,
  onSelectProduct,
  onNavigateHome,
  onNavigateShop,
  onNavigateCart,
  onSelectCategory,
  onSignOut,
}: AccountScreenProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"profile" | "orders" | "wishlist" | "addresses">("orders");
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const [cartCount, setCartCount] = useState<number>(initialCartCount);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [wishlist, setWishlist] = useState<string[]>(initialWishlist);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>(initialWishlistProducts);

  // Navigation helpers with fallback
  const navHome = () => {
    if (onNavigateHome) onNavigateHome();
    else router.push("/home");
  };

  const navShop = () => {
    if (onNavigateShop) onNavigateShop();
    else router.push("/shop");
  };

  const navCart = () => {
    if (onNavigateCart) onNavigateCart();
    else router.push("/cart");
  };

  // Profile state with database & storage persistence
  const [orderChannelTab, setOrderChannelTab] = useState<"wholesale" | "retail">(storeMode);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [gstin, setGstin] = useState("");

  // Addresses state with database & storage persistence
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({
    businessName: "",
    contactName: "",
    phone: userMobile,
    addressLine: "",
    city: "",
    state: "",
    pincode: "",
    gstin: "",
  });

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Sync orderChannelTab when storeMode changes
  useEffect(() => {
    setOrderChannelTab(storeMode);
  }, [storeMode]);

  // Load profile & addresses from database & storage
  useEffect(() => {
    const prof = getAccountProfile(storeMode);
    setFullName(prof.name);
    setEmail(prof.email);
    setCompanyName(prof.companyName || "");
    setGstin(prof.gstin || "");
    setAddresses(getAccountAddresses(storeMode));
    setWishlist(getWishlistItems(storeMode));
    setCartCount(getCartCount(storeMode));

    fetchAccountProfileFromServer(storeMode).then((u) => {
      if (u) {
        if (u.name) setFullName(u.name);
        if (u.email) setEmail(u.email);
        if (u.companyName) setCompanyName(u.companyName);
        if (u.gstin) setGstin(u.gstin);
        if (Array.isArray(u.addresses)) setAddresses(u.addresses);
      }
    });
  }, [storeMode, userMobile]);

  // Load categories, cartCount, wishlist, and orders
  useEffect(() => {
    // Categories
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

    setCartCount(getCartCount(storeMode));

    // Wishlist IDs & Products
    const ids = getWishlistItems(storeMode);
    setWishlist(ids);

    fetch("/api/products", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.products)) {
          const matched = d.products.filter((p: Product) => ids.includes(p.id));
          setWishlistProducts(matched);
        }
      })
      .catch(console.error);

    // Orders
    fetchOrders();
  }, [storeMode, userMobile, initialCategories]);

  // Fetch real orders from API
  const fetchOrders = async () => {
    const customerIdentifier = (userMobile || email || "").trim();
    if (!customerIdentifier) {
      setOrders([]);
      return;
    }
    setLoadingOrders(true);
    try {
      const res = await fetch(`/api/orders?customer=${encodeURIComponent(customerIdentifier)}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error("Failed to fetch user orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const retailOrders = orders.filter((o) => (o.orderType || "retail") === "retail");
  const wholesaleOrders = orders.filter((o) => o.orderType === "wholesale");
  const displayedOrders = storeMode === "wholesale" ? wholesaleOrders : retailOrders;

  const handleToggleWishlist = (productId: string) => {
    onToggleWishlist?.(productId);
    const { items } = toggleWishlistByMode(storeMode, productId);
    setWishlist(items);
    setWishlistProducts((prev) => prev.filter((p) => items.includes(p.id)));
    showNotification("Wishlist updated.");
  };

  const handleAddToCart = (product: Product) => {
    const { items, effectivePrice } = addToCartByMode(product, storeMode, 1);
    setCartCount(items.reduce((s, i) => s + i.quantity, 0));
    onAddToCart?.({ ...product, price: effectivePrice }, 1);
    showNotification(
      `Added ${product.name} to ${storeMode === "wholesale" ? "Wholesale" : "Retail"} Cart!`
    );
  };

  const handleSelectProduct = (product: Product) => {
    try {
      localStorage.setItem("fc_selected_product", JSON.stringify(product));
    } catch {}
    if (onSelectProduct) {
      onSelectProduct(product);
    } else {
      router.push(`/product?id=${product.id}`);
    }
  };

  // Save profile to database
  const handleSaveProfile = () => {
    saveAccountProfile(storeMode, {
      name: fullName,
      email,
      companyName,
      gstin,
    });
    setIsEditingProfile(false);
    showNotification("Profile updated and saved!");
  };

  // Save Address to database
  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.contactName || !addressForm.addressLine || !addressForm.pincode) {
      alert("Please fill in Contact Name, Address Line and Pincode");
      return;
    }

    const newAddr: UserAddress = {
      id: `addr-${Date.now()}`,
      ...addressForm,
    };

    const updated = [...addresses, newAddr];
    setAddresses(updated);
    saveAccountAddresses(storeMode, updated);

    setIsAddAddressOpen(false);
    setAddressForm({
      businessName: "",
      contactName: "",
      phone: userMobile,
      addressLine: "",
      city: "",
      state: "",
      pincode: "",
      gstin: "",
    });
    showNotification("Address added and saved!");
  };

  // Delete Address from database
  const handleDeleteAddress = (id: string) => {
    const updated = addresses.filter((a) => a.id !== id);
    setAddresses(updated);
    saveAccountAddresses(storeMode, updated);
    showNotification("Address removed.");
  };

  const isAuthenticated =
    storeMode === "wholesale" ? isWholesaleLoggedIn : isRetailLoggedIn;

  if (!isAuthenticated) {
    return (
      <div className="relative min-h-[85vh] w-full bg-[#050505] text-white flex flex-col items-center justify-center px-4 py-12 select-none">
        <div className="w-full max-w-md bg-[#0c0c0c] border border-[#222222] hover:border-[#e5a93c]/50 rounded-[24px] p-8 text-center shadow-2xl relative overflow-hidden transition-all">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#e5a93c]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-b from-[#1c1509] to-[#0d0d0d] border border-[#d69e3d]/40 flex items-center justify-center text-[#e5a93c] shadow-lg">
            <Lock className="w-8 h-8 text-[#e5a93c]" />
          </div>

          <h2 className="text-xl sm:text-2xl font-serif font-bold text-white mb-2">
            {storeMode === "wholesale" ? "Wholesale Portal Sign In Required" : "Sign In to Access Account"}
          </h2>

          <p className="text-xs sm:text-sm text-[#a0a0a0] leading-relaxed mb-6">
            {storeMode === "wholesale"
              ? "Wholesale account orders, invoices, and trade company profile are restricted to verified wholesale partners. Please sign in or register at the wholesale portal."
              : "To view your order history, track deliveries, and manage saved delivery addresses, please sign in or register your account."}
          </p>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                if (storeMode === "wholesale") {
                  if (onOpenWholesaleLogin) onOpenWholesaleLogin();
                  else router.push("/wholesale");
                } else {
                  if (onOpenRetailLogin) onOpenRetailLogin();
                }
              }}
              className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#d69e3d] via-[#e5a93c] to-[#f5c767] hover:brightness-110 text-black text-xs sm:text-sm font-bold tracking-wider uppercase shadow-[0_4px_20px_rgba(229,169,60,0.3)] active:scale-98 transition-all cursor-pointer"
            >
              {storeMode === "wholesale" ? "Sign In to Wholesale Portal" : "Sign In / Register"}
            </button>

            <button
              type="button"
              onClick={navShop}
              className="w-full py-3 px-6 rounded-full bg-[#141414] hover:bg-[#1a1a1a] border border-[#2a2a2a] text-[#8e8e93] hover:text-white text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-[#1a1a1a] flex items-center justify-center gap-6 text-[11px] text-[#707070]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#e5a93c]" /> Instant Verification
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#e5a93c]" /> 100% Confidential
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-[#050505] text-white flex flex-col items-center justify-start pb-28 select-none">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-3 z-50 px-4 py-2 bg-[#1c160c] border border-[#e5a93c] text-[#f5c767] text-xs rounded-full shadow-2xl animate-fade-in">
          {notification}
        </div>
      )}

      {/* Responsive Container */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between py-2 mb-4 border-b border-[#181818]">
          <button
            type="button"
            onClick={navHome}
            className="h-9 px-3 rounded-full bg-[#141414] border border-[#262626] flex items-center justify-center gap-2 text-white hover:text-[#e5a93c] transition-colors cursor-pointer text-xs font-medium"
            title="Back to Home"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </button>
          <span className="text-xs sm:text-sm font-serif tracking-widest text-[#e5a93c] uppercase font-semibold">
            Account & Order History
          </span>
          <button
            type="button"
            onClick={navShop}
            className="text-xs text-[#8e8e93] hover:text-[#e5a93c] transition-colors cursor-pointer"
          >
            Shop Now →
          </button>
        </div>

        {/* 1. Top User Card */}
        <div className="w-full bg-[#0d0d0d] border border-[#222222] rounded-[20px] p-4 sm:p-5 flex items-center justify-between shadow-md mb-3">
          <div className="flex items-center gap-3.5">
            {/* Avatar Circle */}
            <div className="w-12 h-12 rounded-full border border-[#4a3816] bg-[#141414] flex items-center justify-center text-[#e5a93c] text-[20px] font-serif font-medium shrink-0">
              {fullName ? fullName.charAt(0).toUpperCase() : "U"}
            </div>

            <div>
              <h3 className="text-white text-[18px] font-serif font-medium leading-tight">
                {fullName || "My Account"}
              </h3>
              <p className="text-[#8e8e93] text-[12.5px] font-normal pt-0.5">
                {email || (userMobile && !userMobile.includes("@") ? `+91 ${userMobile}` : userMobile)}
              </p>
            </div>
          </div>

          {/* Dynamic User Badge based on storeMode */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#e5a93c]/50 bg-[#171207] text-[#e5a93c] text-[12px] font-medium shadow-sm">
            {storeMode === "wholesale" ? (
              <>
                <Crown className="w-3.5 h-3.5 fill-[#e5a93c]" />
                <span>B2B Wholesale Partner</span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5 text-[#e5a93c]" />
                <span>Retail Customer</span>
              </>
            )}
          </div>
        </div>

        {/* 2. Sub-Tabs Bar */}
        <div className="grid grid-cols-5 gap-1 sm:gap-2 mb-4">
          {/* Tab 1: Profile */}
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex flex-col items-center justify-center py-2 sm:py-2.5 rounded-[12px] sm:rounded-[14px] transition-all cursor-pointer ${
              activeTab === "profile"
                ? "bg-[#141109] border border-[#e5a93c] text-[#e5a93c] shadow-[0_0_12px_rgba(229,169,60,0.2)]"
                : "bg-[#0d0d0d] border border-[#222222] text-[#8e8e93] hover:text-white"
            }`}
          >
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5 sm:mb-1" />
            <span className="text-[10px] sm:text-[11px] truncate">Profile</span>
          </button>

          {/* Tab 2: Orders */}
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex flex-col items-center justify-center py-2 sm:py-2.5 rounded-[12px] sm:rounded-[14px] transition-all cursor-pointer ${
              activeTab === "orders"
                ? "bg-[#141109] border border-[#e5a93c] text-[#e5a93c] shadow-[0_0_12px_rgba(229,169,60,0.2)]"
                : "bg-[#0d0d0d] border border-[#222222] text-[#8e8e93] hover:text-white"
            }`}
          >
            <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5 sm:mb-1" />
            <span className="text-[10px] sm:text-[11px] truncate">Orders</span>
          </button>

          {/* Tab 3: Wishlist */}
          <button
            onClick={() => setActiveTab("wishlist")}
            className={`flex flex-col items-center justify-center py-2 sm:py-2.5 rounded-[12px] sm:rounded-[14px] transition-all cursor-pointer relative ${
              activeTab === "wishlist"
                ? "bg-[#141109] border border-[#e5a93c] text-[#e5a93c] shadow-[0_0_12px_rgba(229,169,60,0.2)]"
                : "bg-[#0d0d0d] border border-[#222222] text-[#8e8e93] hover:text-white"
            }`}
          >
            <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5 sm:mb-1" />
            <span className="text-[10px] sm:text-[11px] truncate">Wishlist</span>
            {wishlist.length > 0 && (
              <span className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-[#e5a93c]" />
            )}
          </button>

          {/* Tab 4: Addresses */}
          <button
            onClick={() => setActiveTab("addresses")}
            className={`flex flex-col items-center justify-center py-2 sm:py-2.5 rounded-[12px] sm:rounded-[14px] transition-all cursor-pointer ${
              activeTab === "addresses"
                ? "bg-[#141109] border border-[#e5a93c] text-[#e5a93c] shadow-[0_0_12px_rgba(229,169,60,0.2)]"
                : "bg-[#0d0d0d] border border-[#222222] text-[#8e8e93] hover:text-white"
            }`}
          >
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5 sm:mb-1" />
            <span className="text-[10px] sm:text-[11px] truncate">Address</span>
          </button>

          {/* Tab 5: Logout */}
          <button
            onClick={onSignOut}
            className="flex flex-col items-center justify-center py-2 sm:py-2.5 rounded-[12px] sm:rounded-[14px] bg-[#0d0d0d] border border-[#222222] text-rose-400 hover:text-rose-300 hover:border-rose-900/50 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5 sm:mb-1" />
            <span className="text-[10px] sm:text-[11px] truncate">Logout</span>
          </button>
        </div>

        {/* ============================================================= */}
        {/* SUB-TAB 1: PROFILE VIEW                                       */}
        {/* ============================================================= */}
        {activeTab === "profile" && (
          <div className="space-y-4 animate-fade-in">
            {/* Info Notice Card */}
            <div className="w-full rounded-[16px] border border-[#4a3816] bg-[#140f07] p-3.5 flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#e5a93c] text-black flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                i
              </div>
              <p className="text-[#c2a373] text-[12px] leading-relaxed">
                {storeMode === "wholesale"
                  ? "Your phone number is locked as your permanent B2B account ID. Other details can be updated below."
                  : "Your verified customer profile. Update your contact and shipping information below."}
              </p>
            </div>

            {/* Profile Fields Card */}
            <div className="w-full bg-[#0d0d0d] border border-[#222222] rounded-[22px] p-5 space-y-4 shadow-md">
              <div className="flex items-center justify-between pb-2 border-b border-[#1c1c1c]">
                <h4 className="text-white text-[16px] font-serif font-medium">
                  Personal Information
                </h4>
                {isEditingProfile ? (
                  <button
                    onClick={handleSaveProfile}
                    className="px-3 py-1 rounded-full bg-[#e5a93c] text-black text-xs font-semibold hover:bg-[#f5c767] transition-colors cursor-pointer"
                  >
                    Save Changes
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="flex items-center gap-1 text-xs text-[#e5a93c] hover:text-[#f5c767] font-medium transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              {/* Field 1: Full Name */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[#a0a0a0] text-[13px]">
                  <User className="w-4 h-4 text-[#e5a93c]" />
                  <span>Full Name</span>
                </label>
                {isEditingProfile ? (
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full h-[48px] rounded-[13px] bg-[#141414] border border-[#e5a93c] px-4 text-white text-[14px] outline-none"
                  />
                ) : (
                  <div className="w-full h-[48px] rounded-[13px] bg-[#141414] border border-[#222222] px-4 flex items-center text-[#d1d5db] text-[14px]">
                    {fullName || "Not provided (click edit to set)"}
                  </div>
                )}
              </div>

              {/* Field 2: Email Address */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[#a0a0a0] text-[13px]">
                  <Mail className="w-4 h-4 text-[#e5a93c]" />
                  <span>Email Address</span>
                  <span className="text-[#8e8e93] text-[12px] font-normal">(optional)</span>
                </label>
                {isEditingProfile ? (
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full h-[48px] rounded-[13px] bg-[#141414] border border-[#e5a93c] px-4 text-white text-[14px] outline-none"
                  />
                ) : (
                  <div className="w-full h-[48px] rounded-[13px] bg-[#141414] border border-[#222222] px-4 flex items-center text-[#d1d5db] text-[14px]">
                    {email || "Not provided (click edit to set)"}
                  </div>
                )}
              </div>

              {/* Field 3: Phone Number (Locked) */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[#a0a0a0] text-[13px]">
                  <Phone className="w-4 h-4 text-[#e5a93c]" />
                  <span>Phone Number</span>
                  <span className="text-[#8e8e93] text-[12px] font-normal">(cannot be changed)</span>
                </label>
                <div className="w-full h-[48px] rounded-[13px] bg-[#141414] border border-[#222222] px-4 flex items-center justify-between text-white text-[14.5px] font-medium tracking-wide">
                  <span>+91 {userMobile}</span>
                  <span className="flex items-center gap-1 text-xs text-[#a0a0a0] px-2 py-0.5 rounded bg-[#1e1e1e] border border-[#2e2e2e]">
                    <Lock className="w-3 h-3 text-[#e5a93c]" />
                    <span>Locked</span>
                  </span>
                </div>
              </div>

              {/* Wholesale B2B Specific Fields (Hidden for Retail Customers) */}
              {storeMode === "wholesale" && (
                <>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-[#a0a0a0] text-[13px]">
                      <Building className="w-4 h-4 text-[#e5a93c]" />
                      <span>Company / Business Name</span>
                    </label>
                    {isEditingProfile ? (
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Enter business / firm name"
                        className="w-full h-[48px] rounded-[13px] bg-[#141414] border border-[#e5a93c] px-4 text-white text-[14px] outline-none"
                      />
                    ) : (
                      <div className="w-full h-[48px] rounded-[13px] bg-[#141414] border border-[#222222] px-4 flex items-center text-[#d1d5db] text-[14px]">
                        {companyName || "Not provided"}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-[#a0a0a0] text-[13px]">
                      <Building className="w-4 h-4 text-[#e5a93c]" />
                      <span>GSTIN Number</span>
                      <span className="text-[#8e8e93] text-[12px] font-normal">(optional)</span>
                    </label>
                    {isEditingProfile ? (
                      <input
                        type="text"
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value.toUpperCase())}
                        placeholder="e.g. 09AAAAA0000A1Z5"
                        className="w-full h-[48px] rounded-[13px] bg-[#141414] border border-[#e5a93c] px-4 text-white text-[14px] outline-none uppercase"
                      />
                    ) : (
                      <div className="w-full h-[48px] rounded-[13px] bg-[#141414] border border-[#222222] px-4 flex items-center text-[#d1d5db] text-[14px]">
                        {gstin || "Not provided"}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* SUB-TAB 2: ORDERS VIEW                                        */}
        {/* ============================================================= */}
        {activeTab === "orders" && (
          <div className="space-y-4 animate-fade-in">
            {/* Top Orders Count Mini-Card */}
            <div className="w-full bg-[#0d0d0d] border border-[#222222] rounded-[18px] p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#171207] border border-[#4a3816] flex items-center justify-center text-[#e5a93c] shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-white text-[16px] font-serif font-medium leading-tight">
                    {storeMode === "wholesale" ? "Wholesale Orders" : "My Orders"}
                  </h4>
                  <p className="text-[#8e8e93] text-[12px] pt-0.5">
                    {storeMode === "wholesale"
                      ? `${wholesaleOrders.length} B2B Wholesale Order${wholesaleOrders.length === 1 ? "" : "s"}`
                      : `${retailOrders.length} Order${retailOrders.length === 1 ? "" : "s"}`}
                  </p>
                </div>
              </div>

              <button
                onClick={navShop}
                className="px-3 py-1.5 rounded-full bg-[#1c160c] border border-[#e5a93c]/50 text-[#e5a93c] text-xs font-medium hover:bg-[#e5a93c] hover:text-black transition-all cursor-pointer"
              >
                Shop More
              </button>
            </div>

            {/* Orders List or Empty State */}
            {displayedOrders.length > 0 ? (
              <div className="space-y-3">
                {displayedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="w-full bg-[#0d0d0d] border border-[#222222] rounded-[20px] p-4 shadow-md space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2.5 border-b border-[#1c1c1c]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[#e5a93c] font-semibold text-sm">
                          {order.orderNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                            order.orderType === "wholesale"
                              ? "bg-purple-950/80 border border-purple-500/40 text-purple-300"
                              : "bg-emerald-950/80 border border-emerald-500/40 text-emerald-300"
                          }`}
                        >
                          {order.orderType === "wholesale" ? "Wholesale" : "Retail"}
                        </span>
                        <p className="text-[#8e8e93] text-[11px]">
                          {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${
                          order.status === "Delivered"
                            ? "bg-emerald-950/60 border border-emerald-500/40 text-emerald-400"
                            : order.status === "Dispatched"
                            ? "bg-blue-950/60 border border-blue-500/40 text-blue-400"
                            : order.status === "Confirmed"
                            ? "bg-amber-950/60 border border-amber-500/40 text-amber-400"
                            : "bg-neutral-800 border border-neutral-700 text-neutral-300"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    {/* Order Items Preview */}
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-[#161616] shrink-0 border border-[#262626]">
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
                            <span className="text-white max-w-[180px] truncate">
                              {item.name}
                            </span>
                          </div>
                          <span className="text-[#8e8e93]">
                            {item.quantity} × ₹{item.price}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Order Total Row */}
                    <div className="pt-2 border-t border-[#1c1c1c] flex items-center justify-between text-xs">
                      <span className="text-[#8e8e93]">Total Amount (inc. GST & shipping):</span>
                      <span className="text-[#e5a93c] font-bold text-sm">
                        ₹{order.total}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full bg-[#0d0d0d] border border-[#222222] rounded-[24px] p-8 sm:p-10 flex flex-col items-center text-center shadow-lg relative overflow-hidden">
                <div
                  className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] rounded-full opacity-20 blur-[60px]"
                  style={{
                    background: "radial-gradient(circle, rgba(229,169,60,0.6) 0%, transparent 70%)"
                  }}
                />

                <div className="w-24 h-24 rounded-full bg-[#171207] border border-[#e5a93c]/50 flex items-center justify-center text-[#e5a93c] mb-6 shadow-[0_0_25px_rgba(229,169,60,0.25)]">
                  <ShoppingBag className="w-10 h-10 stroke-[1.8]" />
                </div>

                <h3 className="text-white text-[22px] font-serif font-medium leading-tight mb-2">
                  No {orderChannelTab === "wholesale" ? "wholesale" : "retail"} orders yet
                </h3>

                <p className="text-[#8e8e93] text-[13.5px] leading-relaxed max-w-[270px] mb-8">
                  {orderChannelTab === "wholesale"
                    ? "Explore our bulk catalog and place your first wholesale order."
                    : "Start exploring our beautiful jewelry collection and place your first order."}
                </p>

                <button
                  onClick={navShop}
                  className="w-full h-[48px] rounded-[14px] bg-[#141109] border border-[#e5a93c] hover:bg-[#e5a93c] hover:text-black text-[#e5a93c] font-medium text-[14px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Start Shopping</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============================================================= */}
        {/* SUB-TAB 3: WISHLIST VIEW                                      */}
        {/* ============================================================= */}
        {activeTab === "wishlist" && (
          <div className="animate-fade-in space-y-4">
            {wishlistProducts.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white text-[16px] font-serif font-medium">
                    Saved Items ({wishlistProducts.length})
                  </h4>
                  <button
                    onClick={navShop}
                    className="text-[#e5a93c] text-xs font-medium hover:text-[#f5c767]"
                  >
                    Browse More
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {wishlistProducts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleSelectProduct(p)}
                      className="bg-[#0d0d0d] border border-[#202020] rounded-[18px] overflow-hidden flex flex-col justify-between cursor-pointer group hover:border-[#383838] transition-all"
                    >
                      <div className="relative w-full aspect-[1.18] bg-[#141414] overflow-hidden">
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
                        {/* Remove from Wishlist button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleWishlist(p.id);
                          }}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center text-[#e5a93c] hover:scale-110 active:scale-95 transition-all z-10"
                        >
                          <Heart className="w-3.5 h-3.5 fill-[#e5a93c] text-[#e5a93c]" />
                        </button>
                      </div>

                      <div className="p-3 flex flex-col justify-between flex-1">
                        <div>
                          <h4 className="text-white text-[14px] font-medium truncate mb-0.5">
                            {p.name}
                          </h4>
                          <p className="text-[#8e8e93] text-[11px] truncate mb-2">
                            {p.subtitle || p.category}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[#e5a93c] text-[15.5px] font-semibold">
                            ₹{storeMode === "wholesale" && p.wholesalePrice ? p.wholesalePrice : (p.retailPrice || p.price)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(p);
                            }}
                            className="px-2.5 py-1 rounded-full bg-[#1c160c] border border-[#e5a93c] text-[#e5a93c] hover:bg-[#e5a93c] hover:text-black transition-all text-xs font-medium"
                          >
                            + Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="w-full bg-[#0d0d0d] border border-[#222222] rounded-[24px] p-8 sm:p-10 flex flex-col items-center text-center shadow-lg relative overflow-hidden">
                <div
                  className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] rounded-full opacity-20 blur-[70px]"
                  style={{
                    background: "radial-gradient(circle, rgba(229,169,60,0.6) 0%, transparent 70%)"
                  }}
                />

                <div className="w-24 h-24 rounded-full bg-[#171207] border border-[#e5a93c]/50 flex items-center justify-center text-[#e5a93c] mb-6 shadow-[0_0_25px_rgba(229,169,60,0.25)]">
                  <Heart className="w-10 h-10 stroke-[1.8]" />
                </div>

                <h3 className="text-white text-[23px] font-serif font-medium leading-tight mb-2.5">
                  Your Wishlist is <br />
                  Empty
                </h3>

                <p className="text-[#8e8e93] text-[13.5px] leading-relaxed max-w-[270px] mb-8">
                  Save your favorite jewelry pieces to your wishlist and never lose track of what you love.
                </p>

                <button
                  onClick={navShop}
                  className="w-full h-[48px] rounded-[14px] bg-[#141109] border border-[#e5a93c] hover:bg-[#e5a93c] hover:text-black text-[#e5a93c] font-medium text-[14px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md cursor-pointer"
                >
                  <Star className="w-4 h-4" />
                  <span>Explore Collection</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============================================================= */}
        {/* SUB-TAB 4: ADDRESSES VIEW                                     */}
        {/* ============================================================= */}
        {activeTab === "addresses" && (
          <div className="animate-fade-in space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-white text-[16px] font-serif font-medium">
                Saved B2B Addresses ({addresses.length})
              </h4>
              <button
                onClick={() => setIsAddAddressOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#1c160c] border border-[#e5a93c] text-[#e5a93c] text-xs font-semibold hover:bg-[#e5a93c] hover:text-black transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Address</span>
              </button>
            </div>

            {/* Addresses list */}
            {addresses.length > 0 ? (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="w-full bg-[#0d0d0d] border border-[#222222] rounded-[20px] p-4 shadow-md space-y-2 relative"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-[#e5a93c]" />
                        <h5 className="text-white font-medium text-sm">
                          {addr.businessName}
                        </h5>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-[#8e8e93] hover:text-rose-400 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-[#8e8e93] text-xs leading-relaxed">
                      {addr.addressLine}, {addr.city}, {addr.state} - {addr.pincode}
                    </p>

                    <div className="pt-2 border-t border-[#1a1a1a] flex items-center justify-between text-xs text-[#a0a0a0]">
                      <span>Contact: {addr.contactName || fullName || "B2B Partner"}</span>
                      <span>Phone: +91 {addr.phone}</span>
                    </div>

                    {addr.gstin && (
                      <div className="text-[11px] text-[#e5a93c]">
                        GSTIN: {addr.gstin}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full bg-[#0d0d0d] border border-[#222222] rounded-[22px] p-8 text-center shadow-md space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#171207] border border-[#e5a93c]/50 flex items-center justify-center text-[#e5a93c] mx-auto">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-white text-[18px] font-serif font-medium">
                    No Saved Addresses
                  </h4>
                  <p className="text-[#8e8e93] text-xs pt-1">
                    Add your business delivery address for faster B2B dispatch.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddAddressOpen(true)}
                  className="w-full h-[46px] rounded-[13px] border border-[#e5a93c] text-[#e5a93c] hover:bg-[#e5a93c] hover:text-black transition-all text-xs font-semibold uppercase flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Address</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Address Modal Dialog */}
      {isAddAddressOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in select-none">
          <div className="relative w-full max-w-[420px] bg-[#0e0e0e] border border-[#2e2e2e] rounded-[24px] p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#222222] mb-4">
              <h3 className="text-white text-base font-serif font-medium">
                Add Delivery Address
              </h3>
              <button
                onClick={() => setIsAddAddressOpen(false)}
                className="w-7 h-7 rounded-full bg-[#181818] flex items-center justify-center text-[#8e8e93] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-3 text-xs">
              <div>
                <label className="text-[#a0a0a0] block mb-1">Business / Store Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Jewellers"
                  value={addressForm.businessName}
                  onChange={(e) => setAddressForm({ ...addressForm, businessName: e.target.value })}
                  className="w-full h-[42px] rounded-[10px] bg-[#141414] border border-[#2a2a2a] px-3 text-white outline-none focus:border-[#e5a93c]"
                />
              </div>

              <div>
                <label className="text-[#a0a0a0] block mb-1">Contact Person Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={addressForm.contactName}
                  onChange={(e) => setAddressForm({ ...addressForm, contactName: e.target.value })}
                  className="w-full h-[42px] rounded-[10px] bg-[#141414] border border-[#2a2a2a] px-3 text-white outline-none focus:border-[#e5a93c]"
                />
              </div>

              <div>
                <label className="text-[#a0a0a0] block mb-1">Street Address / Shop No. *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Shop No. 12, Jewellery Market"
                  value={addressForm.addressLine}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine: e.target.value })}
                  className="w-full rounded-[10px] bg-[#141414] border border-[#2a2a2a] p-3 text-white outline-none focus:border-[#e5a93c]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[#a0a0a0] block mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="City"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full h-[42px] rounded-[10px] bg-[#141414] border border-[#2a2a2a] px-3 text-white outline-none focus:border-[#e5a93c]"
                  />
                </div>
                <div>
                  <label className="text-[#a0a0a0] block mb-1">State *</label>
                  <input
                    type="text"
                    required
                    placeholder="State"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="w-full h-[42px] rounded-[10px] bg-[#141414] border border-[#2a2a2a] px-3 text-white outline-none focus:border-[#e5a93c]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[#a0a0a0] block mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="6-digit Pincode"
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                    className="w-full h-[42px] rounded-[10px] bg-[#141414] border border-[#2a2a2a] px-3 text-white outline-none focus:border-[#e5a93c]"
                  />
                </div>
                <div>
                  <label className="text-[#a0a0a0] block mb-1">GSTIN (Optional)</label>
                  <input
                    type="text"
                    placeholder="15-digit GSTIN"
                    value={addressForm.gstin}
                    onChange={(e) => setAddressForm({ ...addressForm, gstin: e.target.value.toUpperCase() })}
                    className="w-full h-[42px] rounded-[10px] bg-[#141414] border border-[#2a2a2a] px-3 text-white outline-none focus:border-[#e5a93c]"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddAddressOpen(false)}
                  className="flex-1 h-[44px] rounded-[12px] bg-[#1c1c1c] text-[#8e8e93] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-[44px] rounded-[12px] bg-[#e5a93c] text-black font-semibold hover:bg-[#f5c767] transition-colors"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* Bottom Navigation Bar (Mobile Only: hidden on md:) */}
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

          {/* 3. Center Elevated Cart Button */}
          <div className="flex flex-col items-center justify-center flex-1 relative">
            <button
              type="button"
              onClick={navCart}
              className="w-[52px] h-[52px] rounded-full bg-[#f0a939] hover:bg-[#f5b842] text-[#111111] flex items-center justify-center shadow-[0_4px_20px_rgba(240,169,57,0.4)] -translate-y-5 transition-transform active:scale-95 cursor-pointer relative"
            >
              <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#e11d48] text-white text-[10px] font-bold flex items-center justify-center border-2 border-black">
                  {cartCount}
                </span>
              )}
            </button>
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

          {/* 5. Account (ACTIVE) */}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex flex-col items-center justify-center flex-1 text-[#e5a93c] gap-1 cursor-pointer"
          >
            <User className="w-5 h-5 fill-[#e5a93c]" />
            <span className="text-[11px] font-medium">Account</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
