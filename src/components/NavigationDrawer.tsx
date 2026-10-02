"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  Building2,
  ShoppingBag,
  Home,
  Grid,
  LayoutGrid,
  Sparkles,
  User,
  Package,
  Heart,
  Lock,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  Phone,
  LogOut,
  MessageCircle,
} from "lucide-react";

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  storeMode: "retail" | "wholesale";
  onSwitchStoreMode: (mode: "retail" | "wholesale") => void;
  isWholesaleLoggedIn: boolean;
  isRetailLoggedIn?: boolean;
  onOpenWholesaleLogin?: () => void;
  onNavigateHome?: () => void;
  onNavigateShop?: (category?: string | null) => void;
  onNavigateCart?: () => void;
  onNavigateAccount?: () => void;
  onOpenAboutUs?: () => void;
  onOpenCategories?: () => void;
  onSignOut?: () => void;
  cartCount?: number;
}

const LOGO_R2_URL =
  "https://pub-ce8688bc6c654bcfb99716f7c9373bcd.r2.dev/fab-creations/brand-logo.png";

export default function NavigationDrawer({
  isOpen,
  onClose,
  storeMode,
  onSwitchStoreMode,
  isWholesaleLoggedIn,
  isRetailLoggedIn = false,
  onOpenWholesaleLogin,
  onNavigateHome,
  onNavigateShop,
  onNavigateCart,
  onNavigateAccount,
  onOpenAboutUs,
  onOpenCategories,
  onSignOut,
  cartCount = 0,
}: NavigationDrawerProps) {
  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleEnterWholesale = () => {
    onSwitchStoreMode("wholesale");
    if (!isWholesaleLoggedIn && onOpenWholesaleLogin) {
      onOpenWholesaleLogin();
    }
    onNavigateShop?.();
    onClose();
  };

  const handleSwitchToRetail = () => {
    onSwitchStoreMode("retail");
    onNavigateHome?.();
    onClose();
  };

  const navTo = (action?: () => void) => {
    if (action) action();
    onClose();
  };

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Slide-over Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Menu"
        className={`fixed top-0 left-0 bottom-0 w-[84%] max-w-[340px] bg-[#0c0c0c] border-r border-[#242424] z-50 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Header & Branding */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-5 border-b border-[#1c1c1c] flex items-center justify-between bg-gradient-to-b from-[#141414] to-[#0c0c0c]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 relative rounded-full overflow-hidden border border-[#e5a93c]/50 p-0.5 shrink-0 shadow-[0_0_15px_rgba(229,169,60,0.2)]">
                <Image
                  src={LOGO_R2_URL}
                  alt="Fab Creations"
                  width={44}
                  height={44}
                  unoptimized
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/images/logo.png";
                  }}
                  className="object-contain w-full h-full"
                />
              </div>
              <div>
                <h3 className="text-white text-[15px] font-serif font-medium leading-tight">
                  Fab Creations
                </h3>
                <p className="text-[#8e8e93] text-[11px] mt-0.5">
                  Jewellery & Wholesale
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="w-8 h-8 rounded-full bg-[#181818] border border-[#2a2a2a] flex items-center justify-center text-[#8e8e93] hover:text-white hover:border-[#e5a93c] transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* ========================================================= */}
            {/* WHOLESALE PORTAL ACCESS SECTION                           */}
            {/* ========================================================= */}
            {storeMode === "retail" ? (
              // Option to Enter Wholesale Portal (only shown when NOT logged in as a retail customer)
              !isRetailLoggedIn ? (
                <div
                  onClick={handleEnterWholesale}
                  className="w-full p-3.5 rounded-2xl bg-gradient-to-br from-[#1c1508] via-[#141008] to-[#0d0d0d] border border-[#e5a93c]/70 shadow-[0_4px_20px_rgba(229,169,60,0.18)] hover:border-[#f5c767] transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#261d0d] border border-[#e5a93c]/50 flex items-center justify-center text-[#e5a93c] shrink-0 group-hover:scale-105 transition-transform">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white text-[14px] font-semibold group-hover:text-[#f5c767] transition-colors">
                            Wholesale Portal
                          </span>
                          <span className="px-1.5 py-0.2 rounded-full bg-[#e5a93c] text-black text-[9px] font-bold uppercase tracking-wider">
                            B2B
                          </span>
                        </div>
                        <p className="text-[#a0a0a0] text-[11px] mt-0.5 leading-snug">
                          Bulk orders & wholesale prices
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#e5a93c] group-hover:translate-x-1 transition-transform mt-1" />
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#262626] flex items-center justify-between text-[11px]">
                    <span className="text-[#8e8e93]">Min. Order: ₹3,000</span>
                    <span className="text-[#e5a93c] font-medium flex items-center gap-1">
                      {isWholesaleLoggedIn ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Unlocked
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Lock className="w-3 h-3" /> OTP Login
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              ) : null
            ) : (
              // Option to Return to Retail Store (when in Wholesale Mode and not wholesale logged in)
              !isWholesaleLoggedIn ? (
                <div className="w-full p-3.5 rounded-2xl bg-gradient-to-br from-[#121c10] via-[#0d140c] to-[#0a0f09] border border-emerald-500/50 shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-emerald-300 font-semibold text-xs uppercase tracking-wider">
                        Wholesale Mode Active
                      </span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[9.5px] bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                      B2B
                    </span>
                  </div>
                  <p className="text-[#a0a0a0] text-[11px] leading-relaxed mb-3">
                    You are viewing wholesale prices. Min order requirement is ₹3,000.
                  </p>
                  <button
                    type="button"
                    onClick={handleSwitchToRetail}
                    className="w-full py-2 px-3 rounded-xl bg-[#141414] hover:bg-[#1e1e1e] border border-[#2a2a2a] text-white text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-[#e5a93c]" />
                    <span>Switch to Retail Store</span>
                  </button>
                </div>
              ) : null
            )}

            {/* Section Divider */}
            <div className="pt-1 pb-1">
              <span className="text-[10px] font-semibold text-[#666] uppercase tracking-wider px-1">
                Navigation
              </span>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-1">
              {/* Home */}
              <button
                type="button"
                onClick={() => navTo(onNavigateHome)}
                className="w-full px-3 py-2.5 rounded-xl hover:bg-[#171717] text-[#c4c4c4] hover:text-white transition-all flex items-center justify-between group cursor-pointer text-[13.5px]"
              >
                <div className="flex items-center gap-3">
                  <Home className="w-4 h-4 text-[#e5a93c] group-hover:scale-110 transition-transform" />
                  <span>Home</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#555] group-hover:text-white transition-colors" />
              </button>

              {/* All Jewellery / Shop */}
              <button
                type="button"
                onClick={() => navTo(() => onNavigateShop?.(null))}
                className="w-full px-3 py-2.5 rounded-xl hover:bg-[#171717] text-[#c4c4c4] hover:text-white transition-all flex items-center justify-between group cursor-pointer text-[13.5px]"
              >
                <div className="flex items-center gap-3">
                  <Grid className="w-4 h-4 text-[#e5a93c] group-hover:scale-110 transition-transform" />
                  <span>All Jewellery / Catalogue</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#555] group-hover:text-white transition-colors" />
              </button>

              {/* Categories */}
              {onOpenCategories && (
                <button
                  type="button"
                  onClick={() => navTo(onOpenCategories)}
                  className="w-full px-3 py-2.5 rounded-xl hover:bg-[#171717] text-[#c4c4c4] hover:text-white transition-all flex items-center justify-between group cursor-pointer text-[13.5px]"
                >
                  <div className="flex items-center gap-3">
                    <LayoutGrid className="w-4 h-4 text-[#e5a93c] group-hover:scale-110 transition-transform" />
                    <span>Browse Categories</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#555] group-hover:text-white transition-colors" />
                </button>
              )}

              {/* About Us */}
              {onOpenAboutUs && (
                <button
                  type="button"
                  onClick={() => navTo(onOpenAboutUs)}
                  className="w-full px-3 py-2.5 rounded-xl hover:bg-[#171717] text-[#c4c4c4] hover:text-white transition-all flex items-center justify-between group cursor-pointer text-[13.5px]"
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-[#e5a93c] group-hover:scale-110 transition-transform" />
                    <span>About Us</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#555] group-hover:text-white transition-colors" />
                </button>
              )}

              {/* Cart */}
              <button
                type="button"
                onClick={() => navTo(onNavigateCart)}
                className="w-full px-3 py-2.5 rounded-xl hover:bg-[#171717] text-[#c4c4c4] hover:text-white transition-all flex items-center justify-between group cursor-pointer text-[13.5px]"
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-4 h-4 text-[#e5a93c] group-hover:scale-110 transition-transform" />
                  <span>
                    {storeMode === "wholesale" ? "Wholesale Cart" : "Cart"}
                  </span>
                </div>
                {cartCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-[#e5a93c] text-black text-xs font-bold">
                    {cartCount}
                  </span>
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-[#555] group-hover:text-white transition-colors" />
                )}
              </button>

              {/* Account / Orders */}
              <button
                type="button"
                onClick={() => navTo(onNavigateAccount)}
                className="w-full px-3 py-2.5 rounded-xl hover:bg-[#171717] text-[#c4c4c4] hover:text-white transition-all flex items-center justify-between group cursor-pointer text-[13.5px]"
              >
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-[#e5a93c] group-hover:scale-110 transition-transform" />
                  <span>My Account & Profile</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#555] group-hover:text-white transition-colors" />
              </button>

              {/* Admin Panel Link */}
              <Link
                href="/admin"
                onClick={onClose}
                className="w-full px-3 py-2.5 rounded-xl hover:bg-[#171717] text-[#8e8e93] hover:text-white transition-all flex items-center justify-between group cursor-pointer text-[13px]"
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-4 h-4 text-[#777] group-hover:text-[#e5a93c] transition-colors" />
                  <span>Admin Panel</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#555]" />
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom Footer Info & Support */}
        <div className="p-4 border-t border-[#1c1c1c] bg-[#0a0a0a] space-y-3">
          {/* WhatsApp Support Button */}
          <a
            href="https://wa.me/916289417338?text=Hello%20Fab%20Creations"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-3 rounded-xl bg-[#141b12] hover:bg-[#1a2517] border border-emerald-500/40 text-emerald-400 text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat on WhatsApp Support</span>
          </a>

          {/* Sign Out if logged in */}
          {((storeMode === "wholesale" && isWholesaleLoggedIn) || (storeMode === "retail" && isRetailLoggedIn)) && onSignOut && (
            <button
              type="button"
              onClick={() => {
                onSignOut();
                onClose();
              }}
              className="w-full py-2 px-3 rounded-xl bg-[#181818] hover:bg-red-950/40 border border-[#2a2a2a] hover:border-red-500/40 text-[#8e8e93] hover:text-red-300 text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{storeMode === "wholesale" ? "Sign Out of Wholesale" : "Sign Out of Account"}</span>
            </button>
          )}

          <div className="text-center pt-1">
            <p className="text-[#666] text-[11px]">
              Fab Creation • Lucknow, India
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
