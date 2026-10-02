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
  CheckCircle2,
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
    <header className="w-full bg-white select-none z-30 sticky top-0 shadow-sm border-b border-neutral-200">
      {/* 1. Top Announcement Bar */}
      <div className="w-full py-1.5 px-4 bg-[#0b6651] text-white text-center">
        <div className="max-w-7xl mx-auto flex items-center justify-center relative text-xs sm:text-[12.5px] font-medium tracking-wide">
          <p className="flex items-center gap-1.5 justify-center">
            <span className="text-[#f5c767]">★</span>
            {storeMode === "wholesale" ? (
              <span>
                B2B Wholesale Portal Active • Minimum Order: ₹3,000 across cart
              </span>
            ) : (
              <span>New customers enjoy 15% off on their first order</span>
            )}
            <span className="text-[#f5c767]">★</span>
          </p>

          {/* Desktop switch mode quick button in announcement bar */}
          {storeMode === "wholesale" && (
            <button
              type="button"
              onClick={() => onSwitchStoreMode("retail")}
              className="hidden md:inline-flex absolute right-0 text-[11px] text-[#f5c767] hover:underline items-center gap-1 cursor-pointer font-semibold"
            >
              <span>Return to Retail Store</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. DESKTOP HEADER BAR (lg:flex)                          */}
      {/* Matches user's uploaded reference screenshot             */}
      {/* ======================================================== */}
      <div className="hidden lg:block border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          {/* Brand Logo & Name */}
          <div
            onClick={onNavigateHome}
            title="Fab Creations - Home"
            className="flex items-center gap-3 cursor-pointer shrink-0 group"
          >
            <div className="w-12 h-12 relative rounded-full overflow-hidden shrink-0 border border-amber-300/70 shadow-xs group-hover:scale-105 transition-transform">
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
              <span className="text-lg font-serif font-bold text-neutral-900 tracking-wide block leading-tight group-hover:text-amber-700 transition-colors">
                FAB CREATIONS
              </span>
              <span className="text-[9.5px] text-neutral-400 tracking-[0.22em] uppercase font-semibold block">
                PRESENTED BY EEAS LIFESTYLE
              </span>
            </div>
          </div>

          {/* Pill Search Bar */}
          <div className="flex-1 max-w-xl mx-2 xl:mx-6">
            <div className="relative flex items-center w-full h-11 rounded-full border border-neutral-200 bg-neutral-50/70 hover:border-neutral-300 focus-within:border-teal-600 focus-within:bg-white transition-all px-4 gap-2.5 shadow-xs">
              <Search className="w-4 h-4 text-neutral-400 shrink-0" />
              <input
                type="text"
                placeholder="Search rings, necklaces, earrings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery?.(e.target.value)}
                onKeyDown={handleSearchKeyPress}
                className="flex-1 bg-transparent text-[13.5px] text-neutral-800 placeholder-neutral-400 outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery?.("")}
                  className="text-neutral-400 hover:text-neutral-600 p-0.5"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={onSearchSubmit}
                aria-label="Submit Search"
                className="text-teal-600 hover:text-teal-700 transition-colors p-1 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Action Icons & Buttons */}
          <div className="flex items-center gap-3 xl:gap-4 shrink-0">
            {/* DELIVER TO / Enter Pincode */}
            <button
              type="button"
              onClick={() => setIsPincodeModalOpen(true)}
              className="flex items-center gap-2 text-left hover:opacity-85 transition-opacity cursor-pointer group"
              title="Set Delivery Pincode"
            >
              <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shrink-0 shadow-xs group-hover:bg-teal-700 transition-colors">
                <MapPin className="w-4 h-4 fill-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9.5px] font-semibold text-neutral-400 uppercase tracking-wider leading-none">
                  DELIVER TO
                </span>
                <span className="text-[12.5px] font-bold text-neutral-800 leading-tight mt-0.5">
                  {deliveryPincode ? `Pin ${deliveryPincode}` : "Enter Pincode"}
                </span>
              </div>
            </button>

            {/* Login */}
            <button
              type="button"
              onClick={handleLoginClick}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 hover:text-teal-700 transition-colors cursor-pointer"
              title={isLoggedIn ? "View Account" : "Login"}
            >
              <LogIn className="w-4 h-4 text-neutral-700" />
              <span>{isLoggedIn ? userName || "Account" : "Login"}</span>
            </button>

            {/* Register Pill Button */}
            <button
              type="button"
              onClick={handleRegisterClick}
              className="h-9 px-4 rounded-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>{isLoggedIn ? "Profile" : "Register"}</span>
            </button>

            {/* Subtle Divider */}
            <div className="h-5 w-px bg-neutral-200" />

            {/* Wishlist Icon Button */}
            <button
              type="button"
              onClick={onNavigateAccount}
              title="Saved Items / Wishlist"
              className="w-9 h-9 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 flex items-center justify-center text-neutral-700 transition-all relative cursor-pointer shadow-xs"
            >
              <Heart
                className={`w-4 h-4 ${
                  wishlistCount > 0 ? "fill-rose-500 text-rose-500" : ""
                }`}
              />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[17px] h-[17px] px-1 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart Icon Button */}
            <button
              type="button"
              onClick={onNavigateCart}
              title="Shopping Cart"
              className="h-9 px-2.5 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 flex items-center justify-center gap-1 text-neutral-700 transition-all relative cursor-pointer shadow-xs"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 bg-teal-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. DESKTOP CATEGORIES & HAMBURGER LINKS ROW (lg:flex)    */}
      {/* Matches user's second reference screenshot               */}
      {/* ======================================================== */}
      <div className="hidden lg:block bg-white border-b border-neutral-200">
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
              className={`px-4 py-2.5 text-[13px] transition-all cursor-pointer ${
                isHomeActive
                  ? "bg-teal-50 text-teal-800 border-b-2 border-teal-600 font-semibold rounded-t-md"
                  : "text-neutral-700 hover:text-teal-700 font-medium hover:bg-neutral-50 rounded-md"
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
                  className={`px-3.5 py-2.5 text-[13px] whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? "bg-teal-50 text-teal-800 border-b-2 border-teal-600 font-semibold rounded-t-md"
                      : "text-neutral-700 hover:text-teal-700 font-medium hover:bg-neutral-50 rounded-md"
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
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100"
              }`}
              title="Access B2B Wholesale Portal"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>
                {storeMode === "wholesale"
                  ? "Wholesale Active"
                  : "Wholesale Portal"}
              </span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-black/10 font-bold uppercase">
                B2B
              </span>
            </button>

            {/* About Us */}
            {onOpenAboutUs && (
              <button
                type="button"
                onClick={onOpenAboutUs}
                className="text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors px-2 py-1 cursor-pointer"
              >
                About Us
              </button>
            )}

            {/* WhatsApp Support */}
            <a
              href="https://wa.me/916289417338?text=Hello%20Fab%20Creations"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-emerald-700 hover:text-emerald-800 transition-colors flex items-center gap-1 px-2 py-1 cursor-pointer"
              title="Chat on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">WhatsApp</span>
            </a>

            {/* Admin Panel */}
            <Link
              href="/admin"
              className="text-xs font-medium text-neutral-400 hover:text-neutral-800 transition-colors flex items-center gap-1 px-1.5 py-1 cursor-pointer"
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
      {/* Requirements:                                            */}
      {/* - NO Wholesale Portal link in mobile navbar              */}
      {/* - Account and Cart buttons are ALWAYS visible!           */}
      {/* ======================================================== */}
      <div className="lg:hidden flex flex-col w-full bg-white px-3 pt-2.5 pb-2 border-b border-neutral-200 gap-2">
        {/* Mobile Top Row: Hamburger | Logo | Account | Wishlist | Cart */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: Hamburger & Brand Logo */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenMenu}
              aria-label="Open Navigation Menu"
              className="w-9 h-9 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-800 hover:bg-neutral-200 transition-colors cursor-pointer shrink-0"
              title="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div
              onClick={onNavigateHome}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="w-8 h-8 relative rounded-full overflow-hidden border border-amber-300/70 shrink-0">
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
              <span className="text-sm font-serif font-bold text-neutral-900 tracking-wide">
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
              className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center cursor-pointer shrink-0"
              title={deliveryPincode ? `Pin ${deliveryPincode}` : "Set Pincode"}
            >
              <MapPin className="w-3.5 h-3.5 fill-teal-600" />
            </button>

            {/* Account Button (FIXED: ALWAYS VISIBLE ON MOBILE!) */}
            <button
              type="button"
              onClick={handleLoginClick}
              aria-label="Account"
              className="w-8 h-8 rounded-lg border border-neutral-200 bg-neutral-50 flex items-center justify-center text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer shrink-0"
              title="My Account"
            >
              <User className="w-4 h-4" />
            </button>

            {/* Wishlist Button */}
            <button
              type="button"
              onClick={onNavigateAccount}
              aria-label="Wishlist"
              className="w-8 h-8 rounded-lg border border-neutral-200 bg-neutral-50 flex items-center justify-center text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer shrink-0 relative"
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
              className="w-8 h-8 rounded-lg border border-neutral-200 bg-neutral-50 flex items-center justify-center text-neutral-800 hover:bg-neutral-100 transition-colors cursor-pointer shrink-0 relative"
              title="Cart"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-1 bg-teal-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Row 2: Full-Width Search Input */}
        <div className="relative flex items-center w-full h-9 rounded-full border border-neutral-200 bg-neutral-50/80 px-3 gap-2 focus-within:border-teal-600 focus-within:bg-white transition-all">
          <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <input
            type="text"
            placeholder="Search rings, necklaces, earrings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery?.(e.target.value)}
            onKeyDown={handleSearchKeyPress}
            className="flex-1 bg-transparent text-xs text-neutral-800 placeholder-neutral-400 outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery?.("")}
              className="text-neutral-400 hover:text-neutral-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onSearchSubmit}
            aria-label="Search"
            className="text-teal-600 hover:text-teal-700 transition-colors p-1"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile Row 3: Horizontal Scrollable Category Pills (NO Wholesale Portal link!) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5 pb-0.5">
          <button
            type="button"
            onClick={() => {
              onSelectCategory?.(null);
              onNavigateHome();
            }}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all cursor-pointer font-medium ${
              isHomeActive
                ? "bg-teal-600 text-white shadow-xs font-semibold"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            Home
          </button>

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
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all cursor-pointer font-medium ${
                  isActive
                    ? "bg-teal-600 text-white shadow-xs font-semibold"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. INTERACTIVE PINCODE DELIVERY MODAL                     */}
      {/* ======================================================== */}
      {isPincodeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-neutral-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => {
                setIsPincodeModalOpen(false);
                setPincodeMessage(null);
              }}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-500 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shrink-0">
                <MapPin className="w-5 h-5 fill-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 leading-tight">
                  Delivery Location
                </h3>
                <p className="text-[11px] text-neutral-500">
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
                  className="flex-1 px-3.5 py-2 rounded-xl border border-neutral-300 text-sm font-semibold tracking-wider text-neutral-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shrink-0 shadow-xs"
                >
                  Apply
                </button>
              </div>

              {pincodeMessage && (
                <p
                  className={`text-xs ${
                    pincodeMessage.includes("available")
                      ? "text-emerald-700 font-medium"
                      : "text-rose-600 font-medium"
                  }`}
                >
                  {pincodeMessage}
                </p>
              )}

              {/* Quick pincode chips */}
              <div className="pt-2 border-t border-neutral-100">
                <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider block mb-1.5">
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
                      className="px-2 py-1 rounded-lg bg-neutral-100 hover:bg-teal-50 hover:text-teal-700 text-[11px] text-neutral-700 transition-colors cursor-pointer"
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
