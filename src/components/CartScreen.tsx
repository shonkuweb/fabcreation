"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Trash2,
  Truck,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Home,
  Grid,
  User,
  Check,
  CheckCircle,
  Plus,
  Sparkles,
  AlertCircle,
  MapPin,
  FileText,
} from "lucide-react";
import CategoriesModal from "@/components/CategoriesModal";
import StoreModeToggle from "@/components/StoreModeToggle";
import RetailLoginModal from "@/components/RetailLoginModal";
import type { OrderItem, Category, Product, UserAddress } from "@/lib/db";
import { type StoreSettings, defaultSettings } from "@/lib/settings";
import {
  getCartItems,
  getCartCount,
  updateCartQtyByMode,
  removeFromCartByMode,
  clearCartByMode,
  fetchCartFromServer,
  addToCartByMode,
  getAccountAddresses,
  saveAccountAddresses,
  isUserLoggedIn,
} from "@/lib/cart";

interface CartScreenProps {
  cart?: OrderItem[];
  userMobile?: string;
  categories?: Category[];
  products?: Product[];
  storeMode?: "retail" | "wholesale";
  settings?: Partial<StoreSettings>;
  onSwitchStoreMode?: (mode: "retail" | "wholesale") => void;
  isWholesaleLoggedIn?: boolean;
  isRetailLoggedIn?: boolean;
  onOpenWholesaleLogin?: () => void;
  onUpdateQuantity?: (id: string, quantity: number) => void;
  onRemoveItem?: (id: string) => void;
  onClearCart?: () => void;
  onNavigateHome?: () => void;
  onNavigateShop?: () => void;
  onNavigateAccount?: () => void;
  onNavigateCategories?: () => void;
  onSelectCategory?: (category: string | null) => void;
  onSelectProduct?: (product: Product) => void;
  onSignOut?: () => void;
}

