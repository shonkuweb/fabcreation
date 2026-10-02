"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  X,
  Mail,
  Phone,
  User,
  CheckCircle,
  ArrowRight,
  ShoppingBag,
  Sparkles,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

interface RetailLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (verifiedIdentifier: string) => void;
  initialMode?: "login" | "register";
}

const LOGO_R2_URL =
  "https://pub-ce8688bc6c654bcfb99716f7c9373bcd.r2.dev/fab-creations/brand-logo.png";

export default function RetailLoginModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = "login",
}: RetailLoginModalProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [step, setStep] = useState<"input" | "otp">("input");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode || "login");
      setStep("input");
      setError(null);
      setInfoMessage(null);
      setOtp(["", "", "", "", "", ""]);
      try {
        const savedName = localStorage.getItem("fc_user_name");
        if (savedName && savedName !== "Customer") setFullName(savedName);
        const savedEmail = localStorage.getItem("fc_retail_email");
        if (savedEmail) setEmail(savedEmail);
        const savedMobile = localStorage.getItem("fc_retail_mobile");
        if (savedMobile) setMobileNumber(savedMobile);
      } catch {}
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (step === "otp" && otpInputsRef.current[0]) {
      otpInputsRef.current[0]?.focus();
    }
  }, [step]);

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    if (!fullName.trim()) {
      setError("Please enter your name");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, purpose: "retail" }),
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (!data.success) {
        setError(data.error || "Failed to send verification code. Please try again.");
        return;
      }

      setInfoMessage(data.message || `Code sent to ${cleanEmail}`);
      setStep("otp");
      setOtp(["", "", "", "", "", ""]);
    } catch {
      setIsSubmitting(false);
      setError("Network error sending OTP. Please try again.");
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const val = value.replace(/\D/g, "");
    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);

    if (val && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const otpValue = otp.join("");
    if (otpValue.length < 6) {
      setError("Please enter the complete 6-digit verification code");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, otp: otpValue }),
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (!data.success) {
        setError(data.error || "Invalid verification code. Please check your email.");
        return;
      }

      const finalName = fullName.trim() || "Customer";
      try {
        localStorage.setItem("fc_retail_logged_in", "true");
        localStorage.setItem("fc_user_logged_in", "true");
        localStorage.setItem("fc_retail_email", cleanEmail);
        localStorage.setItem("fc_user_email", cleanEmail);
        localStorage.setItem("fc_user_name", finalName);
        window.dispatchEvent(new Event("retail_auth_changed"));
      } catch {}

      // Automatically save retail user into dedicated retailUsers database table (No approval needed!)
      fetch("/api/retail-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: finalName,
          email: cleanEmail,
          mobile: cleanEmail,
        }),
      }).catch(console.error);

      onSuccess(cleanEmail);
      onClose();
    } catch {
      setIsSubmitting(false);
      setError("Network error verifying code. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-[400px] bg-[#0c0c0c] border border-[#d69e3d] rounded-[22px] sm:rounded-[26px] p-5 sm:p-6 shadow-2xl overflow-y-auto max-h-[92vh]">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#171717] border border-[#262626] flex items-center justify-center text-[#8e8e93] hover:text-white transition-colors cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-1.5 sm:space-y-2 mb-3.5 sm:mb-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 relative rounded-full overflow-hidden border border-[#e5a93c]/50 p-1 shadow-[0_0_20px_rgba(229,169,60,0.2)] shrink-0">
            <Image
              src={LOGO_R2_URL}
              alt="Fab Creations"
              width={56}
              height={56}
              unoptimized
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/images/logo.png";
              }}
              className="object-contain w-full h-full"
            />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1c160c] border border-[#e5a93c]/40 text-[#e5a93c] text-[10.5px] font-semibold tracking-wider uppercase mb-1">
              <ShoppingBag className="w-3 h-3" />
              <span>Step {step === "input" ? "1 of 2: Details" : "2 of 2: Verification"}</span>
            </div>
            <h3 className="text-white text-lg sm:text-[19px] font-serif font-medium leading-snug">
              {step === "input" ? "Create / Access Your Account" : "Enter Verification Code"}
            </h3>
            <p className="text-[#8e8e93] text-xs pt-0.5 max-w-[300px]">
              {step === "input"
                ? "Enter your name & email to receive an instant verification code"
                : `Enter the 6-digit code sent to ${email}`}
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
          <div className={`h-1.5 rounded-full transition-all ${step === "input" ? "w-8 bg-[#e5a93c]" : "w-4 bg-emerald-400"}`} />
          <div className={`h-1.5 rounded-full transition-all ${step === "otp" ? "w-8 bg-[#e5a93c]" : "w-4 bg-[#262626]"}`} />
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-red-950/60 border border-red-800/60 text-red-200 text-xs text-center flex items-center justify-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {infoMessage && step === "otp" && (
          <div className="mb-4 p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-700/50 text-emerald-300 text-xs text-center">
            {infoMessage}
          </div>
        )}

        {/* STEP 1: Full Name & Email Input */}
        {step === "input" ? (
          <form onSubmit={handleSendOtp} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs text-[#a0a0a0] font-medium block">
                Your Name <span className="text-[#e5a93c]">*</span>
              </label>
              <div className="flex items-center h-[46px] rounded-xl bg-[#141414] border border-[#2a2a2a] px-3.5 focus-within:border-[#e5a93c] transition-all">
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setError(null);
                  }}
                  required
                  autoFocus
                  className="flex-1 bg-transparent text-sm text-white placeholder-[#666] outline-none font-medium"
                />
                <User className="w-4 h-4 text-[#8e8e93]" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[#a0a0a0] font-medium block">
                Email Address <span className="text-[#e5a93c]">*</span>
              </label>
              <div className="flex items-center h-[46px] rounded-xl bg-[#141414] border border-[#2a2a2a] px-3.5 focus-within:border-[#e5a93c] transition-all">
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  required
                  className="flex-1 bg-transparent text-sm text-white placeholder-[#666] outline-none font-medium"
                />
                <Mail className="w-4 h-4 text-[#8e8e93]" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !email.includes("@")}
              className="w-full h-[46px] rounded-xl bg-gradient-to-r from-[#d4992e] to-[#f5c767] hover:from-[#e5a93c] hover:to-[#ffd885] text-black font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-lg active:scale-98 mt-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <span>Get OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* STEP 2: Enter OTP */
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="flex justify-center gap-1.5 sm:gap-2.5">
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
                  className="w-9 h-11 sm:w-11 sm:h-13 rounded-xl bg-[#141414] border border-[#2a2a2a] focus:border-[#e5a93c] text-white text-base sm:text-xl font-bold text-center outline-none transition-all"
                />
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-[#8e8e93] px-1">
              <span>Code sent to inbox</span>
              <button
                type="button"
                onClick={() => setStep("input")}
                className="text-[#e5a93c] hover:underline cursor-pointer"
              >
                Change Email
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || otp.join("").length < 6}
              className="w-full h-[46px] rounded-xl bg-gradient-to-r from-[#d4992e] to-[#f5c767] hover:from-[#e5a93c] hover:to-[#ffd885] text-black font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-lg active:scale-98"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Verify & Continue</span>
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-4 pt-3 border-t border-[#1c1c1c] text-center">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#888]">
            <Sparkles className="w-3.5 h-3.5 text-[#e5a93c]" />
            <span>Instant Retail Account • No Admin Approval Needed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
