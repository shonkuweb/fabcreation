"use client";

import React from "react";
import Image from "next/image";
import { X, Sparkles, Building2, Store, Globe2, ShieldCheck, Heart } from "lucide-react";

interface AboutUsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const R2_BASE = "https://pub-ce8688bc6c654bcfb99716f7c9373bcd.r2.dev/fab-creations";
const LOGO_R2_URL = `${R2_BASE}/brand-logo.png`;

export default function AboutUsModal({ isOpen, onClose }: AboutUsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-[460px] max-h-[90vh] bg-[#0c0c0c] border border-[#d69e3d] rounded-[26px] p-6 shadow-2xl overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#171717] border border-[#262626] flex items-center justify-center text-[#8e8e93] hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2 mb-5">
          <div className="w-14 h-14 relative rounded-full overflow-hidden border border-[#e5a93c]/50 p-1 shadow-[0_0_25px_rgba(229,169,60,0.25)]">
            <Image
              src={LOGO_R2_URL}
              alt="Fab Creation"
              width={60}
              height={60}
              unoptimized
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/images/logo.png";
              }}
              className="object-contain w-full h-full"
            />
          </div>

          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#181207] border border-[#e5a93c]/40 text-[#e5a93c] text-[10.5px] font-semibold tracking-widest uppercase">
              About Us
            </span>
            <h3 className="text-white text-[19px] sm:text-[20px] font-serif font-medium leading-snug tracking-tight mt-1.5">
              Jewellery that completes the look.<br />
              <span className="text-[#f5c767]">A collection that creates the impression.</span>
            </h3>
          </div>
        </div>

        {/* Main Content Body */}
        <div className="space-y-3.5 text-[13px] text-[#c4c4c4] leading-relaxed font-normal">
          <p>
            At <strong className="text-white font-medium">Fab Creation</strong>, we believe jewellery is more than an accessory—it’s the detail that makes an outfit unforgettable.
          </p>

          <p>
            Based in <span className="text-[#e5a93c] font-medium">Lucknow</span>, we bring together a carefully selected range of chains, anklets, earrings, bangles, fancy kadas, necklaces, bridal jewellery and AD jewellery, serving both wholesale and retail customers.
          </p>

          <p>
            Whether you’re looking for everyday elegance, statement pieces for a special occasion, or exquisite bridal jewellery, our collection is curated to offer style, variety and value under one roof.
          </p>

          {/* Modern Jewellery Businesses Highlight Box */}
          <div className="p-4 rounded-[18px] bg-[#141008] border border-[#4a3816] shadow-sm space-y-1.5 mt-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#e5a93c]" />
              <h4 className="text-white text-[13.5px] font-serif font-semibold">
                Built for Modern Jewellery Businesses
              </h4>
            </div>
            <p className="text-[12.5px] text-[#a8a8a8] leading-relaxed">
              Fab Creation goes beyond jewellery. We also provide E-commerce services, helping jewellery businesses take their collections online and reach customers beyond their physical store.
            </p>
          </div>

          {/* Closing Brand Manifesto */}
          <div className="pt-3 border-t border-[#222222] text-center space-y-1 mt-4">
            <p className="text-[#8e8e93] text-[11.5px] tracking-wide font-medium">
              Wholesale or retail. Traditional or contemporary. Jewellery or digital.
            </p>
            <p className="text-[#f5c767] text-[14px] font-serif font-semibold tracking-tight">
              Fab Creation is where craftsmanship meets modern commerce.
            </p>
          </div>
        </div>

        {/* Close Action Button */}
        <div className="pt-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-10 rounded-xl bg-gradient-to-r from-[#d4992e] to-[#f5c767] text-black font-semibold text-xs transition-all hover:brightness-105 active:scale-[0.99] cursor-pointer shadow-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
