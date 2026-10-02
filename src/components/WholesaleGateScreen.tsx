"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Lock,
  Building2,
  User,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Crown,
  FileText,
  RotateCw,
  Edit2,
  CheckCircle,
} from "lucide-react";

interface WholesaleGateScreenProps {
  onSuccess: (mobile: string, company?: string) => void;
  onReturnToRetail: () => void;
}

export default function WholesaleGateScreen({
  onSuccess,
  onReturnToRetail,
}: WholesaleGateScreenProps) {
  // Tabs: "apply" (new registration) | "login" (approved partner login)
  const [activeTab, setActiveTab] = useState<"apply" | "login">("apply");

  // =========================================================================
  // TAB 1: REGISTRATION / APPLY STATE
  // =========================================================================
  const [applyStep, setApplyStep] = useState<"form" | "otp" | "submitted">("form");
  const [regName, setRegName] = useState("");
  const [regBusinessName, setRegBusinessName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regMobile, setRegMobile] = useState("");
  const [regGstin, setRegGstin] = useState("");
  const [regInstagram, setRegInstagram] = useState("");

  const [isSendingApplyOtp, setIsSendingApplyOtp] = useState(false);
  const [isSubmittingApply, setIsSubmittingApply] = useState(false);
  const [applyOtp, setApplyOtp] = useState(["", "", "", "", "", ""]);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applyOtpError, setApplyOtpError] = useState<string | null>(null);
  const [applyDemoMessage, setApplyDemoMessage] = useState<string | null>(null);

  // =========================================================================
  // TAB 2: APPROVED PARTNER LOGIN STATE
  // =========================================================================
  const [loginStep, setLoginStep] = useState<"email" | "otp">("email");
  const [loginEmail, setLoginEmail] = useState("");
  const [isSendingLoginOtp, setIsSendingLoginOtp] = useState(false);
  const [loginOtp, setLoginOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifyingLoginOtp, setIsVerifyingLoginOtp] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginOtpError, setLoginOtpError] = useState<string | null>(null);
  const [loginDemoMessage, setLoginDemoMessage] = useState<string | null>(null);
  const [loginAccountStatus, setLoginAccountStatus] = useState<"pending" | "rejected" | null>(null);
  const [approvedUserData, setApprovedUserData] = useState<{
    name: string;
    businessName: string;
    email: string;
    mobile: string;
  } | null>(null);

  // -------------------------------------------------------------------------
  // Step 1: Send OTP to verify business email for Application
  // -------------------------------------------------------------------------
  const handleSendApplyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyError(null);
    setApplyOtpError(null);
    setApplyDemoMessage(null);

    const cleanName = regName.trim();
    const cleanBusiness = regBusinessName.trim();
    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanMobile = regMobile.replace(/\D/g, "");

    if (!cleanName || !cleanBusiness) {
      setApplyError("Please provide your name and business/shop name.");
      return;
    }
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setApplyError("Please provide a valid business email address.");
      return;
    }
    if (cleanMobile.length !== 10) {
      setApplyError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsSendingApplyOtp(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, purpose: "wholesale" }),
      });

      const data = await res.json();
      setIsSendingApplyOtp(false);

      if (!data.success) {
        setApplyError(data.error || "Failed to send email verification code. Please try again.");
        return;
      }

      if (data.isDemoFallback) {
        setApplyDemoMessage(data.message || "Testing mode active: enter demo code 123456.");
      }

      setApplyOtp(["", "", "", "", "", ""]);
      setApplyStep("otp");
    } catch {
      setIsSendingApplyOtp(false);
      setApplyError("Network error sending OTP. Please check your connection and try again.");
    }
  };

  // Step 2: Handle Apply OTP change
  const handleApplyOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const updated = [...applyOtp];
    updated[index] = digit;
    setApplyOtp(updated);

    if (digit && index < 5) {
      document.getElementById(`apply-otp-${index + 1}`)?.focus();
    }
  };

  // Step 2: Verify OTP and save wholesale application with pending status
  const handleVerifyApplyOtpAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyOtpError(null);

    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanMobile = regMobile.replace(/\D/g, "");
    const code = applyOtp.join("");

    if (code.length < 6) {
      setApplyOtpError("Please enter the complete 6-digit verification code sent to your email.");
      return;
    }

    setIsSubmittingApply(true);
    try {
      // 1. Verify OTP first to confirm email authenticity
      const verifyRes = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, otp: code }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyData.success) {
        setIsSubmittingApply(false);
        setApplyOtpError(verifyData.error || "Invalid OTP code. Please check your email and try again.");
        return;
      }

      // 2. Email is verified! Save application to wholesaleUsers database table
      const res = await fetch("/api/wholesale-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName.trim(),
          businessName: regBusinessName.trim(),
          email: cleanEmail,
          mobile: cleanMobile,
          gstin: regGstin.trim(),
          instagramId: regInstagram.trim(),
        }),
      });

      const data = await res.json();
      setIsSubmittingApply(false);

      if (!data.success) {
        setApplyOtpError(data.error || "Failed to submit wholesale application.");
        return;
      }

      // Store in localStorage for easy status checks
      try {
        localStorage.setItem("fc_wholesale_email", cleanEmail);
        localStorage.setItem("fc_wholesale_mobile", cleanMobile);
        localStorage.setItem("fc_wholesale_company", regBusinessName.trim());
      } catch {}

      setApplyStep("submitted");
    } catch {
      setIsSubmittingApply(false);
      setApplyOtpError("Network error submitting application. Please try again.");
    }
  };

  // -------------------------------------------------------------------------
  // TAB 2: Send Login OTP (Approved Partners ONLY)
  // -------------------------------------------------------------------------
  const handleSendLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginOtpError(null);
    setLoginDemoMessage(null);
    setLoginAccountStatus(null);
    setApprovedUserData(null);

    const cleanEmail = loginEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setLoginError("Please enter a valid registered business email address.");
      return;
    }

    setIsSendingLoginOtp(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, purpose: "wholesale_login" }),
      });

      const data = await res.json();
      setIsSendingLoginOtp(false);

      if (!data.success) {
        if (data.status === "pending") {
          setLoginAccountStatus("pending");
          setLoginError(data.error || "Your wholesale account is currently pending administrator approval.");
        } else if (data.status === "rejected") {
          setLoginAccountStatus("rejected");
          setLoginError(data.error || "Your wholesale application was not approved.");
        } else {
          setLoginError(data.error || "No approved wholesale account found with this email.");
        }
        return;
      }

      // Account is APPROVED! Fetch details to display
      try {
        const uRes = await fetch(`/api/wholesale-users?email=${encodeURIComponent(cleanEmail)}`, {
          cache: "no-store",
        });
        const uData = await uRes.json();
        if (uData.user) {
          setApprovedUserData(uData.user);
        }
      } catch {}

      if (data.isDemoFallback) {
        setLoginDemoMessage(data.message || "Testing mode active: enter demo code 123456.");
      }

      setLoginOtp(["", "", "", "", "", ""]);
      setLoginStep("otp");
    } catch {
      setIsSendingLoginOtp(false);
      setLoginError("Network error sending login OTP. Please check your connection and try again.");
    }
  };

  // Handle Login OTP input changes
  const handleLoginOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const updated = [...loginOtp];
    updated[index] = digit;
    setLoginOtp(updated);

    if (digit && index < 5) {
      document.getElementById(`login-gate-otp-${index + 1}`)?.focus();
    }
  };

  // Verify Login OTP and unlock wholesale access
  const handleVerifyLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginOtpError(null);

    const cleanEmail = loginEmail.trim().toLowerCase();
    const code = loginOtp.join("");

    if (code.length < 6) {
      setLoginOtpError("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsVerifyingLoginOtp(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, otp: code }),
      });
      const data = await res.json();
      setIsVerifyingLoginOtp(false);

      if (!data.success) {
        setLoginOtpError(data.error || "Invalid verification code. Please try again.");
        return;
      }

      // SUCCESS: Approved Wholesale Login Confirmed!
      const mobile = approvedUserData?.mobile || "";
      const company = approvedUserData?.businessName || "";

      try {
        localStorage.setItem("fc_wholesale_logged_in", "true");
        localStorage.setItem("fc_store_mode", "wholesale");
        localStorage.setItem("fc_wholesale_email", cleanEmail);
        if (mobile) localStorage.setItem("fc_wholesale_mobile", mobile);
        if (company) localStorage.setItem("fc_wholesale_company", company);
        localStorage.setItem("fc_wholesale_status", "approved");
        window.dispatchEvent(new Event("wholesale_auth_changed"));
      } catch {}

      onSuccess(mobile, company);
    } catch {
      setIsVerifyingLoginOtp(false);
      setLoginOtpError("Network error verifying code. Please try again.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] text-white flex flex-col items-center justify-start pb-20 pt-4 px-3 sm:px-6 select-none">
      {/* Top Banner Navigation */}
      <div className="w-full max-w-3xl flex items-center justify-between py-3 mb-4 sm:mb-6 border-b border-[#1c1c1c]">
        <button
          type="button"
          onClick={onReturnToRetail}
          className="flex items-center gap-2 text-xs font-semibold text-[#8e8e93] hover:text-[#e5a93c] transition-colors cursor-pointer group py-1.5"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Return to Retail Store</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181206] border border-[#e5a93c]/40 text-[#f5c767] text-[11px] font-semibold tracking-wider uppercase shadow-sm">
            <Lock className="w-3 h-3 text-[#e5a93c]" />
            B2B Trade Portal
          </span>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="w-full max-w-2xl bg-[#0c0c0c] border border-[#222222] rounded-[24px] sm:rounded-[28px] p-5 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle Gold Ambient Glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#e5a93c]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Hero Header */}
        <div className="text-center relative z-10 mb-6 sm:mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-2xl bg-gradient-to-b from-[#1c1508] to-[#0c0c0c] border border-[#e5a93c]/40 flex items-center justify-center text-[#e5a93c] shadow-lg">
            <Crown className="w-7 h-7 sm:w-8 sm:h-8 text-[#e5a93c]" />
          </div>

          <h1 className="text-xl sm:text-3xl font-serif font-bold text-white tracking-wide mb-2">
            Fab Creations Wholesale Portal
          </h1>
          <p className="text-xs sm:text-sm text-[#9e9e9e] max-w-lg mx-auto leading-relaxed">
            Direct manufacturer wholesale pricing is confidential and reserved for verified
            retail partners. <strong className="text-[#f5c767]">Administrator approval is required</strong> before pricing access is unlocked.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#141414] p-1 rounded-2xl border border-[#262626] mb-6 sm:mb-8 relative z-10">
          <button
            type="button"
            onClick={() => {
              setActiveTab("apply");
              setLoginError(null);
            }}
            className={`flex-1 py-2.5 sm:py-3 rounded-xl text-xs sm:text-[13px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 ${
              activeTab === "apply"
                ? "bg-gradient-to-r from-[#e5a93c] to-[#f5c767] text-black shadow-md"
                : "text-[#8e8e93] hover:text-white"
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span className="truncate">Apply for Account</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("login");
              setApplyError(null);
            }}
            className={`flex-1 py-2.5 sm:py-3 rounded-xl text-xs sm:text-[13px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 ${
              activeTab === "login"
                ? "bg-gradient-to-r from-[#e5a93c] to-[#f5c767] text-black shadow-md"
                : "text-[#8e8e93] hover:text-white"
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="truncate">Approved Partner Sign In</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: APPLY FOR WHOLESALE ACCOUNT                            */}
        {/* ============================================================== */}
        {activeTab === "apply" && (
          <div className="relative z-10">
            {/* STEP 1.1: REGISTRATION FORM */}
            {applyStep === "form" && (
              <form onSubmit={handleSendApplyOtp} className="space-y-4 animate-fade-in">
                {applyError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{applyError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <div>
                    <label className="block text-[11.5px] font-semibold text-[#a0a0a0] mb-1.5">
                      Contact Person Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 w-4 h-4 text-[#666]" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ramesh Patel"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full h-11 pl-10 pr-3 rounded-xl bg-[#141414] border border-[#282828] text-white text-xs sm:text-sm placeholder-[#555] focus:border-[#e5a93c] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11.5px] font-semibold text-[#a0a0a0] mb-1.5">
                      Business / Shop Name *
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-3 w-4 h-4 text-[#666]" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Patel Jewellers"
                        value={regBusinessName}
                        onChange={(e) => setRegBusinessName(e.target.value)}
                        className="w-full h-11 pl-10 pr-3 rounded-xl bg-[#141414] border border-[#282828] text-white text-xs sm:text-sm placeholder-[#555] focus:border-[#e5a93c] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <div>
                    <label className="block text-[11.5px] font-semibold text-[#a0a0a0] mb-1.5">
                      Business Email Address (OTP Verified) *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-[#666]" />
                      <input
                        type="email"
                        required
                        placeholder="e.g. store@pateljewellers.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full h-11 pl-10 pr-3 rounded-xl bg-[#141414] border border-[#282828] text-white text-xs sm:text-sm placeholder-[#555] focus:border-[#e5a93c] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11.5px] font-semibold text-[#a0a0a0] mb-1.5">
                      10-Digit Mobile / WhatsApp Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3 w-4 h-4 text-[#666]" />
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="e.g. 9876543210"
                        value={regMobile}
                        onChange={(e) => setRegMobile(e.target.value.replace(/\D/g, ""))}
                        className="w-full h-11 pl-10 pr-3 rounded-xl bg-[#141414] border border-[#282828] text-white text-xs sm:text-sm placeholder-[#555] focus:border-[#e5a93c] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <div>
                    <label className="block text-[11.5px] font-semibold text-[#a0a0a0] mb-1.5">
                      GSTIN / Business Registration (Optional)
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3.5 top-3 w-4 h-4 text-[#666]" />
                      <input
                        type="text"
                        placeholder="e.g. 24AAAAA0000A1Z5"
                        value={regGstin}
                        onChange={(e) => setRegGstin(e.target.value.toUpperCase())}
                        className="w-full h-11 pl-10 pr-3 rounded-xl bg-[#141414] border border-[#282828] text-white text-xs sm:text-sm placeholder-[#555] focus:border-[#e5a93c] focus:outline-none transition-colors uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11.5px] font-semibold text-[#a0a0a0] mb-1.5">
                      Instagram Handle / Store City (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. @pateljewels / Mumbai"
                      value={regInstagram}
                      onChange={(e) => setRegInstagram(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl bg-[#141414] border border-[#282828] text-white text-xs sm:text-sm placeholder-[#555] focus:border-[#e5a93c] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSendingApplyOtp}
                    className="w-full h-12 rounded-full bg-gradient-to-r from-[#d69e3d] via-[#e5a93c] to-[#f5c767] hover:brightness-110 text-black text-xs sm:text-sm font-bold uppercase tracking-wider shadow-[0_4px_20px_rgba(229,169,60,0.25)] active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSendingApplyOtp ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" />
                        <span>Sending Verification Code...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        <span>Verify Email & Continue</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-center text-[#6e6e6e] pt-1">
                  We verify your email with an OTP before submitting your application to store administration.
                </p>
              </form>
            )}

            {/* STEP 1.2: EMAIL OTP VERIFICATION */}
            {applyStep === "otp" && (
              <form onSubmit={handleVerifyApplyOtpAndSubmit} className="space-y-5 animate-fade-in">
                <div className="p-4 bg-[#141414] border border-[#2a2a2a] rounded-2xl text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8e8e93]">Business:</span>
                    <span className="text-white font-semibold">{regBusinessName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8e8e93]">Verifying Email:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#f5c767] font-semibold">{regEmail}</span>
                      <button
                        type="button"
                        onClick={() => setApplyStep("form")}
                        className="text-[11px] text-[#8e8e93] hover:text-white flex items-center gap-0.5 cursor-pointer underline ml-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                </div>

                {applyOtpError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{applyOtpError}</span>
                  </div>
                )}

                {applyDemoMessage && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs rounded-xl flex items-center gap-2">
                    <Sparkles className="w-4 h-4 shrink-0 text-[#e5a93c]" />
                    <span>{applyDemoMessage}</span>
                  </div>
                )}

                <div className="space-y-2 text-center">
                  <label className="block text-xs text-[#a0a0a0] font-medium">
                    Enter the 6-digit verification code sent to your email
                  </label>
                  <div className="flex justify-center gap-1.5 sm:gap-2">
                    {applyOtp.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`apply-otp-${idx}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleApplyOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace" && !applyOtp[idx] && idx > 0) {
                            document.getElementById(`apply-otp-${idx - 1}`)?.focus();
                          }
                        }}
                        className="w-10 sm:w-12 h-12 sm:h-13 text-center text-lg sm:text-xl font-bold bg-[#141414] border border-[#2d2d2d] focus:border-[#e5a93c] text-white rounded-xl focus:outline-none transition-colors"
                      />
                    ))}
                  </div>

                  <div className="flex justify-between items-center text-xs text-[#777] pt-2 px-1">
                    <button
                      type="button"
                      onClick={() => setApplyStep("form")}
                      className="text-[#8e8e93] hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Form</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSendApplyOtp}
                      disabled={isSendingApplyOtp}
                      className="text-[#e5a93c] hover:underline font-semibold cursor-pointer disabled:opacity-50"
                    >
                      {isSendingApplyOtp ? "Sending code..." : "Resend Code"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingApply || applyOtp.join("").length < 6}
                  className="w-full h-12 rounded-full bg-gradient-to-r from-[#d69e3d] via-[#e5a93c] to-[#f5c767] hover:brightness-110 text-black text-xs sm:text-sm font-bold uppercase tracking-wider shadow-[0_4px_20px_rgba(229,169,60,0.25)] active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingApply ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Verifying & Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Confirm Code & Submit B2B Application</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 1.3: SUBMITTED CONFIRMATION */}
            {applyStep === "submitted" && (
              <div className="text-center py-4 sm:py-6 animate-fade-in space-y-5">
                <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Clock className="w-8 h-8 animate-pulse" />
                </div>

                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Email Verified • Application Pending Approval
                  </span>
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-white mb-2">
                    Application Awaiting Admin Approval
                  </h3>
                  <p className="text-xs sm:text-sm text-[#a0a0a0] leading-relaxed max-w-md mx-auto">
                    Thank you, <strong className="text-white">{regName}</strong>! Your application for{" "}
                    <strong className="text-[#f5c767]">{regBusinessName}</strong> has been received and saved
                    to our wholesale partner database with <strong className="text-amber-400">PENDING</strong> status.
                  </p>
                </div>

                <div className="p-4 bg-[#141414] border border-[#262626] rounded-2xl text-left max-w-md mx-auto text-xs text-[#8e8e93] space-y-2">
                  <p className="flex justify-between">
                    <span className="text-[#8e8e93]">Business Name:</span>
                    <span className="text-white font-medium">{regBusinessName}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-[#8e8e93]">Registered Mobile:</span>
                    <span className="text-white font-medium">+91 {regMobile}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-[#8e8e93]">Verified Email:</span>
                    <span className="text-emerald-400 font-medium">{regEmail} ✓</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-[#8e8e93]">Approval Status:</span>
                    <span className="text-amber-400 font-bold uppercase tracking-wider">
                      Pending Admin Review
                    </span>
                  </p>
                </div>

                <div className="p-3 bg-[#111111] rounded-xl border border-[#222222] text-[11.5px] text-[#909090] max-w-md mx-auto leading-relaxed">
                  💡 <strong className="text-white">Note:</strong> Login OTP is only issued to{" "}
                  <span className="text-[#f5c767]">approved accounts</span>. Once our admin approves your
                  profile, you can sign in directly using this verified email address.
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("login");
                      setLoginEmail(regEmail);
                      setLoginStep("email");
                    }}
                    className="py-3 px-6 rounded-full bg-gradient-to-r from-[#e5a93c] to-[#f5c767] text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 cursor-pointer shadow-md"
                  >
                    Go to Approved Sign In
                  </button>
                  <button
                    type="button"
                    onClick={onReturnToRetail}
                    className="py-3 px-6 rounded-full bg-[#171717] hover:bg-[#222] border border-[#2e2e2e] text-[#a0a0a0] hover:text-white font-semibold text-xs tracking-wider uppercase cursor-pointer"
                  >
                    Return to Retail Store
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: APPROVED PARTNER SIGN IN                                */}
        {/* ============================================================== */}
        {activeTab === "login" && (
          <div className="relative z-10 space-y-5 animate-fade-in">
            {/* STEP 2.1: ENTER APPROVED EMAIL */}
            {loginStep === "email" && (
              <form onSubmit={handleSendLoginOtp} className="space-y-4">
                <div className="p-3 bg-[#141414] border border-[#262626] rounded-xl text-xs text-[#a0a0a0] leading-relaxed">
                  Enter your approved wholesale business email address. Our security system will verify that your account is approved before sending a one-time login code.
                </div>

                {loginError && (
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold text-rose-300">
                        {loginAccountStatus === "pending"
                          ? "Account Approval In Progress"
                          : loginAccountStatus === "rejected"
                          ? "Application Not Approved"
                          : "Wholesale Sign In Notice"}
                      </p>
                      <p className="text-rose-400/90 leading-relaxed">{loginError}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-[11.5px] font-semibold text-[#a0a0a0]">
                    Approved Wholesale Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-[#666]" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. store@pateljewellers.com"
                      value={loginEmail}
                      onChange={(e) => {
                        setLoginEmail(e.target.value);
                        setLoginError(null);
                      }}
                      className="w-full h-11 pl-10 pr-3 rounded-xl bg-[#141414] border border-[#282828] text-white text-xs sm:text-sm placeholder-[#555] focus:border-[#e5a93c] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSendingLoginOtp}
                  className="w-full h-12 rounded-full bg-gradient-to-r from-[#d69e3d] via-[#e5a93c] to-[#f5c767] hover:brightness-110 text-black text-xs sm:text-sm font-bold uppercase tracking-wider shadow-[0_4px_20px_rgba(229,169,60,0.25)] active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSendingLoginOtp ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Approval & Sending Code...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Send Login OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <p className="text-xs text-[#8e8e93]">
                    Haven&apos;t registered as a wholesale partner yet?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("apply");
                        setApplyStep("form");
                        setLoginError(null);
                      }}
                      className="text-[#e5a93c] hover:underline font-semibold cursor-pointer"
                    >
                      Apply for B2B Account
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* STEP 2.2: ENTER 6-DIGIT LOGIN OTP */}
            {loginStep === "otp" && (
              <form onSubmit={handleVerifyLoginOtp} className="space-y-5 animate-fade-in">
                <div className="p-4 bg-[#0a180e] border border-emerald-500/40 rounded-2xl text-xs space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Approved Wholesale Partner Verified</span>
                  </div>
                  {approvedUserData && (
                    <p className="text-white">
                      Welcome back, <strong>{approvedUserData.name}</strong> (
                      <span className="text-[#f5c767]">{approvedUserData.businessName}</span>)!
                    </p>
                  )}
                  <p className="text-[#8e8e93]">
                    A 6-digit login verification code was sent to{" "}
                    <strong className="text-white">{loginEmail}</strong>.
                  </p>
                </div>

                {loginOtpError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{loginOtpError}</span>
                  </div>
                )}

                {loginDemoMessage && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs rounded-xl flex items-center gap-2">
                    <Sparkles className="w-4 h-4 shrink-0 text-[#e5a93c]" />
                    <span>{loginDemoMessage}</span>
                  </div>
                )}

                <div className="space-y-2 text-center">
                  <label className="block text-xs text-[#a0a0a0] font-medium">
                    Enter the 6-digit login code
                  </label>
                  <div className="flex justify-center gap-1.5 sm:gap-2">
                    {loginOtp.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`login-gate-otp-${idx}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleLoginOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace" && !loginOtp[idx] && idx > 0) {
                            document.getElementById(`login-gate-otp-${idx - 1}`)?.focus();
                          }
                        }}
                        className="w-10 sm:w-12 h-12 sm:h-13 text-center text-lg sm:text-xl font-bold bg-[#141414] border border-[#2d2d2d] focus:border-[#e5a93c] text-white rounded-xl focus:outline-none transition-colors"
                      />
                    ))}
                  </div>

                  <div className="flex justify-between items-center text-xs text-[#777] pt-2 px-1">
                    <button
                      type="button"
                      onClick={() => setLoginStep("email")}
                      className="text-[#8e8e93] hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Change Email</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSendLoginOtp}
                      disabled={isSendingLoginOtp}
                      className="text-[#e5a93c] hover:underline font-semibold cursor-pointer disabled:opacity-50"
                    >
                      {isSendingLoginOtp ? "Sending code..." : "Resend Code"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isVerifyingLoginOtp || loginOtp.join("").length < 6}
                  className="w-full h-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-black font-bold text-xs sm:text-sm uppercase tracking-wider cursor-pointer shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 active:scale-98 transition-all"
                >
                  {isVerifyingLoginOtp ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Access...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Unlock Wholesale Portal & Pricing</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Value Prop Badges */}
        <div className="mt-8 pt-6 border-t border-[#1c1c1c] grid grid-cols-3 gap-2 text-center text-[10px] text-[#707070] relative z-10">
          <div>
            <Sparkles className="w-3.5 h-3.5 mx-auto text-[#e5a93c] mb-1" />
            <p className="font-semibold text-[#a0a0a0]">Factory Direct Rates</p>
            <p className="hidden sm:block">Trade margins protected</p>
          </div>
          <div>
            <ShieldCheck className="w-3.5 h-3.5 mx-auto text-[#e5a93c] mb-1" />
            <p className="font-semibold text-[#a0a0a0]">Admin Approved</p>
            <p className="hidden sm:block">Strict B2B verification</p>
          </div>
          <div>
            <Crown className="w-3.5 h-3.5 mx-auto text-[#e5a93c] mb-1" />
            <p className="font-semibold text-[#a0a0a0]">B2B Tiers</p>
            <p className="hidden sm:block">Min ₹3,000 threshold</p>
          </div>
        </div>
      </div>
    </div>
  );
}
