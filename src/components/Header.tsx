"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  MapPin,
  LogIn,
  User,
  Heart,
  ShoppingBag,
  ChevronDown,
  ArrowRight,
  Menu,
  X,
  Building2,
  Lock,
  MessageCircle,
} from "lucide-react";
import type { Category } from "@/lib/db";

interface HeaderProps {
  storeMode: "retail" | "wholesale";
  onSwitchStoreMode: (mode: "retail" | "wholesale") => void;
  isWholesaleLoggedIn: boolean;
  onOpenWholesaleLogin?: () => void;
  onOpenRetailLogin?: () => void;
  cartCount: number;
  wishlistCount?: number;
  onNavigateHome: () => void;
  onNavigateShop: (category?: string | null) => void;
  onNavigateCart: () => void;
  onNavigateAccount: () => void;
  onOpenAboutUs?: () => void;
  onOpenMenu?: () => void;
  activeCategory?: string | null;
  onSelectCategory?: (category: string | null) => void;
  categories?: Category[];
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  onSearchSubmit?: () => void;
  currentTab?: string;
}

const R2_BASE = "https://pub-ce8688bc6c654bcfb99716f7c9373bcd.r2.dev/fab-creations";
const LOGO_R2_URL = `${R2_BASE}/brand-logo.png`;

// Standard jewellery categories matching user reference design
const DEFAULT_CATEGORIES = [
  "Anklets",
  "Watches",
  "Gifting",
  "Bangles",
  "Bracelets",
  "Rings",
  "Earrings",
  "Chains",
];

