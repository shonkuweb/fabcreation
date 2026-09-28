"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { X, ShieldCheck, Phone, CheckCircle, ArrowRight, Lock } from "lucide-react";

interface WholesaleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (mobile: string) => void;
}

const R2_BASE = "https://pub-ce8688bc6c654bcfb99716f7c9373bcd.r2.dev/fab-creations";
const LOGO_R2_URL = `${R2_BASE}/brand-logo.png`;

export default function WholesaleLoginModal({
  isOpen,
  onClose,
  onSuccess,
}: WholesaleLoginModalProps) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [activeOtpIndex, setActiveOtpIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setStep("phone");
      setError(null);
      const savedMobile = localStorage.getItem("fc_user_mobile");
      if (savedMobile && savedMobile.length === 10) {
        setMobileNumber(savedMobile);
      }
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
      setOtp(["", "", "", "", "", ""]);
    }, 400);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
      setActiveOtpIndex(index + 1);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
      setActiveOtpIndex(index - 1);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setError("Please enter all 6 digits of the OTP");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    setTimeout(() => {
      setIsSubmitting(false);
      const cleanMobile = mobileNumber.replace(/\D/g, "") || "9876543210";
      try {
        localStorage.setItem("fc_wholesale_logged_in", "true");
        localStorage.setItem("fc_user_logged_in", "true");
        localStorage.setItem("fc_user_mobile", cleanMobile);
        window.dispatchEvent(new Event("wholesale_auth_changed"));
      } catch {}

      onSuccess(cleanMobile);
      onClose();
    }, 500);
  };

  const handleQuickFillDemo = () => {
    setOtp(["1", "2", "3", "4", "5", "6"]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-[390px] bg-[#0c0c0c] border border-[#d69e3d] rounded-[26px] p-6 shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#171717] border border-[#262626] flex items-center justify-center text-[#8e8e93] hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Icon Header */}
        <div className="flex flex-col items-center text-center space-y-2 mb-5">
          <div className="w-14 h-14 rounded-full bg-[#181207] border border-[#e5a93c]/50 flex items-center justify-center shadow-[0_0_25px_rgba(229,169,60,0.25)]">
            <Lock className="w-6 h-6 text-[#e5a93c]" />
          </div>
          <div>
            <h3 className="text-white text-lg font-serif font-medium">
              Wholesale Partner Access
            </h3>
            <p className="text-[#8e8e93] text-xs max-w-[280px] mt-1">
              Verify your mobile number to unlock exclusive B2B wholesale pricing.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 px-3.5 py-2 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs text-center">
            {error}
          </div>
        )}

        {step === "phone" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-[#a0a0a0] text-xs font-medium mb-1.5">
                Mobile Number
              </label>
              <div className="flex items-center h-12 rounded-xl bg-[#141414] border border-[#292929] px-3.5 focus-within:border-[#e5a93c] transition-all">
                <span className="text-white font-medium text-sm pr-2 border-r border-[#262626]">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  placeholder="Enter 10-digit number"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                  className="flex-1 bg-transparent px-3 text-white text-sm outline-none placeholder-[#666]"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#141007] border border-[#3b2d12] flex items-center gap-2 text-[11.5px] text-[#e5a93c]">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Demo mode enabled: Verification OTP is instant.</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || mobileNumber.length !== 10}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-[#d4992e] to-[#f5c767] text-black font-semibold text-xs flex items-center justify-center gap-2 hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 shadow-md"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Send Demo OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[#a0a0a0] text-xs font-medium">
                  Enter 6-Digit OTP
                </label>
                <button
                  type="button"
                  onClick={() => setStep("phone")}
                  className="text-[11px] text-[#e5a93c] hover:underline"
                >
                  Change Number
                </button>
              </div>

              <div className="flex justify-between gap-1.5 mb-2">
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
                    className="w-11 h-12 rounded-xl bg-[#141414] border border-[#2a2a2a] text-center text-lg font-bold text-white outline-none focus:border-[#e5a93c] focus:ring-1 focus:ring-[#e5a93c] transition-all"
                  />
                ))}
              </div>

              {/* Demo hint with Quick Fill button */}
              <div className="flex items-center justify-between text-[11px] text-[#8e8e93] px-1">
                <span>Demo OTP: <strong className="text-[#e5a93c]">123456</strong></span>
                <button
                  type="button"
                  onClick={handleQuickFillDemo}
                  className="text-[#e5a93c] hover:underline font-medium cursor-pointer"
                >
                  Quick Fill OTP
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || otp.join("").length !== 6}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-[#d4992e] to-[#f5c767] text-black font-semibold text-xs flex items-center justify-center gap-2 hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 shadow-md"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Verify & Unlock Wholesale</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
