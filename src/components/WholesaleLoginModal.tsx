"use client";

import React, { useState, useEffect } from "react";
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
  RotateCw,
  Edit2,
  FileText,
} from "lucide-react";

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
  // Tabs: "apply" (new registration) | "login" (approved partner sign in)
  const [activeTab, setActiveTab] = useState<"apply" | "login">("apply");

  // -------------------------------------------------------------
  // APPLY / REGISTRATION STATE
  // -------------------------------------------------------------
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

  // -------------------------------------------------------------
  // APPROVED LOGIN STATE
  // -------------------------------------------------------------
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

  useEffect(() => {
    if (isOpen) {
      setApplyError(null);
      setApplyOtpError(null);
      setLoginError(null);
      setLoginOtpError(null);
      try {
        const savedEmail = localStorage.getItem("fc_wholesale_email");
        if (savedEmail) setLoginEmail(savedEmail);
      } catch {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // -------------------------------------------------------------
  // APPLY HANDLERS
  // -------------------------------------------------------------
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

  const handleApplyOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const updated = [...applyOtp];
    updated[index] = digit;
    setApplyOtp(updated);

    if (digit && index < 5) {
      document.getElementById(`modal-apply-otp-${index + 1}`)?.focus();
    }
  };

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

      // 2. Submit application to wholesaleUsers database table
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

  // -------------------------------------------------------------
  // APPROVED LOGIN HANDLERS
  // -------------------------------------------------------------
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

      // Approved! Fetch user info
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

  const handleLoginOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const updated = [...loginOtp];
    updated[index] = digit;
    setLoginOtp(updated);

    if (digit && index < 5) {
      document.getElementById(`modal-login-otp-${index + 1}`)?.focus();
    }
  };

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

      onSuccess(mobile);
      onClose();
    } catch {
      setIsVerifyingLoginOtp(false);
      setLoginOtpError("Network error verifying code. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-[480px] bg-[#0c0c0c] border border-[#d69e3d] rounded-[24px] sm:rounded-[26px] p-5 sm:p-6 shadow-2xl overflow-y-auto max-h-[92vh]">
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
          <div className="w-14 h-14 sm:w-16 sm:h-16 relative rounded-full overflow-hidden border border-[#e5a93c]/50 p-1 shadow-[0_0_25px_rgba(229,169,60,0.25)] shrink-0">
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
              <Building2 className="w-3 h-3" />
              <span>B2B Wholesale Portal</span>
            </div>
            <h3 className="text-white text-[18px] sm:text-[20px] font-serif font-medium leading-snug">
              {activeTab === "apply"
                ? applyStep === "submitted"
                  ? "Application Received!"
                  : "Wholesale Application"
                : "Approved Partner Sign In"}
            </h3>
            <p className="text-[#8e8e93] text-xs pt-0.5">
              {activeTab === "apply"
                ? applyStep === "submitted"
                  ? "Your request was sent to store admin for review"
                  : "Email OTP verification required before admin approval"
                : "Enter approved business email to receive login OTP"}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        {applyStep !== "submitted" && (
          <div className="flex bg-[#141414] p-1 rounded-xl border border-[#262626] mb-5">
            <button
              type="button"
              onClick={() => {
                setActiveTab("apply");
                setLoginError(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "apply"
                  ? "bg-gradient-to-r from-[#e5a93c] to-[#f5c767] text-black shadow-md"
                  : "text-[#8e8e93] hover:text-white"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Apply for Account</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("login");
                setApplyError(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "login"
                  ? "bg-gradient-to-r from-[#e5a93c] to-[#f5c767] text-black shadow-md"
                  : "text-[#8e8e93] hover:text-white"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Approved Sign In</span>
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 1: APPLY FOR WHOLESALE ACCOUNT                            */}
        {/* ============================================================== */}
        {activeTab === "apply" && (
          <div>
            {/* Step 1: Form */}
            {applyStep === "form" && (
              <form onSubmit={handleSendApplyOtp} className="space-y-3.5 animate-fade-in">
                {applyError && (
                  <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800/60 text-red-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{applyError}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs text-[#a0a0a0] font-medium flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#e5a93c]" />
                    <span>Contact Person Name *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Patel"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full h-11 rounded-xl bg-[#141414] border border-[#2a2a2a] px-3 text-white text-xs sm:text-sm placeholder-[#666] outline-none focus:border-[#e5a93c] transition-all"
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
                    placeholder="e.g. Patel Jewellers"
                    value={regBusinessName}
                    onChange={(e) => setRegBusinessName(e.target.value)}
                    className="w-full h-11 rounded-xl bg-[#141414] border border-[#2a2a2a] px-3 text-white text-xs sm:text-sm placeholder-[#666] outline-none focus:border-[#e5a93c] transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[#a0a0a0] font-medium flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#e5a93c]" />
                    <span>Business Email (OTP Verification) *</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. store@pateljewellers.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full h-11 rounded-xl bg-[#141414] border border-[#2a2a2a] px-3 text-white text-xs sm:text-sm placeholder-[#666] outline-none focus:border-[#e5a93c] transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[#a0a0a0] font-medium flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#e5a93c]" />
                    <span>10-Digit Mobile / WhatsApp *</span>
                  </label>
                  <div className="flex items-center h-11 rounded-xl bg-[#141414] border border-[#2a2a2a] px-3 focus-within:border-[#e5a93c] transition-all">
                    <span className="text-[#8e8e93] text-xs font-medium mr-2 border-r border-[#262626] pr-2">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit number"
                      maxLength={10}
                      value={regMobile}
                      onChange={(e) => setRegMobile(e.target.value.replace(/\D/g, ""))}
                      className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-[#666] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="GSTIN (Optional)"
                    value={regGstin}
                    onChange={(e) => setRegGstin(e.target.value.toUpperCase())}
                    className="w-full h-10 rounded-xl bg-[#141414] border border-[#2a2a2a] px-3 text-white text-xs placeholder-[#666] outline-none focus:border-[#e5a93c] uppercase"
                  />
                  <input
                    type="text"
                    placeholder="City / Instagram (Optional)"
                    value={regInstagram}
                    onChange={(e) => setRegInstagram(e.target.value)}
                    className="w-full h-10 rounded-xl bg-[#141414] border border-[#2a2a2a] px-3 text-white text-xs placeholder-[#666] outline-none focus:border-[#e5a93c]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSendingApplyOtp}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-[#d4992e] to-[#f5c767] hover:brightness-110 text-black font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-98 disabled:opacity-50 mt-2"
                >
                  {isSendingApplyOtp ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Sending Email Code...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Verify Email & Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Step 2: OTP */}
            {applyStep === "otp" && (
              <form onSubmit={handleVerifyApplyOtpAndSubmit} className="space-y-4 animate-fade-in">
                <div className="p-3 bg-[#141414] border border-[#262626] rounded-xl text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[#8e8e93]">Business:</span>
                    <span className="text-white font-medium">{regBusinessName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#8e8e93]">Verifying Email:</span>
                    <span className="text-[#f5c767] font-semibold flex items-center gap-1">
                      {regEmail}
                      <button
                        type="button"
                        onClick={() => setApplyStep("form")}
                        className="text-[10px] text-[#8e8e93] hover:text-white underline ml-1 cursor-pointer"
                      >
                        Edit
                      </button>
                    </span>
                  </div>
                </div>

                {applyOtpError && (
                  <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800/60 text-red-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{applyOtpError}</span>
                  </div>
                )}

                {applyDemoMessage && (
                  <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-800/60 text-amber-200 text-xs flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 shrink-0 text-[#e5a93c]" />
                    <span>{applyDemoMessage}</span>
                  </div>
                )}

                <div className="space-y-2 text-center">
                  <label className="block text-xs text-[#a0a0a0]">
                    Enter 6-digit verification code sent to your email
                  </label>
                  <div className="flex justify-center gap-1.5 sm:gap-2">
                    {applyOtp.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`modal-apply-otp-${idx}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleApplyOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace" && !applyOtp[idx] && idx > 0) {
                            document.getElementById(`modal-apply-otp-${idx - 1}`)?.focus();
                          }
                        }}
                        className="w-10 sm:w-11 h-12 rounded-xl bg-[#141414] border border-[#2a2a2a] focus:border-[#e5a93c] text-white text-lg font-bold text-center outline-none transition-all"
                      />
                    ))}
                  </div>

                  <div className="flex justify-between items-center text-xs text-[#777] pt-1">
                    <button
                      type="button"
                      onClick={() => setApplyStep("form")}
                      className="text-[#8e8e93] hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSendApplyOtp}
                      disabled={isSendingApplyOtp}
                      className="text-[#e5a93c] hover:underline cursor-pointer disabled:opacity-50"
                    >
                      {isSendingApplyOtp ? "Sending..." : "Resend Code"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingApply || applyOtp.join("").length < 6}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-[#d4992e] to-[#f5c767] hover:brightness-110 text-black font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-98 disabled:opacity-50"
                >
                  {isSubmittingApply ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Submitting Application...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Confirm & Submit Application</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Step 3: Submitted */}
            {applyStep === "submitted" && (
              <div className="space-y-4 text-center py-2 animate-fade-in">
                <div className="w-14 h-14 mx-auto rounded-full bg-[#181409] border border-[#e5a93c] flex items-center justify-center text-[#e5a93c] shadow-[0_0_25px_rgba(229,169,60,0.3)]">
                  <Clock className="w-7 h-7 animate-pulse" />
                </div>

                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950/80 border border-amber-500/50 text-amber-300">
                    Email Verified • Pending Admin Review
                  </span>
                  <h4 className="text-white text-base font-serif font-medium pt-1">
                    Application Received, {regName}!
                  </h4>
                  <p className="text-[#a0a0a0] text-xs leading-relaxed max-w-[340px] mx-auto">
                    Your wholesale registration for <strong className="text-white">{regBusinessName}</strong> has been saved. Only approved wholesale users receive login access.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#121212] border border-[#262626] text-left text-xs space-y-1 text-[#8e8e93]">
                  <div className="flex justify-between">
                    <span>Business:</span>
                    <span className="text-white font-medium">{regBusinessName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Verified Email:</span>
                    <span className="text-emerald-400 font-medium">{regEmail} ✓</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="text-amber-400 font-semibold">Pending Approval</span>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <a
                    href={`https://wa.me/916289417338?text=Hello%20Fab%20Creations%2C%20I%20have%20submitted%20my%20wholesale%20application%20for%20${encodeURIComponent(
                      regBusinessName
                    )}%20(Email%3A%20${regEmail}).%20Please%20review%20and%20approve.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 rounded-xl bg-[#141b12] hover:bg-[#1a2517] border border-emerald-500/50 text-emerald-400 text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp Admin for Express Approval</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("login");
                      setLoginEmail(regEmail);
                      setLoginStep("email");
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#e5a93c] to-[#f5c767] text-black text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Go to Approved Sign In
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
          <div className="space-y-4 animate-fade-in">
            {loginStep === "email" && (
              <form onSubmit={handleSendLoginOtp} className="space-y-3.5">
                <div className="p-3 bg-[#141414] border border-[#262626] rounded-xl text-xs text-[#a0a0a0] leading-relaxed">
                  Sign in with your approved wholesale business email address. Only admin-approved accounts can receive login OTPs.
                </div>

                {loginError && (
                  <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-red-200 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-rose-300">
                        {loginAccountStatus === "pending"
                          ? "Account Awaiting Approval"
                          : loginAccountStatus === "rejected"
                          ? "Application Not Approved"
                          : "Notice"}
                      </p>
                      <p className="text-red-300/90 leading-relaxed mt-0.5">{loginError}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs text-[#a0a0a0] font-medium flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#e5a93c]" />
                    <span>Approved Wholesale Email Address *</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. store@pateljewellers.com"
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      setLoginError(null);
                    }}
                    autoFocus
                    className="w-full h-11 rounded-xl bg-[#141414] border border-[#2a2a2a] px-3 text-white text-xs sm:text-sm placeholder-[#666] outline-none focus:border-[#e5a93c] transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSendingLoginOtp}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-[#d4992e] to-[#f5c767] hover:brightness-110 text-black font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-98 disabled:opacity-50 mt-1"
                >
                  {isSendingLoginOtp ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Checking Approval & Sending Code...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Send Login OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center border-t border-[#1c1c1c]">
                  <p className="text-xs text-[#8e8e93]">
                    Need to apply first?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("apply");
                        setApplyStep("form");
                        setLoginError(null);
                      }}
                      className="text-[#e5a93c] hover:underline font-semibold cursor-pointer"
                    >
                      Fill B2B Application
                    </button>
                  </p>
                </div>
              </form>
            )}

            {loginStep === "otp" && (
              <form onSubmit={handleVerifyLoginOtp} className="space-y-4 animate-fade-in">
                <div className="p-3 bg-[#0a180e] border border-emerald-500/40 rounded-xl text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Approved Wholesale Partner</span>
                  </div>
                  {approvedUserData && (
                    <p className="text-white">
                      Welcome back, <strong>{approvedUserData.name}</strong> ({approvedUserData.businessName})
                    </p>
                  )}
                  <p className="text-[#8e8e93]">
                    Verification OTP sent to <strong className="text-white">{loginEmail}</strong>
                  </p>
                </div>

                {loginOtpError && (
                  <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800/60 text-red-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{loginOtpError}</span>
                  </div>
                )}

                {loginDemoMessage && (
                  <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-800/60 text-amber-200 text-xs flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 shrink-0 text-[#e5a93c]" />
                    <span>{loginDemoMessage}</span>
                  </div>
                )}

                <div className="space-y-2 text-center">
                  <label className="block text-xs text-[#a0a0a0]">
                    Enter 6-digit login verification code
                  </label>
                  <div className="flex justify-center gap-1.5 sm:gap-2">
                    {loginOtp.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`modal-login-otp-${idx}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleLoginOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace" && !loginOtp[idx] && idx > 0) {
                            document.getElementById(`modal-login-otp-${idx - 1}`)?.focus();
                          }
                        }}
                        className="w-10 sm:w-11 h-12 rounded-xl bg-[#141414] border border-[#2a2a2a] focus:border-[#e5a93c] text-white text-lg font-bold text-center outline-none transition-all"
                      />
                    ))}
                  </div>

                  <div className="flex justify-between items-center text-xs text-[#777] pt-1">
                    <button
                      type="button"
                      onClick={() => setLoginStep("email")}
                      className="text-[#8e8e93] hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>Change Email</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSendLoginOtp}
                      disabled={isSendingLoginOtp}
                      className="text-[#e5a93c] hover:underline cursor-pointer disabled:opacity-50"
                    >
                      {isSendingLoginOtp ? "Sending..." : "Resend Code"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isVerifyingLoginOtp || loginOtp.join("").length < 6}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-black font-bold text-xs sm:text-sm uppercase tracking-wider cursor-pointer shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 active:scale-98 transition-all"
                >
                  {isVerifyingLoginOtp ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Unlock Wholesale Access</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