export default function Header({
  storeMode,
  onSwitchStoreMode,
  isWholesaleLoggedIn,
  onOpenWholesaleLogin,
  onOpenRetailLogin,
  cartCount = 0,
  wishlistCount = 0,
  onNavigateHome,
  onNavigateShop,
  onNavigateCart,
  onNavigateAccount,
  onOpenAboutUs,
  onOpenMenu,
  activeCategory = null,
  onSelectCategory,
  categories = [],
  searchQuery = "",
  setSearchQuery,
  onSearchSubmit,
  currentTab = "home",
}: HeaderProps) {
  const [logoSrc, setLogoSrc] = useState(LOGO_R2_URL);
  const [deliveryPincode, setDeliveryPincode] = useState<string>("");
  const [isPincodeModalOpen, setIsPincodeModalOpen] = useState(false);
  const [pincodeInput, setPincodeInput] = useState("");
  const [pincodeMessage, setPincodeMessage] = useState<string | null>(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string>("");

  // Load saved pincode & user login status
  useEffect(() => {
    try {
      const savedPin = localStorage.getItem("fc_delivery_pincode");
      if (savedPin) setDeliveryPincode(savedPin);

      const checkAuth = () => {
        const wholesaleAuth =
          localStorage.getItem("fc_wholesale_logged_in") === "true";
        const retailAuth =
          localStorage.getItem("fc_retail_logged_in") === "true" ||
          localStorage.getItem("fc_user_logged_in") === "true";

        const logged = storeMode === "wholesale" ? wholesaleAuth : retailAuth;
        setIsLoggedIn(logged);

        const name =
          localStorage.getItem("fc_user_name") ||
          (storeMode === "wholesale"
            ? localStorage.getItem("fc_wholesale_company") || "Partner"
            : "Customer");
        setUserName(name);
      };

      checkAuth();
      window.addEventListener("storage", checkAuth);
      window.addEventListener("wholesale_auth_changed", checkAuth);
      return () => {
        window.removeEventListener("storage", checkAuth);
        window.removeEventListener("wholesale_auth_changed", checkAuth);
      };
    } catch {}
  }, [storeMode]);

  // Combine default categories with any dynamic categories from database
  const displayedCategories = React.useMemo(() => {
    const list = [...DEFAULT_CATEGORIES];
    if (Array.isArray(categories)) {
      categories.forEach((c) => {
        if (
          c &&
          c.name &&
          c.name.toLowerCase() !== "test" &&
          !list.some((item) => item.toLowerCase() === c.name.toLowerCase())
        ) {
          list.push(c.name);
        }
      });
    }
    return list;
  }, [categories]);

  const handleApplyPincode = (pin: string) => {
    const clean = pin.trim().replace(/\D/g, "");
    if (clean.length === 6) {
      setDeliveryPincode(clean);
      try {
        localStorage.setItem("fc_delivery_pincode", clean);
      } catch {}
      setPincodeMessage(`Delivery available for PIN ${clean} (Est. 2-4 days)`);
      setTimeout(() => {
        setIsPincodeModalOpen(false);
        setPincodeMessage(null);
      }, 1200);
    } else {
      setPincodeMessage("Please enter a valid 6-digit PIN code");
    }
  };

  const handleLoginClick = () => {
    if (isLoggedIn) {
      onNavigateAccount();
    } else if (storeMode === "wholesale") {
      onOpenWholesaleLogin?.();
    } else {
      onOpenRetailLogin?.();
    }
  };

  const handleRegisterClick = () => {
    if (isLoggedIn) {
      onNavigateAccount();
    } else if (storeMode === "wholesale") {
      onOpenWholesaleLogin?.();
    } else {
      onOpenRetailLogin?.();
    }
  };

  const handleWholesaleToggle = () => {
    if (storeMode === "wholesale") {
      onSwitchStoreMode("retail");
      onNavigateHome();
    } else {
      onSwitchStoreMode("wholesale");
      if (!isWholesaleLoggedIn && onOpenWholesaleLogin) {
        onOpenWholesaleLogin();
      }
      onNavigateShop(null);
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSearchSubmit?.();
    }
  };

  const isHomeActive = currentTab === "home" && !activeCategory;

  return (
    <header className="w-full bg-[#050505] text-white select-none z-30 sticky top-0 shadow-[0_4px_25px_rgba(0,0,0,0.85)] border-b border-[#181818]">
      {/* 1. Top Announcement Bar in Luxury Dark & Gold */}
      <div className="w-full py-1.5 px-4 bg-gradient-to-r from-[#0a0804] via-[#140e06] to-[#0a0804] border-b border-[#201808] text-center">
        <div className="max-w-7xl mx-auto flex items-center justify-center relative text-xs sm:text-[12.5px] font-medium tracking-wide">
          <p className="flex items-center gap-1.5 justify-center text-[#e5a93c]">
            <span className="text-[#f5c767]">★</span>
            {storeMode === "wholesale" ? (
              <span className="text-[#f5c767]">
                B2B Wholesale Portal Active • Minimum Order: ₹3,000 across cart
              </span>
            ) : (
              <span>New customers enjoy 15% off on their first order • Code: <strong className="text-white">FAB15</strong></span>
            )}
            <span className="text-[#f5c767]">★</span>
          </p>

          {/* Desktop switch mode quick button in announcement bar */}
          {storeMode === "wholesale" && (
            <button
              type="button"
              onClick={() => onSwitchStoreMode("retail")}
              className="hidden md:inline-flex absolute right-0 text-[11px] text-[#e5a93c] hover:text-[#f5c767] hover:underline items-center gap-1 cursor-pointer font-semibold"
            >
              <span>Return to Retail Store</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. DESKTOP HEADER BAR (lg:flex)                          */}
      {/* Layout from user reference, matched to Dark Gold theme   */}
      {/* ======================================================== */}
      <div className="hidden lg:block border-b border-[#161616] bg-[#070707]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          {/* Brand Logo & Name */}
          <div
            onClick={onNavigateHome}
            title="Fab Creations - Home"
            className="flex items-center gap-3 cursor-pointer shrink-0 group"
          >
            <div className="w-12 h-12 relative rounded-full overflow-hidden shrink-0 border border-[#e5a93c]/50 p-0.5 shadow-[0_0_15px_rgba(229,169,60,0.2)] group-hover:scale-105 transition-transform">
              <Image
                src={logoSrc}
                alt="Fab Creations Logo"
                width={48}
                height={48}
                priority
                unoptimized
                onError={() => setLogoSrc("/images/logo.png")}
                className="object-contain w-full h-full"
              />
            </div>
            <div>
              <span className="text-lg font-serif font-bold text-white tracking-wide block leading-tight group-hover:text-[#e5a93c] transition-colors">
                FAB CREATIONS
              </span>
              <span className="text-[9.5px] text-[#e5a93c] tracking-[0.22em] uppercase font-semibold block">
                {storeMode === "wholesale" ? "Wholesale B2B Portal" : "Luxury Jewellery"}
              </span>
            </div>
          </div>

          {/* Pill Search Bar in Dark Luxury Theme */}
          <div className="flex-1 max-w-xl mx-2 xl:mx-6">
            <div className="relative flex items-center w-full h-11 rounded-full border border-[#282828] bg-[#0f0f0f] hover:border-[#383838] focus-within:border-[#e5a93c] focus-within:bg-[#141414] transition-all px-4 gap-2.5 shadow-inner">
              <Search className="w-4 h-4 text-[#8e8e93] shrink-0" />
              <input
                type="text"
                placeholder="Search rings, necklaces, earrings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery?.(e.target.value)}
                onKeyDown={handleSearchKeyPress}
                className="flex-1 bg-transparent text-[13.5px] text-white placeholder-[#8e8e93] outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery?.("")}
                  className="text-[#8e8e93] hover:text-white p-0.5"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={onSearchSubmit}
                aria-label="Submit Search"
                className="text-[#e5a93c] hover:text-[#f5c767] transition-colors p-1 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Action Icons & Buttons */}
          <div className="flex items-center gap-3 xl:gap-4 shrink-0">
            {/* DELIVER TO / Enter Pincode in Dark Luxury Theme */}
            <button
              type="button"
              onClick={() => setIsPincodeModalOpen(true)}
              className="flex items-center gap-2 text-left hover:opacity-90 transition-opacity cursor-pointer group"
              title="Set Delivery Pincode"
            >
              <div className="w-9 h-9 rounded-xl bg-[#18140a] border border-[#e5a93c]/50 flex items-center justify-center text-[#e5a93c] shrink-0 shadow-sm group-hover:border-[#e5a93c] group-hover:scale-105 transition-all">
                <MapPin className="w-4 h-4 fill-[#e5a93c]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9.5px] font-semibold text-[#8e8e93] uppercase tracking-wider leading-none">
                  DELIVER TO
                </span>
                <span className="text-[12.5px] font-bold text-white group-hover:text-[#f5c767] leading-tight mt-0.5 transition-colors">
                  {deliveryPincode ? `Pin ${deliveryPincode}` : "Enter Pincode"}
                </span>
              </div>
            </button>

            {/* Login */}
            <button
              type="button"
              onClick={handleLoginClick}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-[#c5c5c5] hover:text-[#e5a93c] transition-colors cursor-pointer"
              title={isLoggedIn ? "View Account" : "Login"}
            >
              <LogIn className="w-4 h-4 text-[#e5a93c]" />
              <span>{isLoggedIn ? userName || "Account" : "Login"}</span>
            </button>

            {/* Register Pill Button in Gold Theme */}
            <button
              type="button"
              onClick={handleRegisterClick}
              className="h-9 px-4 rounded-full bg-gradient-to-r from-[#e5a93c] to-[#f5c767] hover:brightness-110 text-black text-xs font-bold flex items-center gap-1.5 shadow-[0_2px_12px_rgba(229,169,60,0.25)] transition-all active:scale-95 cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>{isLoggedIn ? "Profile" : "Register"}</span>
            </button>

            {/* Subtle Divider */}
            <div className="h-5 w-px bg-[#262626]" />

            {/* Wishlist Icon Button in Dark Theme */}
            <button
              type="button"
              onClick={onNavigateAccount}
              title="Saved Items / Wishlist"
              className="w-9 h-9 rounded-xl border border-[#262626] bg-[#0e0e0e] hover:border-[#e5a93c]/60 hover:bg-[#161616] flex items-center justify-center text-[#e5a93c] transition-all relative cursor-pointer shadow-sm"
            >
              <Heart
                className={`w-4 h-4 ${
                  wishlistCount > 0 ? "fill-rose-500 text-rose-500" : ""
                }`}
              />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[17px] h-[17px] px-1 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart Icon Button in Dark Theme */}
            <button
              type="button"
              onClick={onNavigateCart}
              title="Shopping Cart"
              className="h-9 px-2.5 rounded-xl border border-[#262626] bg-[#0e0e0e] hover:border-[#e5a93c]/60 hover:bg-[#161616] flex items-center justify-center gap-1 text-[#e5a93c] transition-all relative cursor-pointer shadow-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-[#d4992e] to-[#f5c767] text-black text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              )}
              <ChevronDown className="w-3 h-3 text-[#8e8e93]" />
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. DESKTOP CATEGORIES & HAMBURGER LINKS ROW (lg:flex)    */}
      {/* Dark Luxury Gold Theme                                   */}
      {/* ======================================================== */}
      <div className="hidden lg:block bg-[#090909] border-b border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Categories Bar */}
          <nav className="flex items-center space-x-1 py-1 overflow-x-auto no-scrollbar">
            {/* Home Tab */}
            <button
              type="button"
              onClick={() => {
                onSelectCategory?.(null);
                onNavigateHome();
              }}
              className={`px-4 py-2 text-[13px] transition-all cursor-pointer ${
                isHomeActive
                  ? "bg-[#1c160a] text-[#f5c767] border-b-2 border-[#e5a93c] font-semibold rounded-t-md"
                  : "text-[#a0a0a0] hover:text-[#f5c767] font-medium hover:bg-white/5 rounded-md"
              }`}
            >
              Home
            </button>

            {/* Category tabs */}
            {displayedCategories.map((cat) => {
              const isActive =
                activeCategory?.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    onSelectCategory?.(cat);
                    onNavigateShop(cat);
                  }}
                  className={`px-3.5 py-2 text-[13px] whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#1c160a] text-[#f5c767] border-b-2 border-[#e5a93c] font-semibold rounded-t-md"
                      : "text-[#a0a0a0] hover:text-[#f5c767] font-medium hover:bg-white/5 rounded-md"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </nav>

          {/* Desktop Links transferred from hamburger drawer */}
          <div className="flex items-center gap-3 shrink-0 ml-4 py-1">
            {/* Wholesale Portal (Desktop Only) */}
            <button
              type="button"
              onClick={handleWholesaleToggle}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                storeMode === "wholesale"
                  ? "bg-[#e5a93c] text-black shadow-md font-bold"
                  : "bg-[#181308] border border-[#e5a93c]/50 text-[#e5a93c] hover:bg-[#e5a93c] hover:text-black"
              }`}
              title="Access B2B Wholesale Portal"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>
                {storeMode === "wholesale"
                  ? "Wholesale Active"
                  : "Wholesale Portal"}
              </span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-black/20 font-bold uppercase">
                B2B
              </span>
            </button>

            {/* About Us */}
            {onOpenAboutUs && (
              <button
                type="button"
                onClick={onOpenAboutUs}
                className="text-xs font-medium text-[#a0a0a0] hover:text-white transition-colors px-2 py-1 cursor-pointer"
              >
                About Us
              </button>
            )}

            {/* WhatsApp Support */}
            <a
              href="https://wa.me/916289417338?text=Hello%20Fab%20Creations"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 px-2 py-1 cursor-pointer"
              title="Chat on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Support</span>
            </a>

            {/* Admin Panel */}
            <Link
              href="/admin"
              className="text-xs font-medium text-[#777] hover:text-[#e5a93c] transition-colors flex items-center gap-1 px-1.5 py-1 cursor-pointer"
              title="Admin Panel"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Admin</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. MOBILE NAVBAR (lg:hidden)                             */}
      {/* Matches Website Dark Gold Theme                          */}
      {/* - NO Wholesale Portal link in mobile navbar              */}
      {/* - Account and Cart buttons are ALWAYS visible!           */}
      {/* ======================================================== */}
      <div className="lg:hidden flex flex-col w-full bg-[#070707] px-3 pt-2.5 pb-2 border-b border-[#181818] gap-2">
        {/* Mobile Top Row: Hamburger | Logo | Pincode | Account | Wishlist | Cart */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: Hamburger & Brand Logo */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenMenu}
              aria-label="Open Navigation Menu"
              className="w-9 h-9 rounded-xl bg-[#0f0f0f] border border-[#262626] flex items-center justify-center text-[#e5a93c] hover:border-[#e5a93c]/60 active:scale-95 transition-all cursor-pointer shrink-0"
              title="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div
              onClick={onNavigateHome}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div className="w-8 h-8 relative rounded-full overflow-hidden border border-[#e5a93c]/50 p-0.5 shrink-0">
                <Image
                  src={logoSrc}
                  alt="Fab Creations"
                  width={32}
                  height={32}
                  priority
                  unoptimized
                  onError={() => setLogoSrc("/images/logo.png")}
                  className="object-contain w-full h-full"
                />
              </div>
              <span className="text-sm font-serif font-bold text-white tracking-wide group-hover:text-[#e5a93c] transition-colors">
                FAB CREATIONS
              </span>
            </div>
          </div>

          {/* Right: Deliver Pin + Account + Wishlist + Cart (NEVER HIDDEN!) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick Pincode Icon Button */}
            <button
              type="button"
              onClick={() => setIsPincodeModalOpen(true)}
              aria-label="Delivery Pincode"
              className="w-8 h-8 rounded-lg bg-[#14120a] border border-[#e5a93c]/40 text-[#e5a93c] flex items-center justify-center cursor-pointer shrink-0"
              title={deliveryPincode ? `Pin ${deliveryPincode}` : "Set Pincode"}
            >
              <MapPin className="w-3.5 h-3.5 fill-[#e5a93c]" />
            </button>

            {/* Account Button (FIXED: ALWAYS VISIBLE ON MOBILE!) */}
            <button
              type="button"
              onClick={handleLoginClick}
              aria-label="Account"
              className="w-8 h-8 rounded-lg border border-[#262626] bg-[#0e0e0e] flex items-center justify-center text-[#e5a93c] hover:text-white hover:border-[#444] transition-colors cursor-pointer shrink-0"
              title="My Account"
            >
              <User className="w-4 h-4" />
            </button>

            {/* Wishlist Button */}
            <button
              type="button"
              onClick={onNavigateAccount}
              aria-label="Wishlist"
              className="w-8 h-8 rounded-lg border border-[#262626] bg-[#0e0e0e] flex items-center justify-center text-[#e5a93c] hover:border-[#444] transition-colors cursor-pointer shrink-0 relative"
              title="Saved Items"
            >
              <Heart
                className={`w-3.5 h-3.5 ${
                  wishlistCount > 0 ? "fill-rose-500 text-rose-500" : ""
                }`}
              />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-0.5 bg-rose-500 text-white text-[8.5px] font-bold rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart Button (FIXED: ALWAYS VISIBLE ON MOBILE!) */}
            <button
              type="button"
              onClick={onNavigateCart}
              aria-label="Shopping Cart"
              className="w-8 h-8 rounded-lg border border-[#262626] bg-[#0e0e0e] flex items-center justify-center text-[#e5a93c] hover:border-[#e5a93c]/60 transition-colors cursor-pointer shrink-0 relative"
              title="Cart"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-1 bg-gradient-to-r from-[#d4992e] to-[#f5c767] text-black text-[9px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Row 2: Full-Width Search Input in Dark Luxury Theme */}
        <div className="relative flex items-center w-full h-9 rounded-full border border-[#282828] bg-[#0f0f0f] px-3 gap-2 focus-within:border-[#e5a93c] focus-within:bg-[#141414] transition-all">
          <Search className="w-3.5 h-3.5 text-[#8e8e93] shrink-0" />
          <input
            type="text"
            placeholder="Search rings, necklaces, earrings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery?.(e.target.value)}
            onKeyDown={handleSearchKeyPress}
            className="flex-1 bg-transparent text-xs text-white placeholder-[#8e8e93] outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery?.("")}
              className="text-[#8e8e93] hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onSearchSubmit}
            aria-label="Search"
            className="text-[#e5a93c] hover:text-[#f5c767] transition-colors p-1"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. INTERACTIVE PINCODE DELIVERY MODAL (Dark Gold Theme)   */}
      {/* ======================================================== */}
      {isPincodeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0e0e0e] rounded-2xl p-5 shadow-2xl border border-[#2a2a2a] relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => {
                setIsPincodeModalOpen(false);
                setPincodeMessage(null);
              }}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#181818] hover:bg-[#252525] border border-[#333] flex items-center justify-center text-[#8e8e93] hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#1c1508] border border-[#e5a93c]/50 flex items-center justify-center text-[#e5a93c] shrink-0">
                <MapPin className="w-5 h-5 fill-[#e5a93c]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-tight">
                  Delivery Location
                </h3>
                <p className="text-[11px] text-[#8e8e93]">
                  Enter 6-digit PIN code to check shipping
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleApplyPincode(pincodeInput);
              }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={pincodeInput}
                  onChange={(e) => setPincodeInput(e.target.value)}
                  placeholder="e.g. 226001"
                  className="flex-1 px-3.5 py-2 rounded-xl bg-[#161616] border border-[#333] text-sm font-semibold tracking-wider text-white placeholder-[#777] focus:border-[#e5a93c] outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-[#e5a93c] to-[#f5c767] hover:brightness-110 text-black text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 shadow-sm"
                >
                  Apply
                </button>
              </div>

              {pincodeMessage && (
                <p
                  className={`text-xs ${
                    pincodeMessage.includes("available")
                      ? "text-emerald-400 font-medium"
                      : "text-rose-400 font-medium"
                  }`}
                >
                  {pincodeMessage}
                </p>
              )}

              {/* Quick pincode chips */}
              <div className="pt-2 border-t border-[#222]">
                <span className="text-[10px] text-[#8e8e93] font-medium uppercase tracking-wider block mb-1.5">
                  Popular Locations
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { city: "Lucknow", pin: "226001" },
                    { city: "Delhi", pin: "110001" },
                    { city: "Mumbai", pin: "400001" },
                    { city: "Bengaluru", pin: "560001" },
                    { city: "Kolkata", pin: "700001" },
                  ].map((loc) => (
                    <button
                      key={loc.pin}
                      type="button"
                      onClick={() => {
                        setPincodeInput(loc.pin);
                        handleApplyPincode(loc.pin);
                      }}
                      className="px-2 py-1 rounded-lg bg-[#141414] hover:bg-[#1f190c] hover:border-[#e5a93c]/50 border border-[#262626] text-[11px] text-[#c5c5c5] hover:text-[#f5c767] transition-all cursor-pointer"
                    >
                      {loc.city} ({loc.pin})
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
