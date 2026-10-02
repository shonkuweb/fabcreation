"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  ChevronRight,
  ChevronUp,
  Facebook,
  Instagram,
  Youtube,
} from "lucide-react";

import { useRouter } from "next/navigation";
import AboutUsModal from "@/components/AboutUsModal";

interface FooterProps {
  onNavigateShop?: () => void;
  onNavigateHome?: () => void;
  onNavigateAccount?: () => void;
}

const LOGO_R2_URL = "https://pub-ce8688bc6c654bcfb99716f7c9373bcd.r2.dev/fab-creations/brand-logo.png";

export default function Footer({ onNavigateShop, onNavigateHome, onNavigateAccount }: FooterProps) {
  const router = useRouter();
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const navShop = onNavigateShop || (() => router.push("/shop"));
  const navHome = onNavigateHome || (() => router.push("/home"));
  const navAccount = onNavigateAccount || (() => router.push("/account"));
  const navWholesale = () => router.push("/wholesale");

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative w-full bg-[#050505] text-white pt-10 pb-20 border-t border-[#1a160f] overflow-hidden">
      {/* Decorative Gold Floral Petals Accent on Right */}
      <div 
        className="pointer-events-none absolute right-0 top-0 w-[240px] h-[340px] opacity-25"
        style={{
          backgroundImage: `radial-gradient(ellipse at 100% 20%, rgba(229,169,60,0.3) 0%, rgba(140,88,29,0.15) 45%, transparent 75%)`,
        }}
      />
      {/* SVG Decorative Botanical Accent */}
      <svg
        className="pointer-events-none absolute -right-8 top-4 w-48 h-72 opacity-20 text-[#e5a93c]"
        viewBox="0 0 100 150"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      >
        <path d="M90,10 C60,40 40,80 90,140" />
        <path d="M85,25 C50,55 35,95 85,130" />
        <path d="M70,45 C45,70 30,105 75,125" />
        <circle cx="75" cy="35" r="3" fill="currentColor" />
        <circle cx="60" cy="65" r="2.5" fill="currentColor" />
        <circle cx="85" cy="85" r="2" fill="currentColor" />
        <polygon points="75,20 78,25 83,26 79,30 80,35 75,32 70,35 71,30 67,26 72,25" fill="currentColor" />
      </svg>

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 flex flex-col">
        {/* 4-Column Grid on Tablet & Desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Column 1: Brand Info */}
          <div className="space-y-4">
            <div className="w-[64px] h-[64px] relative rounded-full overflow-hidden border border-[#332512]">
              <Image
                src={LOGO_R2_URL}
                alt="Fab Creations"
                width={75}
                height={75}
                priority
                unoptimized
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/images/logo.png";
                }}
                className="object-contain w-full h-full"
              />
            </div>

            <p className="text-[#c5c5c5] text-xs sm:text-sm leading-relaxed font-normal max-w-xs">
              Jewellery that completes the look. A collection that creates the impression. Based in Lucknow, serving wholesale and retail with timeless craftsmanship and modern commerce.
            </p>

            {/* Social Media Links */}
            <div className="flex items-center gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-[#e5a93c] flex items-center justify-center text-[#e5a93c] hover:bg-[#e5a93c] hover:text-black transition-all"
                title="Facebook"
              >
                <Facebook className="w-4 h-4 fill-current" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-[#e5a93c] flex items-center justify-center text-[#e5a93c] hover:bg-[#e5a93c] hover:text-black transition-all"
                title="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-[#e5a93c] flex items-center justify-center text-[#e5a93c] hover:bg-[#e5a93c] hover:text-black transition-all"
                title="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <div className="w-6 h-[1px] bg-[#5a4215]" />
              <span className="text-[#c89736] text-[10px] tracking-[0.25em] font-semibold uppercase">
                SPARKLES BEYOND ORDINARY
              </span>
            </div>
          </div>

          {/* Column 2: Shop & Portals */}
          <div>
            <h4 className="text-white text-base sm:text-lg font-serif font-medium tracking-tight mb-2">
              Explore & Shop
            </h4>
            <div className="w-12 h-[1.5px] bg-[#e5a93c] mb-4" />

            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <button
                  type="button"
                  onClick={navShop}
                  className="flex items-center gap-2 text-[#d1d5db] hover:text-[#e5a93c] transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-[#e5a93c]" />
                  <span>Retail Collection</span>
                </button>
              </li>
              <li>
                <a
                  href="/wholesale"
                  onClick={(e) => {
                    e.preventDefault();
                    navWholesale();
                  }}
                  className="flex items-center gap-2 text-[#d1d5db] hover:text-[#e5a93c] transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-[#e5a93c]" />
                  <span>B2B Wholesale Portal</span>
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={navAccount}
                  className="flex items-center gap-2 text-[#d1d5db] hover:text-[#e5a93c] transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-[#e5a93c]" />
                  <span>Wishlist</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={navShop}
                  className="flex items-center gap-2 text-[#d1d5db] hover:text-[#e5a93c] transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-[#e5a93c]" />
                  <span>Complete Catalogue</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Care & Policies */}
          <div>
            <h4 className="text-white text-base sm:text-lg font-serif font-medium tracking-tight mb-2">
              Customer Support
            </h4>
            <div className="w-12 h-[1.5px] bg-[#e5a93c] mb-4" />

            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => setIsAboutOpen(true)}
                  className="flex items-center gap-2 text-[#d1d5db] hover:text-[#e5a93c] transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-[#e5a93c]" />
                  <span>About Us</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={navAccount}
                  className="flex items-center gap-2 text-[#d1d5db] hover:text-[#e5a93c] transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-[#e5a93c]" />
                  <span>My Account & Orders</span>
                </button>
              </li>
              <li>
                <a
                  href="https://wa.me/916289417338"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#d1d5db] hover:text-[#e5a93c] transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-[#e5a93c]" />
                  <span>WhatsApp Helpdesk</span>
                </a>
              </li>
              <li>
                <span className="flex items-center gap-2 text-[#8e8e93]">
                  <ChevronRight className="w-3.5 h-3.5 text-[#8e8e93]" />
                  <span>Dispatch: 24-48 Hours</span>
                </span>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Operations */}
          <div>
            <h4 className="text-white text-base sm:text-lg font-serif font-medium tracking-tight mb-2">
              Corporate Office
            </h4>
            <div className="w-12 h-[1.5px] bg-[#e5a93c] mb-4" />

            <div className="space-y-2 text-xs sm:text-sm text-[#d1d5db]">
              <p className="leading-relaxed">
                <span className="text-[#e5a93c] font-medium block">Headquarters:</span>
                Lucknow, Uttar Pradesh, India
              </p>
              <p>
                <span className="text-[#e5a93c] font-medium block">Helpline / WhatsApp:</span>
                +91 6289417338
              </p>
              <p>
                <span className="text-[#e5a93c] font-medium block">Email:</span>
                fabcreation6289@gmail.com
              </p>
            </div>
          </div>
        </div>

        {/* Scroll To Top Button & Bottom Row */}
        <div className="w-full pt-4 border-t border-[#261f14] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left space-y-0.5">
            <p className="text-[#8e8e93] text-xs">
              © 2026 Fab Creations (fab-creations.com). All rights reserved.
            </p>
            <p className="text-[#8e8e93] text-[11px]">
              Engineered with excellence for luxury retail & B2B commerce.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[#e5a93c] text-[10px] tracking-[0.2em] font-semibold uppercase">
                JEWELLERY FOR A BRIGHTER YOU
              </p>
            </div>
            <button
              onClick={scrollToTop}
              title="Scroll to top"
              className="w-10 h-10 rounded-full border border-[#e5a93c] bg-[#0c0c0c] hover:bg-[#e5a93c] hover:text-black text-[#e5a93c] flex items-center justify-center shadow-lg transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <ChevronUp className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>
        </div>
      </div>

      {/* About Us Modal */}
      <AboutUsModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </footer>
  );
}
