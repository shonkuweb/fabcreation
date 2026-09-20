"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import HomeScreen from "@/components/HomeScreen";
import ShopScreen from "@/components/ShopScreen";
import CartScreen from "@/components/CartScreen";
import AccountScreen from "@/components/AccountScreen";
import ProductDetailsScreen from "@/components/ProductDetailsScreen";
import { Product, Category, OrderItem } from "@/lib/db";

const R2_BASE = "https://pub-ce8688bc6c654bcfb99716f7c9373bcd.r2.dev/fab-creations";
const LOGO_R2_URL = `${R2_BASE}/logo.png`;

export default function StoreFront() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp" | "home" | "shop" | "cart" | "account" | "product">("phone");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [activeOtpIndex, setActiveOtpIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [logoSrc, setLogoSrc] = useState(LOGO_R2_URL);

  // Live Database States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Fetch live store data from APIs
  const fetchStoreData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch("/api/products", { cache: "no-store" }),
        fetch("/api/categories", { cache: "no-store" }),
      ]);
      const prodData = await prodRes.json();
      const catData = await catRes.json();
      if (prodData.success && Array.isArray(prodData.products)) {
        setProducts(prodData.products);
      }
      if (catData.success && Array.isArray(catData.categories)) {
        setCategories(catData.categories);
      }
    } catch (err) {
      console.error("Failed to fetch store data:", err);
    }
  };

  // Load cart & wishlist from localStorage on mount & check login
  useEffect(() => {
    try {
      const loggedIn = localStorage.getItem("fc_user_logged_in");
      if (loggedIn === "true") {
        router.replace("/home");
        return;
      }
    } catch {}

    fetchStoreData();

    try {
      const savedCart = localStorage.getItem("fc_b2b_cart");
      if (savedCart) setCart(JSON.parse(savedCart));

      const savedWishlist = localStorage.getItem("fc_b2b_wishlist");
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
    } catch {
      // ignore
    }
  }, [router]);

  // Cart operations
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      let updated: OrderItem[];
      if (existing) {
        updated = prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        updated = [
          ...prev,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            quantity,
            image: product.image,
          },
        ];
      }
      try {
        localStorage.setItem("fc_b2b_cart", JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleUpdateCartQuantity = (id: string, quantity: number) => {
    setCart((prev) => {
      let updated: OrderItem[];
      if (quantity <= 0) {
        updated = prev.filter((item) => item.id !== id);
      } else {
        updated = prev.map((item) =>
          item.id === id ? { ...item, quantity } : item
        );
      }
      try {
        localStorage.setItem("fc_b2b_cart", JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleRemoveFromCart = (id: string) => {
    setCart((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem("fc_b2b_cart", JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleClearCart = () => {
    setCart([]);
    try {
      localStorage.removeItem("fc_b2b_cart");
    } catch {
      // ignore
    }
  };

  // Wishlist operations
  const handleToggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      const updated = exists
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      try {
        localStorage.setItem("fc_b2b_wishlist", JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistProducts = products.filter((p) => wishlist.includes(p.id));

  // Phone input handler
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setMobileNumber(value);
      if (error) setError(null);
    }
  };

  // Continue button on phone screen
  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobileNumber.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setTimeout(() => {
      setIsSubmitting(false);
      setStep("otp");
      setActiveOtpIndex(0);
    }, 350);
  };

  // OTP input handling
  const handleOtpChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    const newOtp = [...otp];

    if (val.length > 1) {
      const pastedDigits = val.slice(0, 6).split("");
      pastedDigits.forEach((digit, i) => {
        if (i < 6) newOtp[i] = digit;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(pastedDigits.length, 5);
      setActiveOtpIndex(nextIndex);
      otpInputsRef.current[nextIndex]?.focus();
      return;
    }

    newOtp[index] = val;
    setOtp(newOtp);
    if (error) setError(null);

    if (val && index < 5) {
      setActiveOtpIndex(index + 1);
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        setActiveOtpIndex(index - 1);
        otpInputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      setActiveOtpIndex(index - 1);
      otpInputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      setActiveOtpIndex(index + 1);
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (otp.join("").length < 6) {
      setOtp(["1", "2", "3", "4", "5", "6"]);
    }

    try {
      localStorage.setItem("fc_user_logged_in", "true");
      localStorage.setItem("fc_user_mobile", mobileNumber || "6289417338");
    } catch {}

    setTimeout(() => {
      setIsSubmitting(false);
      router.push("/home");
    }, 150);
  };

  const handleResendOtp = () => {
    setNotification("A new 6-digit OTP has been sent!");
    setOtp(["", "", "", "", "", ""]);
    setActiveOtpIndex(0);
    otpInputsRef.current[0]?.focus();
    setTimeout(() => setNotification(null), 3500);
  };

  useEffect(() => {
    if (step === "otp") {
      otpInputsRef.current[0]?.focus();
    }
  }, [step]);

  // Home Screen
  if (step === "home") {
    return (
      <HomeScreen
        products={products}
        categories={categories}
        cartCount={cartCount}
        wishlist={wishlist}
        onToggleWishlist={handleToggleWishlist}
        onSignOut={() => {
          try {
            localStorage.removeItem("fc_user_logged_in");
          } catch {}
          setStep("phone");
        }}
        onNavigateHome={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        onNavigateShop={() => router.push("/shop")}
        onNavigateCart={() => router.push("/cart")}
        onNavigateAccount={() => router.push("/account")}
        onSelectProduct={(p) => router.push(`/product?id=${p.id}`)}
        onAddToCart={handleAddToCart}
        onSelectCategory={(catName) => router.push(`/shop?cat=${encodeURIComponent(catName || "")}`)}
      />
    );
  }

  // Shop Screen
  if (step === "shop") {
    return (
      <ShopScreen
        products={products}
        categories={categories}
        cartCount={cartCount}
        wishlist={wishlist}
        onToggleWishlist={handleToggleWishlist}
        selectedCategory={selectedCategory}
        onNavigateHome={() => router.push("/home")}
        onNavigateCart={() => router.push("/cart")}
        onNavigateAccount={() => router.push("/account")}
        onSelectProduct={(p) => router.push(`/product?id=${p.id}`)}
        onAddToCart={handleAddToCart}
        onSelectCategory={(catName) => router.push(`/shop?cat=${encodeURIComponent(catName || "")}`)}
        onSignOut={() => {
          try {
            localStorage.removeItem("fc_user_logged_in");
          } catch {}
          setStep("phone");
        }}
      />
    );
  }

  // Cart Screen
  if (step === "cart") {
    return (
      <CartScreen
        cart={cart}
        userMobile={mobileNumber || "6289417338"}
        categories={categories}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onNavigateHome={() => router.push("/home")}
        onNavigateShop={() => router.push("/shop")}
        onNavigateAccount={() => router.push("/account")}
        onSelectCategory={(catName) => router.push(`/shop?cat=${encodeURIComponent(catName || "")}`)}
        onSignOut={() => {
          try {
            localStorage.removeItem("fc_user_logged_in");
          } catch {}
          setStep("phone");
        }}
      />
    );
  }

  // Account Screen
  if (step === "account") {
    return (
      <AccountScreen
        userMobile={mobileNumber || "6289417338"}
        cartCount={cartCount}
        categories={categories}
        wishlist={wishlist}
        wishlistProducts={wishlistProducts}
        onToggleWishlist={handleToggleWishlist}
        onAddToCart={handleAddToCart}
        onSelectProduct={(p) => router.push(`/product?id=${p.id}`)}
        onNavigateHome={() => router.push("/home")}
        onNavigateShop={() => router.push("/shop")}
        onNavigateCart={() => router.push("/cart")}
        onSelectCategory={(catName) => router.push(`/shop?cat=${encodeURIComponent(catName || "")}`)}
        onSignOut={() => {
          try {
            localStorage.removeItem("fc_user_logged_in");
          } catch {}
          setStep("phone");
        }}
      />
    );
  }

  // Product Details Screen
  if (step === "product") {
    return (
      <ProductDetailsScreen
        product={selectedProduct}
        allProducts={products}
        categories={categories}
        cartCount={cartCount}
        wishlist={wishlist}
        onToggleWishlist={handleToggleWishlist}
        onAddToCart={handleAddToCart}
        onSelectProduct={(p) => router.push(`/product?id=${p.id}`)}
        onNavigateHome={() => router.push("/home")}
        onNavigateShop={() => router.push("/shop")}
        onNavigateCart={() => router.push("/cart")}
        onNavigateAccount={() => router.push("/account")}
        onSelectCategory={(catName) => router.push(`/shop?cat=${encodeURIComponent(catName || "")}`)}
        onSignOut={() => {
          try {
            localStorage.removeItem("fc_user_logged_in");
          } catch {}
          setStep("phone");
        }}
      />
    );
  }

  return (
    <main className="relative min-h-screen w-full bg-[#050505] flex flex-col items-center justify-center p-4 sm:p-6 overflow-x-hidden select-none">
      <div 
        className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full opacity-20 blur-[130px]"
        style={{
          background: "radial-gradient(circle, rgba(229,169,60,0.35) 0%, rgba(200,140,40,0.12) 50%, transparent 70%)"
        }}
      />

      <div className="relative w-full max-w-[420px] flex flex-col items-center">
        {/* Brand Circular Logo from R2 CDN */}
        <div className="mb-7 transition-transform duration-300 hover:scale-[1.015] flex justify-center">
          <div className="w-[185px] h-[185px] sm:w-[200px] sm:h-[200px] relative rounded-full overflow-hidden flex items-center justify-center shrink-0">
            <Image
              src={logoSrc}
              alt="Fab Creations Logo"
              width={220}
              height={220}
              priority
              unoptimized
              onError={() => setLogoSrc("/images/logo.png")}
              className="object-contain w-full h-full"
            />
          </div>
        </div>

        {/* Main Card */}
        <div className="w-full bg-[#0d0d0d] border border-[#d69e3d] rounded-[24px] sm:rounded-[26px] p-5 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.85)] backdrop-blur-sm transition-all duration-300">
          {step === "phone" ? (
            /* SCREEN 1: Mobile Number Input Screen */
            <div>
              <p className="text-[#e5a93c] text-[12px] font-semibold tracking-[0.18em] uppercase mb-4">
                SIGN IN / REGISTER
              </p>

              <h1 className="text-white text-[24px] sm:text-[27px] font-semibold tracking-[-0.01em] leading-[1.25] mb-2">
                Continue with your <br className="hidden sm:inline" />
                mobile number
              </h1>

              <p className="text-[#8e8e93] text-[14px] leading-normal mb-8">
                Enter your mobile number to continue.
              </p>

              <form onSubmit={handlePhoneSubmit} className="space-y-6">
                <div>
                  <label 
                    htmlFor="mobile-input" 
                    className="block text-[#a0a0a0] text-[13.5px] font-normal mb-2"
                  >
                    Mobile number
                  </label>

                  <div className="flex items-center h-[52px] w-full rounded-[14px] border border-[#e5a93c] bg-[#0d0d0d] px-1 focus-within:ring-1 focus-within:ring-[#e5a93c] focus-within:border-[#f5c767] transition-all duration-200">
                    <div className="flex items-center justify-center pl-3 pr-3 text-[#e5a93c] font-semibold text-[15.5px]">
                      +91
                    </div>

                    <div className="h-[28px] w-[1px] bg-[#5c4317]" />

                    <input
                      id="mobile-input"
                      name="mobile"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      enterKeyHint="done"
                      required
                      placeholder="10-digit mobile number"
                      value={mobileNumber}
                      onChange={handlePhoneChange}
                      className="flex-1 bg-transparent px-3.5 text-white placeholder-[#555555] text-[15px] outline-none font-normal tracking-wide"
                      maxLength={10}
                      autoFocus
                    />
                  </div>

                  {error && (
                    <p className="mt-2 text-xs text-rose-400 font-medium">
                      {error}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-[50px] sm:h-[52px] rounded-[14px] bg-[#f0a939] hover:bg-[#f5b842] active:scale-[0.99] text-[#111111] font-semibold text-[15.5px] flex items-center justify-center shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-75"
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      <span>Sending OTP...</span>
                    </div>
                  ) : (
                    "Continue"
                  )}
                </button>
              </form>

              <div className="mt-8 mb-5 w-full h-[1px] bg-[#222222]" />

              <p className="text-center text-[#7a7a80] text-[12px] sm:text-[12.5px] tracking-normal font-normal">
                © 2026 Fab Creations · Presented by ShonkuWEB
              </p>
            </div>
          ) : (
            /* SCREEN 2: OTP Verification Screen */
            <div>
              <p className="text-[#e5a93c] text-[12px] font-semibold tracking-[0.18em] uppercase mb-4">
                VERIFY MOBILE
              </p>

              <h1 className="text-white text-[24px] sm:text-[27px] font-semibold tracking-[-0.01em] leading-[1.25] mb-2">
                Enter the OTP sent to your <br />
                phone
              </h1>

              <p className="text-[#8e8e93] text-[14px] leading-normal mb-8">
                We sent a 6-digit code to this number. Enter it to continue.
              </p>

              {notification && (
                <div className="mb-4 p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs text-center animate-fade-in">
                  {notification}
                </div>
              )}

              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[#a0a0a0] text-[13.5px] font-normal">
                      OTP code
                    </span>
                    <span className="text-[#6b7280] text-[12.5px] font-normal">
                      Auto-fill supported
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1.5 sm:gap-2.5">
                    {otp.map((digit, index) => {
                      const isActive = activeOtpIndex === index;
                      return (
                        <div
                          key={index}
                          onClick={() => {
                            setActiveOtpIndex(index);
                            otpInputsRef.current[index]?.focus();
                          }}
                          className={`relative flex-1 h-[48px] sm:h-[56px] rounded-[11px] sm:rounded-[13px] bg-[#0d0d0d] flex items-center justify-center transition-all duration-200 cursor-text ${
                            isActive
                              ? "border border-[#e5a93c] shadow-[0_0_12px_rgba(229,169,60,0.22)]"
                              : "border border-[#2a2a2a] hover:border-[#3d3d3d]"
                          }`}
                        >
                          <input
                            ref={(el) => {
                              otpInputsRef.current[index] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            pattern="[0-9]*"
                            maxLength={6}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            onFocus={() => setActiveOtpIndex(index)}
                            className="w-full h-full bg-transparent text-center text-white text-[20px] font-semibold outline-none caret-transparent select-none"
                          />

                          {isActive && !digit && (
                            <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                              <span className="w-[1.5px] h-[22px] bg-[#e5a93c] animate-pulse" />
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {error && (
                    <p className="mt-2.5 text-xs text-rose-400 font-medium text-center">
                      {error}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-[50px] sm:h-[52px] rounded-[14px] bg-[#f0a939] hover:bg-[#f5b842] active:scale-[0.99] text-[#111111] font-semibold text-[15.5px] flex items-center justify-center shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-75"
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      <span>Verifying & entering store...</span>
                    </div>
                  ) : (
                    "Verify OTP"
                  )}
                </button>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("phone");
                      setError(null);
                    }}
                    className="text-[#e5a93c] hover:text-[#f5c767] text-[13.5px] font-medium transition-colors cursor-pointer"
                  >
                    Change number
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-[#e5a93c] hover:text-[#f5c767] text-[13.5px] font-medium transition-colors cursor-pointer"
                  >
                    Resend OTP
                  </button>
                </div>
              </form>

              <div className="mt-8 mb-5 w-full h-[1px] bg-[#222222]" />

              <p className="text-center text-[#7a7a80] text-[12px] sm:text-[12.5px] tracking-normal font-normal">
                © 2026 Fab Creations · Presented by ShonkuWEB
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
