"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  X,
  ShieldCheck,
  Phone,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Lock,
  Building2,
  Mail,
  Instagram,
  User,
  Clock,
  AlertCircle,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import {
  isFirebaseConfigured,
  initRecaptchaVerifier,
  sendPhoneOtp,
  confirmPhoneOtp,
  formatFirebaseError,
} from "@/lib/firebase";
import type { ConfirmationResult } from "firebase/auth";

interface WholesaleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (mobile: string) => void;
}

const LOGO_R2_URL =
  "https://pub-ce8688bc6c654bcfb99716f7c9373bcd.r2.dev/fab-creations/brand-logo.png";

export default function WholesaleLoginModal({
  isOpen,
  onClose,
  onSuccess,
}: WholesaleLoginModalProps) {
  // Mode: "register" (3-step form) or "login" (check status / login)
  const [viewMode, setViewMode] = useState<"register" | "login">("register");

  // Registration 3-step form state
  const [regStep, setRegStep] = useState<1 | 2 | 3 | 4>(1); // 1: Business, 2: Contact, 3: Phone/OTP, 4: Submitted
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [instagramId, setInstagramId] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [regOtp, setRegOtp] = useState(["", "", "", "", "", ""]);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [regConfirmationResult, setRegConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Login mode state
  const [loginMobile, setLoginMobile] = useState("");
  const [loginOtp, setLoginOtp] = useState(["", "", "", "", "", ""]);
  const [loginStep, setLoginStep] = useState<"mobile" | "otp" | "pending" | "rejected">("mobile");
  const [loginConfirmationResult, setLoginConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [appStatusData, setAppStatusData] = useState<{
    name?: string;
    businessName?: string;
    status?: string;
    rejectionReason?: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firebaseActive, setFirebaseActive] = useState(false);

  useEffect(() => {
    setFirebaseActive(isFirebaseConfigured());
  }, []);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsSubmitting(false);
      setFirebaseActive(isFirebaseConfigured());
      try {
        const savedMobile = localStorage.getItem("fc_wholesale_mobile") || localStorage.getItem("fc_user_mobile");
        if (savedMobile && savedMobile.length === 10) {
          setMobileNumber(savedMobile);
          setLoginMobile(savedMobile);
        }
      } catch {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // -------------------------------------------------------------
  // REGISTRATION FORM HANDLERS (3-STEP)
  // -------------------------------------------------------------
  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your full name");
      return;
    }
    if (!businessName.trim()) {
      setError("Please enter your business or shop name");
      return;
    }
    setError(null);
    setRegStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid business contact email");
      return;
    }
    setError(null);
    setRegStep(3);
  };

  const handleSendRegOtp = async () => {
    const cleanMobile = mobileNumber.replace(/\D/g, "");
    if (cleanMobile.length !== 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }
    setError(null);
    setIsSubmitting(true);

    if (isFirebaseConfigured()) {
      try {
        const verifier = initRecaptchaVerifier("wholesale-recaptcha-container");
        if (!verifier) throw new Error("Security verification failed. Please refresh.");
        const confirmation = await sendPhoneOtp(cleanMobile, verifier);
        setRegConfirmationResult(confirmation);
        setIsSubmitting(false);
        setIsOtpSent(true);
        setRegOtp(["", "", "", "", "", ""]);
      } catch (err: unknown) {
        console.error("Firebase sendPhoneOtp error:", err);
        setIsSubmitting(false);
        setError(formatFirebaseError(err));
      }
    } else {
      setTimeout(() => {
        setIsSubmitting(false);
        setIsOtpSent(true);
        setRegOtp(["1", "2", "3", "4", "5", "6"]); // Demo OTP for ease of use
      }, 400);
    }
  };

  const handleRegOtpChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const updated = [...regOtp];
    updated[index] = val.slice(-1);
    setRegOtp(updated);
    if (val && index < 5) {
      const nextInput = document.getElementById(`reg-otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMobile = mobileNumber.replace(/\D/g, "");
    if (cleanMobile.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }
    const otpValue = regOtp.join("");
    if (otpValue.length < 4) {
      setError("Please enter the complete OTP code");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // If Firebase was used, verify with confirmationResult
    if (regConfirmationResult) {
      try {
        await confirmPhoneOtp(regConfirmationResult, otpValue);
      } catch (err) {
        console.error("Firebase confirm error:", err);
        setIsSubmitting(false);
        setError(formatFirebaseError(err));
        return;
      }
    }

    try {
      const res = await fetch("/api/wholesale-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          businessName: businessName.trim(),
          email: email.trim(),
          instagramId: instagramId.trim(),
          mobile: cleanMobile,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Failed to submit wholesale application");
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      setRegStep(4); // Advance to Submitted screen
      try {
        localStorage.setItem("fc_wholesale_mobile", cleanMobile);
      } catch {}
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // LOGIN / STATUS CHECK HANDLERS
  // -------------------------------------------------------------
  const handleCheckLoginStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = loginMobile.replace(/\D/g, "");
    if (clean.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/wholesale-requests?mobile=${clean}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (!data.success || !data.request) {
        setIsSubmitting(false);
        setError("No wholesale application found for this number. Please fill out the 3-step application.");
        setMobileNumber(clean);
        setViewMode("register");
        setRegStep(1);
        return;
      }

      const req = data.request;
      setAppStatusData(req);

      if (req.status === "approved") {
        if (isFirebaseConfigured()) {
          try {
            const verifier = initRecaptchaVerifier("wholesale-recaptcha-container");
            if (!verifier) throw new Error("Security verification failed.");
            const confirmation = await sendPhoneOtp(clean, verifier);
            setLoginConfirmationResult(confirmation);
            setLoginStep("otp");
            setLoginOtp(["", "", "", "", "", ""]);
          } catch (err: unknown) {
            console.error("Firebase send login OTP error:", err);
            setError(formatFirebaseError(err));
          }
        } else {
          setLoginStep("otp");
          setLoginOtp(["1", "2", "3", "4", "5", "6"]);
        }
      } else if (req.status === "pending") {
        setLoginStep("pending");
      } else if (req.status === "rejected") {
        setLoginStep("rejected");
      }
      setIsSubmitting(false);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      setError("Failed to verify status. Please check your connection.");
    }
  };

  const handleVerifyLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = loginOtp.join("");
    if (otpValue.length < 4) {
      setError("Please enter complete OTP code");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    if (loginConfirmationResult) {
      try {
        await confirmPhoneOtp(loginConfirmationResult, otpValue);
      } catch (err) {
        console.error("Firebase login confirm error:", err);
        setIsSubmitting(false);
        setError(formatFirebaseError(err));
        return;
      }
    }

    setTimeout(() => {
      setIsSubmitting(false);
      const clean = loginMobile.replace(/\D/g, "");
      try {
        localStorage.setItem("fc_wholesale_logged_in", "true");
        localStorage.setItem("fc_wholesale_mobile", clean);
        localStorage.setItem("fc_user_logged_in", "true");
        window.dispatchEvent(new Event("wholesale_auth_changed"));
      } catch {}

      onSuccess(clean);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-[460px] bg-[#0c0c0c] border border-[#d69e3d] rounded-[26px] p-6 shadow-2xl overflow-y-auto max-h-[92vh]">
        {/* Invisible reCAPTCHA container for Firebase Phone Auth */}
        <div id="wholesale-recaptcha-container" />

        {/* Close Button */}
        <button
          type="button"
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
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1c160c] border border-[#e5a93c]/40 text-[#e5a93c] text-[10.5px] font-semibold tracking-wider uppercase mb-1">
              <Building2 className="w-3 h-3" />
              <span>B2B Wholesale Portal</span>
            </div>
            <h3 className="text-white text-[19px] sm:text-[20px] font-serif font-medium leading-snug">
              {viewMode === "register"
                ? regStep === 4
                  ? "Application Received!"
                  : "Wholesale Registration"
                : "Wholesale Account Login"}
            </h3>
            <p className="text-[#8e8e93] text-xs pt-0.5">
              {viewMode === "register"
                ? regStep === 4
                  ? "Your request was sent to the admin panel for approval"
                  : "Join our network of verified jewelry retailers and resellers"
                : "Access your approved B2B wholesale pricing & catalogue"}
            </p>
          </div>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-red-950/60 border border-red-800/60 text-red-200 text-xs text-center flex items-center justify-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ============================================================= */}
        {/* VIEW 1: REGISTRATION 3-STEP FLOW                              */}
        {/* ============================================================= */}
        {viewMode === "register" && regStep !== 4 && (
          <div className="space-y-4">
            {/* Step Indicators */}
            <div className="flex items-center justify-between px-2 mb-2">
              {[
                { num: 1, label: "Business" },
                { num: 2, label: "Contact" },
                { num: 3, label: "Verify" },
              ].map((s) => (
                <div key={s.num} className="flex items-center gap-1.5">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                      regStep === s.num
                        ? "bg-[#e5a93c] text-black shadow-md"
                        : regStep > s.num
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-600"
                        : "bg-[#1c1c1c] text-[#666]"
                    }`}
                  >
                    {regStep > s.num ? "✓" : s.num}
                  </div>
                  <span
                    className={`text-[11px] font-medium hidden sm:inline ${
                      regStep === s.num ? "text-white" : "text-[#777]"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {/* STEP 1: Full Name & Business Name */}
            {regStep === 1 && (
              <form onSubmit={handleNextStep1} className="space-y-3.5 animate-fade-in">
                <div className="space-y-1">
                  <label className="text-xs text-[#a0a0a0] font-medium flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#e5a93c]" />
                    <span>Your Full Name *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                    className="w-full h-[44px] rounded-xl bg-[#141414] border border-[#2a2a2a] px-3.5 text-white text-xs sm:text-sm placeholder-[#666] outline-none focus:border-[#e5a93c] transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[#a0a0a0] font-medium flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#e5a93c]" />
                    <span>Business / Shop Name *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Jewellers & Boutique"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full h-[44px] rounded-xl bg-[#141414] border border-[#2a2a2a] px-3.5 text-white text-xs sm:text-sm placeholder-[#666] outline-none focus:border-[#e5a93c] transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-[46px] rounded-xl bg-gradient-to-r from-[#d4992e] to-[#f5c767] hover:from-[#e5a93c] hover:to-[#ffd885] text-black font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-98 mt-2"
                >
                  <span>Continue to Step 2</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* STEP 2: Email & Instagram ID */}
            {regStep === 2 && (
              <form onSubmit={handleNextStep2} className="space-y-3.5 animate-fade-in">
                <div className="space-y-1">
                  <label className="text-xs text-[#a0a0a0] font-medium flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#e5a93c]" />
                    <span>Contact Email *</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. contact@royaljewellers.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                    className="w-full h-[44px] rounded-xl bg-[#141414] border border-[#2a2a2a] px-3.5 text-white text-xs sm:text-sm placeholder-[#666] outline-none focus:border-[#e5a93c] transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-[#a0a0a0] font-medium flex items-center gap-1.5">
                      <Instagram className="w-3.5 h-3.5 text-[#e5a93c]" />
                      <span>Instagram Handle / Store Page</span>
                    </label>
                    <span className="text-[10px] text-[#777]">Optional</span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. @royaljewellers_lucknow"
                    value={instagramId}
                    onChange={(e) => setInstagramId(e.target.value)}
                    className="w-full h-[44px] rounded-xl bg-[#141414] border border-[#2a2a2a] px-3.5 text-white text-xs sm:text-sm placeholder-[#666] outline-none focus:border-[#e5a93c] transition-all"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setRegStep(1)}
                    className="w-1/3 h-[46px] rounded-xl bg-[#181818] border border-[#2a2a2a] text-[#8e8e93] hover:text-white text-xs font-medium flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-[46px] rounded-xl bg-gradient-to-r from-[#d4992e] to-[#f5c767] hover:from-[#e5a93c] hover:to-[#ffd885] text-black font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-98"
                  >
                    <span>Continue to Step 3</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Phone Number & OTP Verification */}
            {regStep === 3 && (
              <form onSubmit={handleCompleteRegistration} className="space-y-4 animate-fade-in">
                <div className="space-y-1">
                  <label className="text-xs text-[#a0a0a0] font-medium flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#e5a93c]" />
                    <span>Phone Number *</span>
                  </label>
                  <div className="flex items-center h-[46px] rounded-xl bg-[#141414] border border-[#2a2a2a] px-3.5 focus-within:border-[#e5a93c] transition-all">
                    <span className="text-[#8e8e93] text-sm font-medium mr-2 border-r border-[#262626] pr-2">
                      +91
                    </span>
                    <input
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={mobileNumber}
                      onChange={(e) => {
                        setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10));
                        setIsOtpSent(false);
                      }}
                      maxLength={10}
                      autoFocus
                      className="flex-1 bg-transparent text-sm text-white placeholder-[#666] outline-none font-medium tracking-wide"
                    />
                    {!isOtpSent && mobileNumber.length === 10 && (
                      <button
                        type="button"
                        onClick={handleSendRegOtp}
                        className="text-xs text-[#e5a93c] hover:underline font-semibold"
                      >
                        Send OTP
                      </button>
                    )}
                  </div>
                </div>

                {isOtpSent && (
                  <div className="space-y-2 pt-1 animate-fade-in">
                    <div className="flex items-center justify-between text-xs text-[#a0a0a0]">
                      <span>Enter 6-Digit OTP</span>
                      <span className="text-[#e5a93c] font-medium">
                        {firebaseActive ? "SMS OTP Sent" : "Demo OTP: 123456"}
                      </span>
                    </div>
                    <div className="flex justify-center gap-2 sm:gap-2.5">
                      {regOtp.map((digit, i) => (
                        <input
                          key={i}
                          id={`reg-otp-${i}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleRegOtpChange(i, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Backspace" && !regOtp[i] && i > 0) {
                              const prev = document.getElementById(`reg-otp-${i - 1}`);
                              prev?.focus();
                            }
                          }}
                          className="w-10 h-12 sm:w-11 sm:h-13 rounded-xl bg-[#141414] border border-[#2a2a2a] focus:border-[#e5a93c] text-white text-lg sm:text-xl font-bold text-center outline-none transition-all"
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRegStep(2)}
                    className="w-1/3 h-[46px] rounded-xl bg-[#181818] border border-[#2a2a2a] text-[#8e8e93] hover:text-white text-xs font-medium flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  {!isOtpSent ? (
                    <button
                      type="button"
                      onClick={handleSendRegOtp}
                      disabled={isSubmitting || mobileNumber.length !== 10}
                      className="flex-1 h-[46px] rounded-xl bg-gradient-to-r from-[#d4992e] to-[#f5c767] hover:from-[#e5a93c] text-black font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-lg"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Send Phone OTP</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting || regOtp.join("").length < 4}
                      className="flex-1 h-[46px] rounded-xl bg-gradient-to-r from-[#d4992e] to-[#f5c767] hover:from-[#e5a93c] text-black font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-lg"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Submit for Admin Approval</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* Toggle to Login View */}
            <div className="pt-2 text-center border-t border-[#1c1c1c]">
              <button
                type="button"
                onClick={() => {
                  setViewMode("login");
                  setLoginStep("mobile");
                  setError(null);
                }}
                className="text-xs text-[#8e8e93] hover:text-[#e5a93c] transition-colors"
              >
                Already applied? <strong className="text-[#e5a93c] font-semibold">Check Status / Log In</strong>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* VIEW 2: SUBMITTED CONFIRMATION SCREEN                         */}
        {/* ============================================================= */}
        {viewMode === "register" && regStep === 4 && (
          <div className="space-y-4 text-center py-2 animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#181409] border border-[#e5a93c] flex items-center justify-center text-[#e5a93c] shadow-[0_0_25px_rgba(229,169,60,0.3)]">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/80 border border-amber-500/50 text-amber-300">
                Application Pending Admin Approval
              </span>
              <h4 className="text-white text-lg font-serif font-medium pt-2">
                Thank You, {name}!
              </h4>
              <p className="text-[#a0a0a0] text-xs leading-relaxed max-w-[340px] mx-auto">
                Your B2B Wholesale application for <strong className="text-white">{businessName}</strong> (+91 {mobileNumber}) has been submitted to the Admin Panel.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#121212] border border-[#262626] text-left text-xs space-y-1.5 text-[#8e8e93]">
              <div className="flex justify-between">
                <span>Applicant:</span>
                <span className="text-white font-medium">{name}</span>
              </div>
              <div className="flex justify-between">
                <span>Business:</span>
                <span className="text-white font-medium">{businessName}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="text-amber-400 font-semibold">Pending Approval</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={`https://wa.me/916289417338?text=Hello%20Fab%20Creations%2C%20I%20have%20submitted%20my%20wholesale%20application%20for%20${encodeURIComponent(
                  businessName
                )}%20(Mobile%3A%20${mobileNumber}).%20Please%20review%20and%20approve.`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3 rounded-xl bg-[#141b12] hover:bg-[#1a2517] border border-emerald-500/50 text-emerald-400 text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Message Admin on WhatsApp for Fast Approval</span>
              </a>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-[#171717] hover:bg-[#222] border border-[#2a2a2a] text-white text-xs font-medium transition-all cursor-pointer"
              >
                Close & Return to Store
              </button>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* VIEW 3: LOGIN / CHECK APPLICATION STATUS                      */}
        {/* ============================================================= */}
        {viewMode === "login" && (
          <div className="space-y-4">
            {loginStep === "mobile" && (
              <form onSubmit={handleCheckLoginStatus} className="space-y-4 animate-fade-in">
                <div className="space-y-1.5">
                  <label className="text-xs text-[#a0a0a0] font-medium block">
                    Registered Mobile Number
                  </label>
                  <div className="flex items-center h-[46px] rounded-xl bg-[#141414] border border-[#2a2a2a] px-3.5 focus-within:border-[#e5a93c] transition-all">
                    <span className="text-[#8e8e93] text-sm font-medium mr-2 border-r border-[#262626] pr-2">
                      +91
                    </span>
                    <input
                      type="tel"
                      placeholder="Enter 10-digit mobile number"
                      value={loginMobile}
                      onChange={(e) => {
                        setLoginMobile(e.target.value.replace(/\D/g, "").slice(0, 10));
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
                  disabled={isSubmitting || loginMobile.length !== 10}
                  className="w-full h-[46px] rounded-xl bg-gradient-to-r from-[#d4992e] to-[#f5c767] hover:from-[#e5a93c] text-black font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-lg"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Check Status / Log In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {loginStep === "otp" && (
              <form onSubmit={handleVerifyLoginOtp} className="space-y-4 animate-fade-in">
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-center text-emerald-300">
                  Account Approved! Enter 6-digit OTP to unlock wholesale pricing.
                </div>

                <div className="flex justify-center gap-2 sm:gap-2.5">
                  {loginOtp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`login-otp-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        const copy = [...loginOtp];
                        copy[idx] = val.slice(-1);
                        setLoginOtp(copy);
                        if (val && idx < 5) {
                          const next = document.getElementById(`login-otp-${idx + 1}`);
                          next?.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !loginOtp[idx] && idx > 0) {
                          const prev = document.getElementById(`login-otp-${idx - 1}`);
                          prev?.focus();
                        }
                      }}
                      className="w-10 h-12 sm:w-11 sm:h-13 rounded-xl bg-[#141414] border border-[#2a2a2a] focus:border-[#e5a93c] text-white text-lg sm:text-xl font-bold text-center outline-none transition-all"
                    />
                  ))}
                </div>

                <div className="flex justify-between text-xs text-[#8e8e93]">
                  <span>
                    {firebaseActive ? "SMS OTP Sent" : "Demo OTP: 123456"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setLoginStep("mobile")}
                    className="text-[#e5a93c] hover:underline"
                  >
                    Change Number
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || loginOtp.join("").length < 4}
                  className="w-full h-[46px] rounded-xl bg-gradient-to-r from-[#d4992e] to-[#f5c767] hover:from-[#e5a93c] text-black font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-lg"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Verify & Unlock Wholesale</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {loginStep === "pending" && (
              <div className="space-y-3.5 text-center animate-fade-in py-2">
                <div className="w-14 h-14 mx-auto rounded-full bg-amber-950/60 border border-amber-500 flex items-center justify-center text-amber-400">
                  <Clock className="w-7 h-7 animate-pulse" />
                </div>
                <h4 className="text-white text-base font-serif font-medium">
                  Application Under Review
                </h4>
                <p className="text-[#a0a0a0] text-xs leading-relaxed max-w-[320px] mx-auto">
                  Your wholesale registration for <strong className="text-white">{appStatusData?.businessName || "your business"}</strong> is pending admin approval.
                </p>

                <div className="space-y-2 pt-2">
                  <a
                    href={`https://wa.me/916289417338?text=Hello%20Fab%20Creations%2C%20please%20approve%20my%20wholesale%20account%20(Mobile%3A%20${loginMobile}).`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 rounded-xl bg-[#141b12] hover:bg-[#1a2517] border border-emerald-500/50 text-emerald-400 text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Request Express Approval on WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setLoginStep("mobile")}
                    className="text-xs text-[#8e8e93] hover:text-white"
                  >
                    Check another number
                  </button>
                </div>
              </div>
            )}

            {loginStep === "rejected" && (
              <div className="space-y-3.5 text-center animate-fade-in py-2">
                <div className="w-14 h-14 mx-auto rounded-full bg-red-950/60 border border-red-500 flex items-center justify-center text-red-400">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <h4 className="text-white text-base font-serif font-medium">
                  Application Not Approved
                </h4>
                <p className="text-[#a0a0a0] text-xs leading-relaxed max-w-[320px] mx-auto">
                  {appStatusData?.rejectionReason
                    ? `Reason: ${appStatusData.rejectionReason}`
                    : "Your application could not be approved at this time. Please contact our support team on WhatsApp."}
                </p>

                <div className="space-y-2 pt-2">
                  <a
                    href="https://wa.me/916289417338?text=Hello%20Fab%20Creations%2C%20I%20have%20a%20question%20regarding%20my%20wholesale%20account%20application."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 rounded-xl bg-[#141b12] hover:bg-[#1a2517] border border-emerald-500/50 text-emerald-400 text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Contact Admin on WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setViewMode("register");
                      setRegStep(1);
                    }}
                    className="text-xs text-[#e5a93c] hover:underline"
                  >
                    Re-apply with Updated Business Details
                  </button>
                </div>
              </div>
            )}

            {/* Toggle Back to Registration */}
            <div className="pt-2 text-center border-t border-[#1c1c1c]">
              <button
                type="button"
                onClick={() => {
                  setViewMode("register");
                  setRegStep(1);
                  setError(null);
                }}
                className="text-xs text-[#8e8e93] hover:text-[#e5a93c] transition-colors"
              >
                Need to create a new account? <strong className="text-[#e5a93c] font-semibold">Start 3-Step Form</strong>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
