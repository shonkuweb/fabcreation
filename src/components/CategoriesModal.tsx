"use client";

import React from "react";
import Image from "next/image";
import { X, ChevronRight, LayoutGrid, Tag } from "lucide-react";
import { Category } from "@/lib/db";

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSelectCategory?: (category: string | null) => void;
}

const LOGO_R2_URL = "https://pub-ce8688bc6c654bcfb99716f7c9373bcd.r2.dev/fab-creations/logo.png";

export default function CategoriesModal({
  isOpen,
  onClose,
  categories: initialCategories = [],
  onSelectCategory,
}: CategoriesModalProps) {
  const [categories, setCategories] = React.useState<Category[]>(initialCategories);

  React.useEffect(() => {
    if (isOpen) {
      fetch("/api/categories", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => {
          if (d.success && Array.isArray(d.categories)) {
            setCategories(d.categories);
          }
        })
        .catch((err) => console.error("Error loading categories:", err));
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (initialCategories.length > 0) {
      setCategories(initialCategories);
    }
  }, [initialCategories]);

  if (!isOpen) return null;

  const handleSelect = (categoryName: string | null) => {
    onSelectCategory?.(categoryName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog Sheet */}
      <div className="relative w-full max-w-[440px] max-h-[85vh] bg-[#0c0c0c] border border-[#2a2a2a] rounded-t-[28px] sm:rounded-[28px] overflow-hidden shadow-2xl flex flex-col z-10 animate-slide-up">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#1c1c1c] flex items-center justify-between bg-[#0e0e0e]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-[#3a2c16] relative shrink-0">
              <Image
                src={LOGO_R2_URL}
                alt="Fab Creations"
                fill
                unoptimized
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/images/logo.png";
                }}
                className="object-contain"
              />
            </div>
            <div>
              <h3 className="text-white text-[16px] font-serif font-medium leading-tight">
                Categories
              </h3>
              <p className="text-[#8e8e93] text-[11.5px]">
                Explore B2B Jewellery Collections
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#181818] border border-[#282828] flex items-center justify-center text-[#8e8e93] hover:text-white hover:border-[#383838] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Categories List */}
        <div className="p-4 overflow-y-auto space-y-2 max-h-[60vh]">
          {/* All Categories Option */}
          <div
            onClick={() => handleSelect(null)}
            className="w-full bg-[#141414] hover:bg-[#1c160c] border border-[#222222] hover:border-[#e5a93c]/60 rounded-[16px] p-3.5 flex items-center justify-between transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1c160c] border border-[#3a2c16] flex items-center justify-center text-[#e5a93c] shrink-0">
                <LayoutGrid className="w-5 h-5 text-[#e5a93c]" />
              </div>
              <div>
                <h4 className="text-white text-[14.5px] font-medium leading-tight group-hover:text-[#e5a93c] transition-colors">
                  All Categories
                </h4>
                <p className="text-[#8e8e93] text-[11.5px] pt-0.5">
                  View entire catalogue
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[#e5a93c] text-[12px] font-medium">
              <span>View all</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Dynamic Categories from Database */}
          {categories.length > 0 ? (
            categories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => handleSelect(cat.name)}
                className="w-full bg-[#111111] hover:bg-[#18140c] border border-[#1e1e1e] hover:border-[#e5a93c]/50 rounded-[16px] p-3 flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#16130b] border border-[#2e2311] flex items-center justify-center text-[#e5a93c] shrink-0">
                    <Tag className="w-4 h-4 text-[#e5a93c]" />
                  </div>
                  <span className="text-white text-[14px] font-medium group-hover:text-[#e5a93c] transition-colors">
                    {cat.name}
                  </span>
                </div>

                <ChevronRight className="w-4 h-4 text-[#666666] group-hover:text-[#e5a93c] group-hover:translate-x-0.5 transition-all" />
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-[#8e8e93] text-xs">
              No categories created yet.<br />
              <span className="text-[#e5a93c]/80 mt-1 block">
                Create categories in the Admin panel.
              </span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-[#1a1a1a] bg-[#0a0a0a] text-center">
          <p className="text-[#777777] text-[11px]">
            B2B Wholesale Jewelry · Minimum Order: ₹3,000
          </p>
        </div>
      </div>
    </div>
  );
}
