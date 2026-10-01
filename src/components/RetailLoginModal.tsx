"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { X, ShieldCheck, Phone, CheckCircle, ArrowRight, Lock, ShoppingBag } from "lucide-react";

interface RetailLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (mobile: string) => void;
}

const LOGO_R2_URL =
  "https://pub-ce8688bc6c654bcfb99716f7c9373bcd.r2.dev/fab-creations/brand-logo.png";

export default function RetailLoginModal({
  isOpen,
  onClose,
  onSuccess,
}: RetailLoginModalProps) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setStep("phone");
      setError(null);
      setOtp(["", "", "", ""]);
      try {
        const saved = localStorage.getItem("fc_retail_mobile");
        if (saved && saved.length === 10) {
          setMobileNumber(saved);
        }
      } catch {}
    }
  }, [isOpen]);

  useEffect(() => {
    if (step === "otp" && otpInputsRef.current[0]) {
      otpInputsRef.current[0]?.focus();
    }
  }, [step]);

  if (!isOpen) return null;

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMobile = mobileNumber.replace(/\D/g, "");
    if (cleanMobile.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setStep("otp");
      setOtp(["1", "2", "3", "4"]); // Pre-fill demo OTP for smooth experience
    }, 400);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 3) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length !== 4) {
      setError("Please enter all 4 digits of the OTP");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    setTimeout(() => {
      setIsSubmitting(false);
      const cleanMobile = mobileNumber.replace(/\D/g, "") || "9876543210";
      try {
        localStorage.setItem("fc_retail_logged_in", "true");
        localStorage.setItem("fc_retail_mobile", cleanMobile);
        window.dispatchEvent(new Event("retail_auth_changed"));
      } catch {}

      onSuccess(cleanMobile);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-[420px] bg-[#0c0c0c] border border-[#d69e3d] rounded-[24px] p-6 shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#171717] border border-[#262626] flex items-center justify-center text-[#8e8e93] hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2 mb-6">
          <div className="w-14 h-14 relative rounded-full overflow-hidden border border-[#e5a93c]/50 p-1 shadow-[0_0_20px_rgba(229,169,60,0.2)]">
            <Image
              src={LOGO_R2_URL}
              alt="Fab Creations"
              width={60}
              height={60}
              unoptimized
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/images/logo.png";
              }}
              className="object-contain w-full h-full"
            />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1c160c] border border-[#e5a93c]/40 text-[#e5a93c] text-[11px] font-semibold tracking-wider uppercase mb-1">
              <ShoppingBag className="w-3 h-3" />
              <span>Checkout Login</span>
            </div>
            <h3 className="text-white text-[19px] font-serif font-medium leading-snug">
              {step === "phone" ? "Enter Mobile to Checkout" : "Verify Mobile Number"}
            </h3>
            <p className="text-[#8e8e93] text-xs pt-1">
              {step === "phone"
                ? "Please log in with your phone number to complete your order"
                : `Enter 4-digit OTP sent to +91 ${mobileNumber}`}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-red-950/60 border border-red-800/60 text-red-200 text-xs text-center">
            {error}
          </div>
        )}

        {step === "phone" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-[#a0a0a0] font-medium block">
                Mobile Number
              </label>
              <div className="flex items-center h-[46px] rounded-xl bg-[#141414] border border-[#2a2a2a] px-3.5 focus-within:border-[#e5a93c] transition-all">
                <span className="text-[#8e8e93] text-sm font-medium mr-2 border-r border-[#262626] pr-2">
                  +91
                </span>
                <input
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={mobileNumber}
                  onChange={(e) => {
                    setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10));
                    setError(null);
                  }}
                  autoFocus
                  maxLength={10}
                  className="flex-1 bg-transparent text-sm text-white placeholder-[#666] outline-none font-medium tracking-wide"
                />
                <Phone className="w-4 h-4 text-[#8e8e93]" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || mobileNumber.length !== 10}
              className="w-full h-[46px] rounded-xl bg-gradient-to-r from-[#d4992e] to-[#f5c767] hover:from-[#e5a93c] hover:to-[#ffd885] text-black font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-lg active:scale-98"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <span>Send OTP & Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="flex justify-center gap-3">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    otpInputsRef.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="w-12 h-14 rounded-xl bg-[#141414] border border-[#2a2a2a] focus:border-[#e5a93c] text-white text-xl font-bold text-center outline-none transition-all"
                />
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-[#8e8e93] px-1">
              <span>Demo OTP: 1234</span>
              <button
                type="button"
                onClick={() => setStep("phone")}
                className="text-[#e5a93c] hover:underline"
              >
                Change Number
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || otp.join("").length !== 4}
              className="w-full h-[46px] rounded-xl bg-gradient-to-r from-[#d4992e] to-[#f5c767] hover:from-[#e5a93c] hover:to-[#ffd885] text-black font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-lg active:scale-98"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Verify & Proceed to Checkout</span>
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-5 pt-3.5 border-t border-[#1c1c1c] text-center">
          <p className="text-[11px] text-[#666]">
            By continuing, you verify your order details for Fab Creations Retail Store.
          </p>
        </div>
      </div>
    </div>
  );
}
