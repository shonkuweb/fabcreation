"use client";

import React from "react";
import { ShoppingBag, Building2, Check, Lock } from "lucide-react";

interface StoreModeToggleProps {
  mode: "retail" | "wholesale";
  onSwitch: (newMode: "retail" | "wholesale") => void;
  isWholesaleLoggedIn: boolean;
  onOpenWholesaleLogin?: () => void;
}

export default function StoreModeToggle({
  mode,
  onSwitch,
  isWholesaleLoggedIn,
  onOpenWholesaleLogin,
}: StoreModeToggleProps) {
  return (
    <div className="w-full px-4 pt-2.5 pb-1 flex flex-col items-center">
      {/* Dual Tab Switcher */}
      <div className="w-full max-w-[420px] p-1 rounded-2xl bg-[#0c0c0c] border border-[#262626] flex items-center shadow-inner">
        {/* Retail Tab */}
        <button
          type="button"
          onClick={() => onSwitch("retail")}
          className={`flex-1 py-2 px-2.5 rounded-xl text-xs sm:text-[12.5px] font-medium transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
            mode === "retail"
              ? "bg-gradient-to-r from-[#d4992e] to-[#f5c767] text-black font-semibold shadow-md"
              : "text-[#8e8e93] hover:text-white"
          }`}
        >
          <ShoppingBag className={`w-3.5 h-3.5 ${mode === "retail" ? "text-black" : "text-[#e5a93c]"}`} />
          <span>Retail Store</span>
          <span
            className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-normal ${
              mode === "retail" ? "bg-black/15 text-black" : "bg-[#181818] text-[#777]"
            }`}
          >
            No Login
          </span>
        </button>

        {/* Wholesale Tab */}
        <button
          type="button"
          onClick={() => {
            onSwitch("wholesale");
            if (!isWholesaleLoggedIn && onOpenWholesaleLogin) {
              onOpenWholesaleLogin();
            }
          }}
          className={`flex-1 py-2 px-2.5 rounded-xl text-xs sm:text-[12.5px] font-medium transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
            mode === "wholesale"
              ? "bg-gradient-to-r from-[#d4992e] to-[#f5c767] text-black font-semibold shadow-md"
              : "text-[#8e8e93] hover:text-white"
          }`}
        >
          <Building2 className={`w-3.5 h-3.5 ${mode === "wholesale" ? "text-black" : "text-[#e5a93c]"}`} />
          <span>Wholesale</span>
          {isWholesaleLoggedIn ? (
            <span
              className={`text-[9.5px] px-1.5 py-0.2 rounded-full flex items-center gap-0.5 font-medium ${
                mode === "wholesale"
                  ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800/60"
                  : "bg-emerald-950/40 text-emerald-400"
              }`}
            >
              <Check className="w-2.5 h-2.5" />
              <span>Unlocked</span>
            </span>
          ) : (
            <span
              className={`text-[9.5px] px-1.5 py-0.2 rounded-full flex items-center gap-0.5 font-medium ${
                mode === "wholesale"
                  ? "bg-black/25 text-black font-semibold"
                  : "bg-[#1e170a] text-[#e5a93c] border border-[#e5a93c]/30"
              }`}
            >
              <Lock className="w-2.5 h-2.5" />
              <span>OTP</span>
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