export default function CartScreen({
  cart: initialCart = [],
  userMobile = "",
  categories: initialCategories = [],
  products: initialProducts = [],
  storeMode = "retail",
  settings: propSettings,
  onSwitchStoreMode,
  isWholesaleLoggedIn = false,
  isRetailLoggedIn = false,
  onOpenWholesaleLogin,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onNavigateHome,
  onNavigateShop,
  onNavigateAccount,
  onNavigateCategories,
  onSelectCategory,
  onSelectProduct,
  onSignOut,
}: CartScreenProps) {
  const router = useRouter();
  const [activeCartMode, setActiveCartMode] = useState<"retail" | "wholesale">(storeMode);
  const [cart, setCart] = useState<OrderItem[]>(() => getCartItems(storeMode));
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [isRetailLoginOpen, setIsRetailLoginOpen] = useState(false);

  // Delivery address & customer contact details
  const [shippingDetails, setShippingDetails] = useState<{
    name: string;
    phone: string;
    email: string;
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
    businessName: string;
    gstin: string;
    quickNote: string;
  }>({
    name: "",
    phone: "",
    email: "",
    addressLine: "",
    city: "",
    state: "",
    pincode: "",
    businessName: "",
    gstin: "",
    quickNote: "",
  });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<"name" | "phone" | "email" | "addressLine" | "city" | "state" | "pincode", string>>
  >({});
  const fieldRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({});

  type AddressField = "name" | "phone" | "email" | "addressLine" | "city" | "state" | "pincode";

  const getFieldError = (field: AddressField, value: string): string | undefined => {
    switch (field) {
      case "name":
        return value.trim() ? undefined : "Please enter your full name.";
      case "phone": {
        const cleanPhone = value.replace(/\D/g, "");
        return cleanPhone.length === 10
          ? undefined
          : "Please enter a valid 10-digit phone number.";
      }
      case "email": {
        const cleanEmail = value.trim();
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
          ? undefined
          : "Please enter a valid email address.";
      }
      case "addressLine":
        return value.trim().length >= 5
          ? undefined
          : "Please enter your complete delivery address.";
      case "city":
        return value.trim() ? undefined : "Please enter delivery city.";
      case "state":
        return value.trim() ? undefined : "Please enter delivery state.";
      case "pincode": {
        const cleanPin = value.replace(/\D/g, "");
        return cleanPin.length === 6
          ? undefined
          : "Please enter a valid 6-digit pincode.";
      }
    }
  };

  const handleFieldBlur = (field: AddressField) => {
    const val = shippingDetails[field];
    if (!val.trim() && !fieldErrors[field]) return;
    const err = getFieldError(field, val);
    setFieldErrors((prev) => {
      if (err) return { ...prev, [field]: err };
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const updateShippingField = (
    field: AddressField | "businessName" | "gstin" | "quickNote",
    value: string
  ) => {
    setShippingDetails((prev) => ({ ...prev, [field]: value }));
    if (field in fieldErrors) {
      setFieldErrors((prev) => {
        if (!prev[field as AddressField]) return prev;
        const next = { ...prev };
        delete next[field as AddressField];
        return next;
      });
    }
  };

  // Load existing address and user details from localStorage & database
  useEffect(() => {
    if (typeof window === "undefined") return;

    const existingAddresses = getAccountAddresses(activeCartMode);
    const storedName =
      localStorage.getItem("fc_user_name") ||
      localStorage.getItem("fc_wholesale_owner") ||
      localStorage.getItem("fc_wholesale_business") ||
      "";
    const storedEmail =
      localStorage.getItem("fc_retail_email") ||
      localStorage.getItem("fc_user_email") ||
      localStorage.getItem("fc_wholesale_email") ||
      "";
    const modePhone =
      activeCartMode === "wholesale"
        ? localStorage.getItem("fc_wholesale_mobile") || ""
        : localStorage.getItem("fc_retail_mobile") || localStorage.getItem("fc_user_mobile") || "";
    const propPhone =
      userMobile && userMobile !== "8726275466" && !userMobile.includes("@") ? userMobile : "";
    const storedPhone = (modePhone || propPhone).replace(/\D/g, "");

    if (existingAddresses && existingAddresses.length > 0) {
      const first = existingAddresses[0];
      const nextPhone = (first.phone || storedPhone || "").replace(/\D/g, "");
      const nextName = first.contactName || storedName || "";
      const nextEmail = storedEmail || "";
      setShippingDetails((prev) => ({
        ...prev,
        name: prev.name || nextName,
        phone: prev.phone || nextPhone,
        email: prev.email || nextEmail,
        addressLine: prev.addressLine || first.addressLine || "",
        city: prev.city || first.city || "",
        state: prev.state || first.state || "",
        pincode: prev.pincode || first.pincode || "",
        businessName: prev.businessName || first.businessName || "",
        gstin: prev.gstin || first.gstin || "",
      }));
    } else {
      setShippingDetails((prev) => ({
        ...prev,
        name: prev.name || storedName || "",
        email: prev.email || storedEmail || "",
        phone: prev.phone || storedPhone || "",
      }));
    }
  }, [activeCartMode, userMobile]);

  const hasValidAddress = Boolean(
    shippingDetails.name.trim() &&
    shippingDetails.phone.replace(/\D/g, "").length === 10 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingDetails.email.trim()) &&
    shippingDetails.addressLine.trim().length >= 5 &&
    shippingDetails.city.trim() &&
    shippingDetails.state.trim() &&
    shippingDetails.pincode.replace(/\D/g, "").length === 6
  );

  const validateAddressFields = (showToast = true): boolean => {
    const orderedFields: AddressField[] = [
      "name",
      "phone",
      "email",
      "addressLine",
      "city",
      "state",
      "pincode",
    ];
    const errors: Partial<Record<AddressField, string>> = {};
    let firstInvalid: AddressField | null = null;

    for (const field of orderedFields) {
      const err = getFieldError(field, shippingDetails[field]);
      if (err) {
        errors[field] = err;
        if (!firstInvalid) firstInvalid = field;
      }
    }

    setFieldErrors(errors);

    if (firstInvalid) {
      if (showToast) {
        setNotification(errors[firstInvalid] || "Please complete all required checkout details.");
        setTimeout(() => setNotification(null), 3500);
      }
      requestAnimationFrame(() => {
        const el = fieldRefs.current[firstInvalid!];
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.focus();
        }
      });
      return false;
    }

    return true;
  };

  const saveCurrentAddress = () => {
    const cleanPhone = shippingDetails.phone.replace(/\D/g, "");
    const addrObj: UserAddress = {
      id: `addr_${Date.now()}`,
      contactName: shippingDetails.name.trim(),
      phone: cleanPhone,
      addressLine: shippingDetails.addressLine.trim(),
      city: shippingDetails.city.trim(),
      state: shippingDetails.state.trim(),
      pincode: shippingDetails.pincode.trim(),
      businessName: shippingDetails.businessName.trim() || undefined,
      gstin: shippingDetails.gstin.trim() || undefined,
    };
    saveAccountAddresses(activeCartMode, [addrObj]);
    try {
      localStorage.setItem("fc_user_name", shippingDetails.name.trim());
      if (shippingDetails.email.trim()) {
        localStorage.setItem("fc_retail_email", shippingDetails.email.trim());
        localStorage.setItem("fc_user_email", shippingDetails.email.trim());
      }
      if (cleanPhone) {
        localStorage.setItem("fc_retail_mobile", cleanPhone);
        localStorage.setItem("fc_user_mobile", cleanPhone);
      }
    } catch {}
  };

  // Sync activeCartMode when storeMode prop changes
  useEffect(() => {
    setActiveCartMode(storeMode);
  }, [storeMode]);

  // Load cart items for active mode from database & local cache
  useEffect(() => {
    const items = getCartItems(activeCartMode);
    setCart(items);
    setSelectedItems(items.map((i) => i.id));

    fetchCartFromServer(activeCartMode)
      .then((serverItems) => {
        setCart(serverItems);
        setSelectedItems(serverItems.map((i) => i.id));
      })
      .catch(console.error);

    const handleCartUpdate = (e?: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (!detail?.mode || detail.mode === activeCartMode) {
        const updated = getCartItems(activeCartMode);
        setCart(updated);
        setSelectedItems(updated.map((i) => i.id));
      }
    };

    window.addEventListener("cart_updated", handleCartUpdate);
    return () => window.removeEventListener("cart_updated", handleCartUpdate);
  }, [activeCartMode]);

  // Fetch categories if not provided
  useEffect(() => {
    if (initialCategories && initialCategories.length > 0) {
      setCategories(initialCategories);
    } else {
      fetch("/api/categories", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => {
          if (d.success && Array.isArray(d.categories)) setCategories(d.categories);
        })
        .catch(console.error);
    }
  }, [initialCategories]);

  // Load products for 'You May Also Like' recommendations
  const [allProducts, setAllProducts] = useState<Product[]>(initialProducts);

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setAllProducts(initialProducts);
    } else {
      fetch("/api/products", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => {
          if (d.success && Array.isArray(d.products)) {
            setAllProducts(d.products);
          }
        })
        .catch(console.error);
    }
  }, [initialProducts]);

  const cartProductIds = React.useMemo(() => new Set(cart.map((i) => i.id)), [cart]);

  const recommendedProducts = React.useMemo(() => {
    return allProducts
      .filter((p) => {
        if (cartProductIds.has(p.id)) return false;
        if (activeCartMode === "wholesale") {
          return p.channel === "wholesale" || p.channel === "both" || !p.channel;
        }
        return p.channel === "retail" || p.channel === "both" || !p.channel;
      })
      .slice(0, 4);
  }, [allProducts, cartProductIds, activeCartMode]);

  const handleQuickAdd = (p: Product) => {
    const { items, effectivePrice } = addToCartByMode(p, activeCartMode, 1);
    setCart(items);
    setNotification(`Added ${p.name} to cart! (₹${effectivePrice})`);
    setTimeout(() => setNotification(null), 2500);
  };

  // Navigation helpers with fallback
  const navHome = () => {
    if (onNavigateHome) onNavigateHome();
    else router.push("/home");
  };

  const navShop = () => {
    if (onNavigateShop) onNavigateShop();
    else router.push("/shop");
  };

  const navAccount = () => {
    if (onNavigateAccount) onNavigateAccount();
    else router.push("/account");
  };

  const navCategories = () => {
    if (onNavigateCategories) onNavigateCategories();
    else router.push("/categories");
  };

  // Store Settings (Dynamic B2B & B2C rules)
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    ...defaultSettings,
    ...(propSettings || {}),
  });

  useEffect(() => {
    if (propSettings) {
      setStoreSettings((prev) => ({ ...prev, ...propSettings }));
    }
  }, [propSettings]);

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setStoreSettings((prev) => ({ ...prev, ...data.settings }));
        }
      })
      .catch(() => {});
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const retailCount = getCartCount("retail");
  const wholesaleCount = getCartCount("wholesale");

  const b2bMinCart = Number(storeSettings.wholesaleMinCartValue ?? 3000);
  const b2bMinQty = Number(storeSettings.wholesaleMinQuantity ?? 1);
  const b2bDeliveryCharge = Number(storeSettings.wholesaleDeliveryCharge ?? 125);

  const b2cMinCart = Number(storeSettings.retailMinCartValue ?? 0);
  const b2cFreeShipThreshold = Number(storeSettings.retailFreeShippingThreshold ?? 999);
  const b2cDeliveryCharge = Number(storeSettings.retailDeliveryCharge ?? 125);

  // Subtotal and Total item pieces
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalPieces = cart.reduce((sum, item) => sum + item.quantity, 0);
  const gst = Number((subtotal * 0.03).toFixed(1));

  // Dynamic Shipping logic
  let shipping = 0;
  if (cart.length > 0) {
    if (activeCartMode === "wholesale") {
      shipping = b2bDeliveryCharge;
    } else {
      // Retail B2C free shipping logic: Free above threshold, else delivery charge
      if (subtotal >= b2cFreeShipThreshold) {
        shipping = 0;
      } else {
        shipping = b2cDeliveryCharge;
      }
    }
  }

  const total = Number((subtotal + gst + shipping).toFixed(1));

  // B2B Thresholds
  const b2bRemainingCart = Math.max(0, b2bMinCart - subtotal);
  const b2bProgressPercent = b2bMinCart > 0 ? Math.min(100, Math.max(3, (subtotal / b2bMinCart) * 100)) : 100;
  const b2bRemainingPieces = Math.max(0, b2bMinQty - totalPieces);

  // Check individual product wholesale MOQs
  const itemsFailingMOQ = activeCartMode === "wholesale"
    ? cart.filter((item) => (item.wholesaleMinQty ?? 1) > 1 && item.quantity < (item.wholesaleMinQty ?? 1))
    : [];
  const isEveryItemMOQMet = itemsFailingMOQ.length === 0;

  const isWholesaleMinMet = subtotal >= b2bMinCart && (b2bMinQty <= 1 || totalPieces >= b2bMinQty) && isEveryItemMOQMet;

  // B2C Thresholds
  const b2cRemainingCart = Math.max(0, b2cMinCart - subtotal);
  const b2cProgressPercent = b2cMinCart > 0 ? Math.min(100, Math.max(3, (subtotal / b2cMinCart) * 100)) : 100;
  const isRetailMinMet = b2cMinCart <= 0 || subtotal >= b2cMinCart;
  const b2cFreeShipRemaining = Math.max(0, b2cFreeShipThreshold - subtotal);
  const b2cFreeShipPercent = b2cFreeShipThreshold > 0 ? Math.min(100, Math.max(3, (subtotal / b2cFreeShipThreshold) * 100)) : 100;

  const toggleSelectItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleUpdateQty = (id: string, qty: number) => {
    const updated = updateCartQtyByMode(activeCartMode, id, qty);
    setCart(updated);
    onUpdateQuantity?.(id, qty);
  };

  const handleRemove = (id: string) => {
    const updated = removeFromCartByMode(activeCartMode, id);
    setCart(updated);
    onRemoveItem?.(id);
  };

  const handleClearActiveCart = () => {
    clearCartByMode(activeCartMode);
    setCart([]);
    onClearCart?.();
  };

  // Load Razorpay script on-demand if not already loaded
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") return resolve(false);
      if ((window as any).Razorpay) return resolve(true);

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async (overrideIdentifier?: string) => {
    // 1. Validate Checkout Form Details (Name, Phone, Email, Delivery Address, City, State, Pincode) FIRST
    if (!validateAddressFields(true)) {
      return;
    }

    saveCurrentAddress();

    // 2. Retail Login Check & Minimum Cart Value Check
    if (activeCartMode === "retail") {
      if (b2cMinCart > 0 && subtotal < b2cMinCart) {
        setNotification(`Minimum retail order subtotal is ₹${b2cMinCart.toLocaleString("en-IN")}. Please add ₹${b2cRemainingCart.toFixed(0)} more.`);
        setTimeout(() => setNotification(null), 3500);
        return;
      }

      const isRetailAuth =
        isRetailLoggedIn ||
        isUserLoggedIn("retail");
      if (!isRetailAuth && !overrideIdentifier) {
        setIsRetailLoginOpen(true);
        return;
      }
    }

    // 3. Wholesale Login Check: Must be logged in and meet B2B minimums
    if (activeCartMode === "wholesale") {
      const isWholesaleAuth =
        isWholesaleLoggedIn ||
        isUserLoggedIn("wholesale");
      if (!isWholesaleAuth) {
        if (onOpenWholesaleLogin) onOpenWholesaleLogin();
        return;
      }
      if (b2bMinCart > 0 && subtotal < b2bMinCart) {
        setNotification(`Minimum B2B wholesale order is ₹${b2bMinCart.toLocaleString("en-IN")}. Please add ₹${b2bRemainingCart.toFixed(0)} more.`);
        setTimeout(() => setNotification(null), 3500);
        return;
      }
      if (b2bMinQty > 1 && totalPieces < b2bMinQty) {
        setNotification(`Minimum B2B wholesale quantity is ${b2bMinQty} pieces across cart. Please add ${b2bRemainingPieces} more items.`);
        setTimeout(() => setNotification(null), 3500);
        return;
      }
      if (itemsFailingMOQ.length > 0) {
        const first = itemsFailingMOQ[0];
        setNotification(`"${first.name}" requires a minimum wholesale quantity of ${first.wholesaleMinQty} pieces (current: ${first.quantity}).`);
        setTimeout(() => setNotification(null), 3500);
        return;
      }
    }

    const storedEmail =
      typeof window !== "undefined"
        ? localStorage.getItem("fc_retail_email") ||
          localStorage.getItem("fc_user_email") ||
          localStorage.getItem("fc_wholesale_email")
        : null;

    const storedName =
      typeof window !== "undefined"
        ? localStorage.getItem("fc_user_name") ||
          localStorage.getItem("fc_wholesale_owner") ||
          localStorage.getItem("fc_wholesale_business")
        : null;

    const activeIdentifier =
      overrideIdentifier ||
      (activeCartMode === "wholesale"
        ? (typeof window !== "undefined"
            ? localStorage.getItem("fc_wholesale_mobile") ||
              localStorage.getItem("fc_wholesale_email") ||
              localStorage.getItem("fc_user_mobile")
            : null) ||
          (userMobile && userMobile !== "8726275466" ? userMobile : "") ||
          shippingDetails.email.trim() ||
          shippingDetails.phone.replace(/\D/g, "")
        : storedEmail ||
          (typeof window !== "undefined"
            ? localStorage.getItem("fc_retail_mobile") || localStorage.getItem("fc_user_mobile")
            : null) ||
          (userMobile && userMobile !== "8726275466" ? userMobile : "") ||
          shippingDetails.email.trim() ||
          shippingDetails.phone.replace(/\D/g, ""));

    if (!activeIdentifier) {
      if (activeCartMode === "wholesale") {
        onOpenWholesaleLogin?.();
      } else {
        setIsRetailLoginOpen(true);
      }
      return;
    }

    const customerEmail =
      overrideIdentifier && overrideIdentifier.includes("@")
        ? overrideIdentifier
        : (shippingDetails.email.trim() || storedEmail || (activeIdentifier.includes("@") ? activeIdentifier : undefined));

    const customerMobile =
      shippingDetails.phone.replace(/\D/g, "") ||
      (activeIdentifier.includes("@") ? "" : activeIdentifier.replace(/\D/g, ""));

    const customerName =
      shippingDetails.name.trim() || storedName || "Customer";

    const trimmedQuickNote = shippingDetails.quickNote.trim();

    const finalShippingAddress = {
      contactName: customerName,
      phone: customerMobile,
      addressLine: shippingDetails.addressLine.trim(),
      city: shippingDetails.city.trim(),
      state: shippingDetails.state.trim(),
      pincode: shippingDetails.pincode.trim(),
      businessName: shippingDetails.businessName.trim() || undefined,
      gstin: shippingDetails.gstin.trim() || undefined,
    };

    setIsCheckingOut(true);
    setNotification("Initializing Razorpay checkout...");

    try {
      // 1. Create Razorpay order on backend
      const createOrderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          orderType: activeCartMode,
          storeMode: activeCartMode,
          customerMobile,
          customerEmail,
          customerName,
          shippingAddress: finalShippingAddress,
          quickNote: trimmedQuickNote || undefined,
          notes: {
            customerName,
            customerMobile,
            customerEmail: customerEmail || "",
            deliveryAddress: `${finalShippingAddress.addressLine}, ${finalShippingAddress.city}, ${finalShippingAddress.state} - ${finalShippingAddress.pincode}`,
            ...(trimmedQuickNote ? { quickNote: trimmedQuickNote.slice(0, 250) } : {}),
          },
        }),
      });

      const orderData = await createOrderRes.json();
      if (!createOrderRes.ok || !orderData.success || !orderData.order_id) {
        setNotification(orderData.message || orderData.error || "Failed to initialize payment gateway.");
        setIsCheckingOut(false);
        return;
      }

      // 2. Load Razorpay Checkout SDK
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !(window as any).Razorpay) {
        setNotification("Razorpay payment gateway failed to load. Please check your connection.");
        setIsCheckingOut(false);
        return;
      }

      // 3. Open Razorpay Checkout Modal
      const razorpayKey =
        orderData.key_id ||
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
        "rzp_test_U2vM87ObwlA5Xi";

      const rzpOptions = {
        key: razorpayKey,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Fab Creations",
        description:
          activeCartMode === "wholesale"
            ? "B2B Wholesale Order Checkout"
            : "Luxury Jewellery Order Checkout",
        image: "https://pub-ce8688bc6c654bcfb99716f7c9373bcd.r2.dev/fab-creations/brand-logo.png",
        order_id: orderData.order_id,
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          try {
            setNotification("Payment received! Verifying cryptographic signature...");
            setIsCheckingOut(true);

            // 4. Verify payment signature on backend & create database order
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderType: activeCartMode,
                storeMode: activeCartMode,
                customerMobile,
                customerEmail,
                customerName,
                shippingAddress: finalShippingAddress,
                quickNote: trimmedQuickNote || undefined,
                items: cart,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success && verifyData.order) {
              clearCartByMode(activeCartMode);
              setCart([]);
              onClearCart?.();
              setOrderSuccess(verifyData.order.orderNumber);
              setNotification(
                `Payment verified! Order #${verifyData.order.orderNumber} placed successfully. Confirmation email sent.`
              );
              setTimeout(() => {
                navAccount();
              }, 2500);
            } else {
              setNotification(
                verifyData.message ||
                  verifyData.error ||
                  "Payment signature verification failed. Please contact support."
              );
              setIsCheckingOut(false);
            }
          } catch (vErr) {
            console.error("[Razorpay Verification Request Error]:", vErr);
            setNotification("Network error verifying payment. Please contact support.");
            setIsCheckingOut(false);
          }
        },
        prefill: {
          name: customerName,
          email: customerEmail || "",
          contact: customerMobile,
        },
        notes: {
          orderType: activeCartMode,
          storeMode: activeCartMode,
        },
        theme: {
          color: "#e5a93c",
        },
        modal: {
          ondismiss: function () {
            setIsCheckingOut(false);
            setNotification("Payment cancelled. Cart preserved.");
            setTimeout(() => setNotification(null), 3000);
          },
        },
      };

      const rzpInstance = new (window as any).Razorpay(rzpOptions);

      rzpInstance.on("payment.failed", function (failResp: any) {
        console.error("Razorpay payment failed:", failResp?.error);
        setIsCheckingOut(false);
        setNotification(
          `Payment failed: ${failResp?.error?.description || "Transaction declined"}`
        );
      });

      rzpInstance.open();
    } catch (err) {
      console.error("Razorpay checkout request failed:", err);
      setNotification("Checkout request failed. Please check connection and try again.");
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#050505] text-white flex flex-col items-center justify-start pb-28 select-none">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-3 z-50 px-4 py-2 bg-[#1c160c] border border-[#e5a93c] text-[#f5c767] text-xs rounded-full shadow-2xl animate-fade-in">
          {notification}
        </div>
      )}

      {/* Responsive Container */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Announcement Bar */}
        <div className="w-full py-2 bg-[#000000] border-b border-[#141414] text-center mb-4 rounded-xl">
          <p className="text-[#e5a93c] text-[12.5px] sm:text-[13.5px] font-medium tracking-wide">
            {activeCartMode === "wholesale"
              ? `B2B Wholesale • Minimum Order: ₹${b2bMinCart.toLocaleString("en-IN")}${b2bMinQty > 1 ? ` (${b2bMinQty} pieces)` : ""} • Delivery: ₹${b2bDeliveryCharge}`
              : `Retail Store • Free Delivery Above ₹${b2cFreeShipThreshold.toLocaleString("en-IN")}${b2cMinCart > 0 ? ` • Min Order: ₹${b2cMinCart.toLocaleString("en-IN")}` : " • No Minimum Order"}`}
          </p>
        </div>

        {/* Top Header Bar */}
        <div className="flex items-center justify-between py-2 mb-4">
          <button
            type="button"
            onClick={navShop}
            className="h-10 px-3.5 rounded-full bg-[#141414] border border-[#262626] flex items-center justify-center gap-2 text-white hover:text-[#e5a93c] hover:border-[#e5a93c]/50 transition-colors cursor-pointer text-xs font-medium"
            title="Continue Shopping"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Continue Shopping</span>
          </button>
          <div className="text-center">
            <h1 className="text-lg sm:text-2xl font-serif font-medium text-white">
              {activeCartMode === "wholesale" ? "Wholesale B2B Cart" : "Your Shopping Cart"}
            </h1>
            <p className="text-[11px] sm:text-xs text-[#e5a93c] uppercase tracking-wider font-medium">
              {activeCartMode === "wholesale"
                ? `B2B Wholesale Portal (Min. ₹${b2bMinCart.toLocaleString("en-IN")})`
                : b2cMinCart > 0
                ? `Retail Store (Min. ₹${b2cMinCart.toLocaleString("en-IN")})`
                : "Retail Store Channel"}
            </p>
          </div>
          <button
            onClick={handleClearActiveCart}
            disabled={cart.length === 0}
            className="text-xs sm:text-sm text-[#8e8e93] hover:text-rose-400 transition-colors disabled:opacity-0 cursor-pointer px-2 py-1 rounded-lg hover:bg-white/5"
          >
            Clear Cart
          </button>
        </div>

        {/* Order Success Banner */}
        {orderSuccess && (
          <div className="max-w-2xl mx-auto mb-6 p-5 rounded-[20px] bg-emerald-950/60 border border-emerald-500/40 text-center animate-fade-in shadow-xl">
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <h4 className="text-white text-lg font-serif font-medium">Order Placed Successfully!</h4>
            <p className="text-emerald-300 text-sm mt-1">
              Order #{orderSuccess} has been confirmed. Redirecting to your account & orders...
            </p>
          </div>
        )}

        {/* Cart Content: Empty State vs 2-Column Responsive Layout */}
        {cart.length === 0 ? (
          <div className="w-full max-w-lg mx-auto bg-[#0d0d0d] border border-[#222222] rounded-[24px] p-8 sm:p-12 flex flex-col items-center text-center shadow-2xl relative overflow-hidden my-8">
            <div className="w-20 h-20 rounded-full bg-[#171207] border border-[#e5a93c]/50 flex items-center justify-center text-[#e5a93c] mb-5 shadow-[0_0_25px_rgba(229,169,60,0.25)]">
              <ShoppingBag className="w-9 h-9 stroke-[1.8]" />
            </div>
            <h3 className="text-white text-xl sm:text-2xl font-serif font-medium mb-2">
              Your {activeCartMode === "wholesale" ? "Wholesale" : "Retail"} Cart is Empty
            </h3>
            <p className="text-[#8e8e93] text-sm max-w-sm mb-6 leading-relaxed">
              {activeCartMode === "wholesale"
                ? "Add wholesale jewellery items to your cart to meet the ₹3,000 B2B minimum threshold."
                : "Explore our stunning retail anti-tarnish collection and add items to your cart with no minimum order."}
            </p>
            <button
              type="button"
              onClick={navShop}
              className="h-[48px] px-8 rounded-full bg-gradient-to-r from-[#e5a93c] to-[#f5c767] text-black font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all cursor-pointer shadow-lg active:scale-95"
            >
              <span>Explore Products</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
            {/* Left Column: Cart Items List (lg:col-span-7 xl:col-span-8) */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#1f1f1f]">
                <span className="text-sm text-[#8e8e93] font-medium">
                  {cart.length} Item{cart.length > 1 ? "s" : ""} in Cart
                </span>
                <span className="text-xs text-[#e5a93c]">
                  {activeCartMode === "wholesale" ? "Wholesale Pricing Applied" : "Retail Prices"}
                </span>
              </div>

              {cart.map((item) => (
                <div
                  key={item.id}
                  className="w-full bg-[#0d0d0d] border border-[#222222] hover:border-[#333] transition-colors rounded-[18px] p-3.5 sm:p-4 shadow-md flex items-center gap-3.5 sm:gap-5"
                >
                  {/* Thumbnail */}
                  <div className="relative w-[78px] h-[78px] sm:w-[92px] sm:h-[92px] rounded-xl overflow-hidden bg-[#141414] shrink-0 border border-[#1f1f1f]">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      unoptimized
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/products/moon-necklace.jpg";
                      }}
                      className="object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between min-h-[78px] sm:min-h-[92px]">
                    {/* Title + Trash */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => toggleSelectItem(item.id)}
                          className={`w-[18px] h-[18px] rounded-[5px] flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                            selectedItems.includes(item.id)
                              ? "bg-[#e5a93c] text-black"
                              : "border border-[#444444] bg-[#111111]"
                          }`}
                        >
                          {selectedItems.includes(item.id) && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>
                        <div>
                          <h3 className="text-white text-sm sm:text-base font-medium leading-tight">
                            {item.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            <span className="text-[11px] text-[#8e8e93]">
                              Qty: {item.quantity} × ₹{item.price}
                            </span>
                            {activeCartMode === "wholesale" && (item.wholesaleMinQty ?? 1) > 1 && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-950/60 border border-amber-800/50 text-[#f5c767] text-[10px] font-semibold">
                                MOQ: {item.wholesaleMinQty} pcs
                              </span>
                            )}
                          </div>
                          {activeCartMode === "wholesale" && (item.wholesaleMinQty ?? 1) > 1 && item.quantity < (item.wholesaleMinQty ?? 1) && (
                            <p className="text-rose-400 text-[10.5px] font-medium pt-0.5">
                              ⚠️ Needs min. {item.wholesaleMinQty} pcs for wholesale
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        className="text-[#8e8e93] hover:text-rose-400 p-1.5 transition-colors cursor-pointer rounded-lg hover:bg-rose-500/10"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Price + Stepper */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[#e5a93c] text-base sm:text-lg font-semibold">
                          ₹{(item.price * item.quantity).toFixed(1)}
                        </span>
                        {item.quantity > 1 && (
                          <span className="text-xs text-[#8e8e93]">
                            (₹{item.price} each)
                          </span>
                        )}
                      </div>

                      {/* Stepper */}
                      <div className="flex items-center h-[34px] rounded-[10px] bg-[#141414] border border-[#2a2a2a] px-2 gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            const minAllowed = activeCartMode === "wholesale" ? Math.max(1, item.wholesaleMinQty || 1) : 1;
                            handleUpdateQty(item.id, Math.max(minAllowed, item.quantity - 1));
                          }}
                          disabled={activeCartMode === "wholesale" && item.quantity <= (item.wholesaleMinQty || 1)}
                          className="text-[#8e8e93] hover:text-white text-sm font-bold px-1.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          title={activeCartMode === "wholesale" && item.quantity <= (item.wholesaleMinQty || 1) ? `Minimum wholesale quantity is ${item.wholesaleMinQty || 1}` : "Decrease"}
                        >
                          -
                        </button>
                        <span className="text-white text-xs sm:text-sm font-semibold min-w-[16px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                          className="text-[#8e8e93] hover:text-white text-sm font-bold px-1.5 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column: Sticky Summary & Checkout CTA (lg:col-span-5 xl:col-span-4) */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-4 lg:sticky lg:top-6">
              {/* Order Summary Card */}
              <div className="w-full bg-[#0d0d0d] border border-[#222222] rounded-[22px] p-5 shadow-lg space-y-3.5">
                <h4 className="text-white text-base sm:text-lg font-serif font-medium pb-2 border-b border-[#1c1c1c]">
                  Order Summary ({activeCartMode === "wholesale" ? "Wholesale" : "Retail"})
                </h4>

                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between text-[#8e8e93]">
                    <span>Items Subtotal</span>
                    <span className="text-white font-medium">₹{subtotal.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#8e8e93]">
                    <span>GST (3%)</span>
                    <span className="text-white font-medium">₹{gst.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#8e8e93]">
                    <span>Shipping</span>
                    {shipping === 0 ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> FREE
                      </span>
                    ) : (
                      <span className="text-white font-medium">₹{shipping.toFixed(1)}</span>
                    )}
                  </div>
                  <div className="pt-3 border-t border-[#1c1c1c] flex items-center justify-between text-base sm:text-lg">
                    <span className="text-white font-semibold">Total Payable</span>
                    <span className="text-[#e5a93c] text-xl font-bold">₹{total.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Information Box */}
              <div className="w-full rounded-[20px] border border-[#4a3816] bg-[#140f07] p-4 flex items-start gap-3.5 shadow-sm">
                <div className="w-9 h-9 rounded-full bg-[#1e170a] border border-[#e5a93c]/40 flex items-center justify-center text-[#e5a93c] shrink-0 mt-0.5">
                  <Truck className="w-4 h-4 text-[#e5a93c]" />
                </div>
                <div className="flex-1">
                  <h5 className="text-[#e5a93c] text-sm font-semibold mb-0.5">
                    {activeCartMode === "wholesale" ? "B2B Wholesale Shipping" : "Retail Fast Shipping"}
                  </h5>
                  <p className="text-[#a8a8a8] text-xs leading-relaxed">
                    {activeCartMode === "wholesale"
                      ? b2bDeliveryCharge === 0
                        ? "100% Free B2B delivery for all wholesale partner orders. Dispatched within 24-48 business hours with GST invoice."
                        : `Standard B2B delivery is ₹${b2bDeliveryCharge}. Orders are dispatched within 24-48 business hours with official GST invoice.`
                      : subtotal >= b2cFreeShipThreshold
                      ? `🎉 Free Delivery qualified! Orders over ₹${b2cFreeShipThreshold.toLocaleString("en-IN")} enjoy complimentary insured shipping across India.`
                      : `Standard retail delivery is ₹${b2cDeliveryCharge}. Add ₹${b2cFreeShipRemaining.toFixed(0)} more to get 100% FREE Delivery!`}
                  </p>
                </div>
              </div>

              {/* Checkout Details & Quick Note Form */}
              <form
                id="checkout-form"
                aria-labelledby="checkout-details-heading"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCheckout();
                }}
                noValidate
                className="space-y-4"
              >
                {/* Delivery Address & Contact Details Card */}
                <div className="w-full bg-[#0d0d0d] border border-[#222222] rounded-[22px] p-5 shadow-lg space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-[#1c1c1c]">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#1c160c] border border-[#e5a93c]/40 flex items-center justify-center text-[#e5a93c]">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <h4
                          id="checkout-details-heading"
                          className="text-white text-sm sm:text-base font-semibold leading-tight"
                        >
                          Checkout Form
                        </h4>
                        <p className="text-[11px] text-[#8e8e93]">
                          Please fill in all details before proceeding to checkout
                        </p>
                      </div>
                    </div>
                  </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label htmlFor="checkout-name" className="text-[11px] text-[#a0a0a0] font-medium block">
                            Full Name <span className="text-[#e5a93c]" aria-hidden="true">*</span>
                          </label>
                          <input
                            ref={(el) => {
                              fieldRefs.current.name = el;
                            }}
                            id="checkout-name"
                            name="name"
                            type="text"
                            autoComplete="name"
                            enterKeyHint="next"
                            required
                            aria-required="true"
                            aria-invalid={Boolean(fieldErrors.name)}
                            aria-describedby={fieldErrors.name ? "checkout-name-error" : undefined}
                            placeholder="Your Full Name"
                            value={shippingDetails.name}
                            onChange={(e) => updateShippingField("name", e.target.value)}
                            onBlur={() => handleFieldBlur("name")}
                            className={`w-full min-h-[44px] rounded-xl bg-[#141414] border px-3 text-base sm:text-xs text-white placeholder-[#666] focus:border-[#e5a93c] outline-none ${
                              fieldErrors.name ? "border-rose-500" : "border-[#2a2a2a]"
                            }`}
                          />
                          {fieldErrors.name && (
                            <p id="checkout-name-error" role="alert" className="text-rose-400 text-[11px]">
                              {fieldErrors.name}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <label htmlFor="checkout-phone" className="text-[11px] text-[#a0a0a0] font-medium block">
                            Phone Number <span className="text-[#e5a93c]" aria-hidden="true">*</span>
                          </label>
                          <input
                            ref={(el) => {
                              fieldRefs.current.phone = el;
                            }}
                            id="checkout-phone"
                            name="tel"
                            type="tel"
                            inputMode="numeric"
                            autoComplete="tel"
                            enterKeyHint="next"
                            required
                            aria-required="true"
                            aria-invalid={Boolean(fieldErrors.phone)}
                            aria-describedby={fieldErrors.phone ? "checkout-phone-error" : undefined}
                            maxLength={10}
                            placeholder="10-digit Mobile"
                            value={shippingDetails.phone}
                            onChange={(e) => updateShippingField("phone", e.target.value.replace(/\D/g, ""))}
                            onBlur={() => handleFieldBlur("phone")}
                            className={`w-full min-h-[44px] rounded-xl bg-[#141414] border px-3 text-base sm:text-xs text-white placeholder-[#666] focus:border-[#e5a93c] outline-none ${
                              fieldErrors.phone ? "border-rose-500" : "border-[#2a2a2a]"
                            }`}
                          />
                          {fieldErrors.phone && (
                            <p id="checkout-phone-error" role="alert" className="text-rose-400 text-[11px]">
                              {fieldErrors.phone}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="checkout-email" className="text-[11px] text-[#a0a0a0] font-medium block">
                          Email Address <span className="text-[#e5a93c]" aria-hidden="true">*</span>
                          <span className="text-[#666] font-normal ml-1">(for confirmation &amp; bill)</span>
                        </label>
                        <input
                          ref={(el) => {
                            fieldRefs.current.email = el;
                          }}
                          id="checkout-email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          autoCorrect="off"
                          autoCapitalize="none"
                          spellCheck={false}
                          enterKeyHint="next"
                          required
                          aria-required="true"
                          aria-invalid={Boolean(fieldErrors.email)}
                          aria-describedby={fieldErrors.email ? "checkout-email-error" : undefined}
                          placeholder="name@example.com"
                          value={shippingDetails.email}
                          onChange={(e) => updateShippingField("email", e.target.value)}
                          onBlur={() => handleFieldBlur("email")}
                          className={`w-full min-h-[44px] rounded-xl bg-[#141414] border px-3 text-base sm:text-xs text-white placeholder-[#666] focus:border-[#e5a93c] outline-none ${
                            fieldErrors.email ? "border-rose-500" : "border-[#2a2a2a]"
                          }`}
                        />
                        {fieldErrors.email && (
                          <p id="checkout-email-error" role="alert" className="text-rose-400 text-[11px]">
                            {fieldErrors.email}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="checkout-address" className="text-[11px] text-[#a0a0a0] font-medium block">
                          Delivery Address (House / Flat No., Street, Landmark) <span className="text-[#e5a93c]" aria-hidden="true">*</span>
                        </label>
                        <textarea
                          ref={(el) => {
                            fieldRefs.current.addressLine = el;
                          }}
                          id="checkout-address"
                          name="street-address"
                          rows={2}
                          autoComplete="street-address"
                          enterKeyHint="next"
                          required
                          aria-required="true"
                          aria-invalid={Boolean(fieldErrors.addressLine)}
                          aria-describedby={fieldErrors.addressLine ? "checkout-address-error" : undefined}
                          placeholder="e.g. Flat 402, Royal Palms, Link Road"
                          value={shippingDetails.addressLine}
                          onChange={(e) => updateShippingField("addressLine", e.target.value)}
                          onBlur={() => handleFieldBlur("addressLine")}
                          className={`w-full rounded-xl bg-[#141414] border px-3 py-2.5 text-base sm:text-xs text-white placeholder-[#666] focus:border-[#e5a93c] outline-none resize-y ${
                            fieldErrors.addressLine ? "border-rose-500" : "border-[#2a2a2a]"
                          }`}
                        />
                        {fieldErrors.addressLine && (
                          <p id="checkout-address-error" role="alert" className="text-rose-400 text-[11px]">
                            {fieldErrors.addressLine}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label htmlFor="checkout-city" className="text-[11px] text-[#a0a0a0] font-medium block">
                            City <span className="text-[#e5a93c]" aria-hidden="true">*</span>
                          </label>
                          <input
                            ref={(el) => {
                              fieldRefs.current.city = el;
                            }}
                            id="checkout-city"
                            name="city"
                            type="text"
                            autoComplete="address-level2"
                            enterKeyHint="next"
                            required
                            aria-required="true"
                            aria-invalid={Boolean(fieldErrors.city)}
                            aria-describedby={fieldErrors.city ? "checkout-city-error" : undefined}
                            placeholder="City"
                            value={shippingDetails.city}
                            onChange={(e) => updateShippingField("city", e.target.value)}
                            onBlur={() => handleFieldBlur("city")}
                            className={`w-full min-h-[44px] rounded-xl bg-[#141414] border px-3 text-base sm:text-xs text-white placeholder-[#666] focus:border-[#e5a93c] outline-none ${
                              fieldErrors.city ? "border-rose-500" : "border-[#2a2a2a]"
                            }`}
                          />
                          {fieldErrors.city && (
                            <p id="checkout-city-error" role="alert" className="text-rose-400 text-[11px]">
                              {fieldErrors.city}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <label htmlFor="checkout-state" className="text-[11px] text-[#a0a0a0] font-medium block">
                            State <span className="text-[#e5a93c]" aria-hidden="true">*</span>
                          </label>
                          <input
                            ref={(el) => {
                              fieldRefs.current.state = el;
                            }}
                            id="checkout-state"
                            name="state"
                            type="text"
                            autoComplete="address-level1"
                            enterKeyHint="next"
                            required
                            aria-required="true"
                            aria-invalid={Boolean(fieldErrors.state)}
                            aria-describedby={fieldErrors.state ? "checkout-state-error" : undefined}
                            placeholder="State"
                            value={shippingDetails.state}
                            onChange={(e) => updateShippingField("state", e.target.value)}
                            onBlur={() => handleFieldBlur("state")}
                            className={`w-full min-h-[44px] rounded-xl bg-[#141414] border px-3 text-base sm:text-xs text-white placeholder-[#666] focus:border-[#e5a93c] outline-none ${
                              fieldErrors.state ? "border-rose-500" : "border-[#2a2a2a]"
                            }`}
                          />
                          {fieldErrors.state && (
                            <p id="checkout-state-error" role="alert" className="text-rose-400 text-[11px]">
                              {fieldErrors.state}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label htmlFor="checkout-pincode" className="text-[11px] text-[#a0a0a0] font-medium block">
                            Pincode <span className="text-[#e5a93c]" aria-hidden="true">*</span>
                          </label>
                          <input
                            ref={(el) => {
                              fieldRefs.current.pincode = el;
                            }}
                            id="checkout-pincode"
                            name="postal-code"
                            type="text"
                            inputMode="numeric"
                            autoComplete="postal-code"
                            pattern="\d{6}"
                            enterKeyHint="next"
                            required
                            aria-required="true"
                            aria-invalid={Boolean(fieldErrors.pincode)}
                            aria-describedby={fieldErrors.pincode ? "checkout-pincode-error" : undefined}
                            maxLength={6}
                            placeholder="6-digit Pincode"
                            value={shippingDetails.pincode}
                            onChange={(e) => updateShippingField("pincode", e.target.value.replace(/\D/g, ""))}
                            onBlur={() => handleFieldBlur("pincode")}
                            className={`w-full min-h-[44px] rounded-xl bg-[#141414] border px-3 text-base sm:text-xs text-white placeholder-[#666] focus:border-[#e5a93c] outline-none ${
                              fieldErrors.pincode ? "border-rose-500" : "border-[#2a2a2a]"
                            }`}
                          />
                          {fieldErrors.pincode && (
                            <p id="checkout-pincode-error" role="alert" className="text-rose-400 text-[11px]">
                              {fieldErrors.pincode}
                            </p>
                          )}
                        </div>
                        {activeCartMode === "wholesale" ? (
                          <div className="space-y-1">
                            <label htmlFor="checkout-gstin" className="text-[11px] text-[#a0a0a0] font-medium block">
                              GSTIN (Optional)
                            </label>
                            <input
                              id="checkout-gstin"
                              name="gstin"
                              type="text"
                              placeholder="GSTIN"
                              value={shippingDetails.gstin || ""}
                              onChange={(e) => updateShippingField("gstin", e.target.value.toUpperCase())}
                              className="w-full min-h-[44px] rounded-xl bg-[#141414] border border-[#2a2a2a] px-3 text-base sm:text-xs text-white placeholder-[#666] focus:border-[#e5a93c] outline-none"
                            />
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="text-[11px] text-[#a0a0a0] font-medium block">
                              Country
                            </span>
                            <div className="w-full min-h-[44px] rounded-xl bg-[#141414] border border-[#2a2a2a] px-3 text-xs text-[#888] flex items-center">
                              India (Domestic)
                            </div>
                          </div>
                        )}
                      </div>

                    </div>

                  {/* Quick Note Section (Always visible before checkout) */}
                  <div className="pt-2 border-t border-[#1c1c1c] space-y-1.5">
                    <label
                      htmlFor="checkout-quick-note"
                      className="text-[11px] text-[#e5a93c] font-semibold flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Quick Note (Optional)</span>
                    </label>
                    <textarea
                      id="checkout-quick-note"
                      name="quickNote"
                      rows={2}
                      maxLength={500}
                      enterKeyHint="done"
                      placeholder="Add delivery instructions, gift message, ring/chain size preference, or landmark..."
                      value={shippingDetails.quickNote}
                      onChange={(e) => updateShippingField("quickNote", e.target.value)}
                      className="w-full rounded-xl bg-[#141414] border border-[#2a2a2a] px-3 py-2.5 text-base sm:text-xs text-white placeholder-[#666] focus:border-[#e5a93c] outline-none resize-y"
                    />
                  </div>
                </div>

                {/* Minimum Order / Progress & Checkout Action */}
                <div className="w-full bg-[#0d0d0d] border border-[#222222] rounded-[22px] p-5 shadow-lg space-y-4">
                  {activeCartMode === "wholesale" ? (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#8e8e93]">B2B Order Minimum Progress</span>
                          <span className="text-[#e5a93c] font-semibold">₹{subtotal.toFixed(0)} / ₹{b2bMinCart.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#1c1c1c] overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#d99726] to-[#f5c767] rounded-full transition-all duration-300"
                            style={{ width: `${b2bProgressPercent}%` }}
                          />
                        </div>
                        {subtotal < b2bMinCart ? (
                          <p className="text-[#8e8e93] text-xs">
                            Add <span className="text-[#e5a93c] font-semibold">₹{b2bRemainingCart.toFixed(0)}</span> more to meet wholesale value minimum.
                          </p>
                        ) : (
                          <p className="text-emerald-400 text-xs font-medium flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>Wholesale value minimum met!</span>
                          </p>
                        )}
                      </div>

                      {b2bMinQty > 1 && (
                        <div className="pt-2 border-t border-[#1c1c1c] space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#8e8e93]">B2B Total Items Quantity</span>
                            <span className={`${totalPieces >= b2bMinQty ? "text-emerald-400" : "text-[#e5a93c]"} font-semibold`}>
                              {totalPieces} / {b2bMinQty} pieces
                            </span>
                          </div>
                          {totalPieces < b2bMinQty ? (
                            <p className="text-[#8e8e93] text-xs">
                              Add <span className="text-[#e5a93c] font-semibold">{b2bRemainingPieces}</span> more items to reach minimum wholesale batch size.
                            </p>
                          ) : (
                            <p className="text-emerald-400 text-xs font-medium flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>Wholesale batch quantity requirement met!</span>
                            </p>
                          )}
                        </div>
                      )}

                      {/* B2B Item MOQ Status */}
                      {itemsFailingMOQ.length > 0 ? (
                        <div className="pt-2 border-t border-[#1c1c1c] space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#8e8e93]">Item MOQ Requirements</span>
                            <span className="text-rose-400 font-semibold">{itemsFailingMOQ.length} below MOQ</span>
                          </div>
                          <p className="text-amber-400 text-xs">
                            {itemsFailingMOQ.map((i) => `"${i.name}" (needs ${i.wholesaleMinQty} pcs)`).join(", ")}
                          </p>
                        </div>
                      ) : cart.some((i) => (i.wholesaleMinQty ?? 1) > 1) ? (
                        <div className="pt-2 border-t border-[#1c1c1c]">
                          <p className="text-emerald-400 text-xs font-medium flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>All product minimum quantities met!</span>
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* B2C Minimum Cart Value Check (if configured) */}
                      {b2cMinCart > 0 && (
                        <div className="space-y-1.5 pb-2 border-b border-[#1c1c1c]">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#8e8e93]">Retail Order Minimum</span>
                            <span className="text-[#e5a93c] font-semibold">₹{subtotal.toFixed(0)} / ₹{b2cMinCart.toLocaleString("en-IN")}</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-[#1c1c1c] overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#d99726] to-[#f5c767] rounded-full transition-all duration-300"
                              style={{ width: `${b2cProgressPercent}%` }}
                            />
                          </div>
                          {subtotal < b2cMinCart ? (
                            <p className="text-[#8e8e93] text-xs">
                              Add <span className="text-[#e5a93c] font-semibold">₹{b2cRemainingCart.toFixed(0)}</span> more to reach minimum order value.
                            </p>
                          ) : (
                            <p className="text-emerald-400 text-xs font-medium flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>Retail minimum order met!</span>
                            </p>
                          )}
                        </div>
                      )}

                      {/* Free Shipping Progress for Retail */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#8e8e93]">Free Shipping Progress</span>
                          <span className="text-[#e5a93c] font-semibold">
                            ₹{subtotal.toFixed(0)} / ₹{b2cFreeShipThreshold.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#1c1c1c] overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full transition-all duration-300"
                            style={{ width: `${b2cFreeShipPercent}%` }}
                          />
                        </div>
                        {subtotal >= b2cFreeShipThreshold ? (
                          <p className="text-emerald-400 text-xs font-medium flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>Congratulations! Free Shipping Unlocked!</span>
                          </p>
                        ) : (
                          <p className="text-[#8e8e93] text-xs">
                            Add <span className="text-emerald-400 font-semibold">₹{b2cFreeShipRemaining.toFixed(0)}</span> more to get FREE Delivery!
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Proceed to Checkout Button */}
                  <button
                    type="submit"
                    disabled={isCheckingOut}
                    className={`w-full h-[52px] rounded-[16px] font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer ${
                      (activeCartMode === "wholesale" ? isWholesaleMinMet : isRetailMinMet)
                        ? "bg-gradient-to-r from-[#e5a93c] to-[#f5c767] hover:opacity-95 active:scale-[0.99] text-[#111111]"
                        : "bg-[#1c160c] border border-[#e5a93c]/50 text-[#e5a93c] hover:bg-[#e5a93c] hover:text-black"
                    }`}
                  >
                    {isCheckingOut ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        <span>Processing Payment...</span>
                      </div>
                    ) : (
                      <>
                        <span>PAY WITH RAZORPAY • ₹{total.toLocaleString("en-IN")}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {/* Continue Shopping Button */}
                  <button
                    type="button"
                    onClick={navShop}
                    className="w-full h-[48px] rounded-[16px] bg-[#141414] hover:bg-[#1c1c1c] border border-[#2a2a2a] hover:border-[#e5a93c]/60 text-[#c5c5c5] hover:text-white font-medium text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]"
                  >
                    <ArrowLeft className="w-4 h-4 text-[#e5a93c]" />
                    <span>Continue Shopping</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* YOU MAY ALSO LIKE SECTION                                */}
        {/* ======================================================== */}
        {recommendedProducts.length > 0 && (
          <section className="mt-10 pt-8 border-t border-[#1c1c1c] mb-12">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#1c160c] border border-[#e5a93c]/40 flex items-center justify-center text-[#e5a93c]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-white text-lg sm:text-xl font-serif font-medium">
                    You May Also Like
                  </h3>
                  <p className="text-[#8e8e93] text-xs">
                    Popular jewellery pieces that pair well with your cart
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={navShop}
                className="text-xs text-[#e5a93c] hover:text-[#f5c767] hover:underline flex items-center gap-1 font-medium cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {recommendedProducts.map((p) => {
                const effectivePrice =
                  activeCartMode === "wholesale"
                    ? p.wholesalePrice ?? p.price
                    : p.retailPrice ?? p.price;

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (onSelectProduct) {
                        onSelectProduct(p);
                      } else {
                        router.push(`/product?id=${p.id}`);
                      }
                    }}
                    className="group bg-[#0d0d0d] border border-[#222222] hover:border-[#e5a93c]/50 rounded-[18px] p-3 flex flex-col justify-between transition-all cursor-pointer shadow-md hover:shadow-[0_4px_20px_rgba(229,169,60,0.15)]"
                  >
                    <div>
                      <div className="relative w-full aspect-square rounded-[14px] overflow-hidden bg-[#141414] mb-2.5 border border-[#1f1f1f]">
                        <Image
                          src={p.image || "/images/products/moon-necklace.jpg"}
                          alt={p.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      <span className="text-[10px] text-[#e5a93c] uppercase tracking-wider font-semibold">
                        {p.category || "Jewellery"}
                      </span>
                      <h4 className="text-white text-xs sm:text-sm font-medium line-clamp-1 group-hover:text-[#f5c767] transition-colors mt-0.5">
                        {p.name}
                      </h4>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#1c1c1c] flex items-center justify-between">
                      <span className="text-white text-xs sm:text-sm font-bold">
                        ₹{Number(effectivePrice).toLocaleString("en-IN")}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickAdd(p);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#1c160c] hover:bg-[#e5a93c] border border-[#e5a93c]/50 hover:border-[#e5a93c] text-[#e5a93c] hover:text-black text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer active:scale-95 shadow-sm"
                        title="Add to Cart"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Categories Pop-Up Modal */}
      <CategoriesModal
        isOpen={isCategoriesOpen}
        onClose={() => setIsCategoriesOpen(false)}
        categories={categories}
        onSelectCategory={(catName) => {
          if (onSelectCategory) {
            onSelectCategory(catName);
          } else {
            navShop();
          }
        }}
      />

      {/* Retail Login Modal: Required before checkout for retail users */}
      <RetailLoginModal
        isOpen={isRetailLoginOpen}
        onClose={() => setIsRetailLoginOpen(false)}
        onSuccess={(verifiedMobile) => {
          handleCheckout(verifiedMobile);
        }}
      />

      {/* Fixed Bottom Navigation Bar (Mobile Only: hidden on md:) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080808]/95 backdrop-blur-md border-t border-[#181818] flex justify-center pb-safe">
        <div className="w-full max-w-[440px] h-[64px] px-3 flex items-center justify-between relative">
          {/* 1. Home */}
          <button
            type="button"
            onClick={navHome}
            className="flex flex-col items-center justify-center flex-1 text-[#8e8e93] hover:text-white transition-colors gap-1 cursor-pointer"
          >
            <Home className="w-5 h-5" />
            <span className="text-[11px] font-normal">Home</span>
          </button>

          {/* 2. Shop */}
          <button
            type="button"
            onClick={navShop}
            className="flex flex-col items-center justify-center flex-1 text-[#8e8e93] hover:text-white transition-colors gap-1 cursor-pointer"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[11px] font-normal">Shop</span>
          </button>

          {/* 3. Center Elevated Cart Button (ACTIVE) */}
          <div className="flex flex-col items-center justify-center flex-1 relative">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="w-[52px] h-[52px] rounded-full bg-[#f0a939] hover:bg-[#f5b842] text-[#111111] flex items-center justify-center shadow-[0_4px_20px_rgba(240,169,57,0.4)] -translate-y-5 transition-transform active:scale-95 cursor-pointer relative"
            >
              <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#e11d48] text-white text-[10px] font-bold flex items-center justify-center border-2 border-black">
                  {cartCount}
                </span>
              )}
            </button>
            <span className="text-[11px] text-[#e5a93c] font-medium -mt-4">Cart</span>
          </div>

          {/* 4. Categories */}
          <button
            type="button"
            onClick={navCategories}
            className="flex flex-col items-center justify-center flex-1 text-[#8e8e93] hover:text-[#e5a93c] transition-colors gap-1 cursor-pointer"
          >
            <Grid className="w-5 h-5" />
            <span className="text-[11px] font-normal">Categories</span>
          </button>

          {/* 5. Account */}
          <button
            type="button"
            onClick={navAccount}
            className="flex flex-col items-center justify-center flex-1 text-[#8e8e93] hover:text-white transition-colors gap-1 cursor-pointer"
          >
            <User className="w-5 h-5" />
            <span className="text-[11px] font-normal">Account</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
