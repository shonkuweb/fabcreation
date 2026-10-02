"use client";

import type { OrderItem, Product, UserAddress } from "@/lib/db";

export type StoreMode = "retail" | "wholesale";

// Helper to get active user mobile identifier
export function getActiveUserMobile(mode: StoreMode): string {
  if (typeof window === "undefined") return mode === "wholesale" ? "6289417338" : "guest_retail";
  try {
    if (mode === "wholesale") {
      return (
        localStorage.getItem("fc_wholesale_mobile") ||
        localStorage.getItem("fc_user_mobile") ||
        "6289417338"
      );
    } else {
      return (
        localStorage.getItem("fc_retail_email") ||
        localStorage.getItem("fc_user_email") ||
        localStorage.getItem("fc_retail_mobile") ||
        localStorage.getItem("fc_guest_id") ||
        "retail_customer"
      );
    }
  } catch {
    return mode === "wholesale" ? "6289417338" : "retail_customer";
  }
}

// ---------------- CART HELPERS (DATABASE SYNCHRONIZED) ----------------

export function getCartKey(mode: StoreMode): string {
  return mode === "wholesale" ? "fc_wholesale_cart" : "fc_retail_cart";
}

/**
 * Retrieve cart items for the specified mode from local cache.
 */
export function getCartItems(mode: StoreMode): OrderItem[] {
  if (typeof window === "undefined") return [];

  const key = getCartKey(mode);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }

    // Migrate from legacy fc_b2b_cart if wholesale
    if (mode === "wholesale") {
      const legacyRaw = localStorage.getItem("fc_b2b_cart");
      if (legacyRaw) {
        const legacyParsed = JSON.parse(legacyRaw);
        if (Array.isArray(legacyParsed) && legacyParsed.length > 0) {
          localStorage.setItem(key, JSON.stringify(legacyParsed));
          localStorage.removeItem("fc_b2b_cart");
          saveCartItems(mode, legacyParsed);
          return legacyParsed;
        }
      }
    }
  } catch (err) {
    console.error(`Error reading ${key}:`, err);
  }
  return [];
}

/**
 * Fetch cart from the server database and sync locally.
 */
export async function fetchCartFromServer(mode: StoreMode): Promise<OrderItem[]> {
  const user = getActiveUserMobile(mode);
  try {
    const res = await fetch(`/api/cart?type=${mode}&user=${encodeURIComponent(user)}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.items)) {
      if (typeof window !== "undefined") {
        localStorage.setItem(getCartKey(mode), JSON.stringify(data.items));
        window.dispatchEvent(new CustomEvent("cart_updated", { detail: { mode } }));
      }
      return data.items;
    }
  } catch (err) {
    console.warn("Failed to fetch cart from server database:", err);
  }
  return getCartItems(mode);
}

/**
 * Save cart items to local cache and persist to server database.
 */
export function saveCartItems(mode: StoreMode, items: OrderItem[]): void {
  if (typeof window === "undefined") return;

  const key = getCartKey(mode);
  try {
    localStorage.setItem(key, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("cart_updated", { detail: { mode } }));
  } catch (err) {
    console.error(`Error saving ${key}:`, err);
  }

  // Persist directly to server database
  const user = getActiveUserMobile(mode);
  fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: mode, user, items }),
  }).catch((err) => {
    console.warn("Failed to persist cart to database:", err);
  });
}

/**
 * Get total quantity count for the specified mode.
 */
export function getCartCount(mode: StoreMode): number {
  const items = getCartItems(mode);
  return items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
}

/**
 * Add a product to the respective cart and save to database.
 */
export function addToCartByMode(
  product: Product,
  mode: StoreMode,
  quantity = 1
): { items: OrderItem[]; effectivePrice: number } {
  const effectivePrice =
    mode === "wholesale"
      ? (product.wholesalePrice ?? product.price)
      : (product.retailPrice ?? product.price);

  const current = getCartItems(mode);
  const existingIdx = current.findIndex((item) => item.id === product.id);

  let updated: OrderItem[];
  if (existingIdx > -1) {
    updated = current.map((item, idx) =>
      idx === existingIdx
        ? {
            ...item,
            quantity: item.quantity + quantity,
            price: effectivePrice,
          }
        : item
    );
  } else {
    updated = [
      ...current,
      {
        id: product.id,
        name: product.name,
        price: effectivePrice,
        quantity,
        image: product.image,
      },
    ];
  }

  saveCartItems(mode, updated);
  return { items: updated, effectivePrice };
}

/**
 * Update the quantity of a specific item in the specified cart.
 */
export function updateCartQtyByMode(
  mode: StoreMode,
  id: string,
  quantity: number
): OrderItem[] {
  const current = getCartItems(mode);
  let updated: OrderItem[];
  if (quantity <= 0) {
    updated = current.filter((item) => item.id !== id);
  } else {
    updated = current.map((item) =>
      item.id === id ? { ...item, quantity } : item
    );
  }
  saveCartItems(mode, updated);
  return updated;
}

/**
 * Remove an item from the specified cart.
 */
export function removeFromCartByMode(mode: StoreMode, id: string): OrderItem[] {
  const current = getCartItems(mode);
  const updated = current.filter((item) => item.id !== id);
  saveCartItems(mode, updated);
  return updated;
}

/**
 * Clear the cart for the specified mode from local cache & server database.
 */
export function clearCartByMode(mode: StoreMode): void {
  if (typeof window === "undefined") return;
  const key = getCartKey(mode);
  try {
    localStorage.removeItem(key);
    window.dispatchEvent(new CustomEvent("cart_updated", { detail: { mode } }));
  } catch (err) {
    console.error(`Error clearing ${key}:`, err);
  }

  const user = getActiveUserMobile(mode);
  fetch(`/api/cart?type=${mode}&user=${encodeURIComponent(user)}`, {
    method: "DELETE",
  }).catch((err) => {
    console.warn("Failed to clear cart on server database:", err);
  });
}

// ---------------- WISHLIST HELPERS (DATABASE SYNCHRONIZED) ----------------

export function getWishlistKey(mode: StoreMode): string {
  return mode === "wholesale" ? "fc_wholesale_wishlist" : "fc_retail_wishlist";
}

export function getWishlistItems(mode: StoreMode): string[] {
  if (typeof window === "undefined") return [];
  const key = getWishlistKey(mode);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
    if (mode === "wholesale") {
      const legacy = localStorage.getItem("fc_b2b_wishlist");
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localStorage.setItem(key, JSON.stringify(parsed));
          saveWishlistItems(mode, parsed);
          return parsed;
        }
      }
    }
  } catch (err) {
    console.error(`Error reading ${key}:`, err);
  }
  return [];
}

export async function fetchWishlistFromServer(mode: StoreMode): Promise<string[]> {
  const user = getActiveUserMobile(mode);
  try {
    const res = await fetch(`/api/wishlist?type=${mode}&user=${encodeURIComponent(user)}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.productIds)) {
      if (typeof window !== "undefined") {
        localStorage.setItem(getWishlistKey(mode), JSON.stringify(data.productIds));
        window.dispatchEvent(new CustomEvent("wishlist_updated", { detail: { mode } }));
      }
      return data.productIds;
    }
  } catch (err) {
    console.warn("Failed to fetch wishlist from server database:", err);
  }
  return getWishlistItems(mode);
}

export function saveWishlistItems(mode: StoreMode, items: string[]): void {
  if (typeof window === "undefined") return;
  const key = getWishlistKey(mode);
  try {
    localStorage.setItem(key, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("wishlist_updated", { detail: { mode } }));
  } catch (err) {
    console.error(`Error saving ${key}:`, err);
  }

  const user = getActiveUserMobile(mode);
  fetch("/api/wishlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: mode, user, productIds: items }),
  }).catch((err) => {
    console.warn("Failed to save wishlist to server database:", err);
  });
}

export function toggleWishlistByMode(
  mode: StoreMode,
  productId: string
): { items: string[]; isAdded: boolean } {
  const current = getWishlistItems(mode);
  const exists = current.includes(productId);
  const updated = exists
    ? current.filter((id) => id !== productId)
    : [...current, productId];

  saveWishlistItems(mode, updated);
  return { items: updated, isAdded: !exists };
}

// ---------------- ACCOUNT & PROFILE HELPERS (DATABASE SYNCHRONIZED) ----------------

export function getAccountKeyPrefix(mode: StoreMode): string {
  return mode === "wholesale" ? "fc_wholesale" : "fc_retail";
}

export function getAccountProfile(mode: StoreMode): {
  mobile: string;
  name: string;
  email: string;
  companyName: string;
  gstin: string;
} {
  const prefix = getAccountKeyPrefix(mode);
  if (typeof window === "undefined") {
    return {
      mobile: mode === "wholesale" ? "6289417338" : "",
      name: "",
      email: "",
      companyName: "",
      gstin: "",
    };
  }

  try {
    const mobile =
      localStorage.getItem(`${prefix}_mobile`) ||
      (mode === "wholesale" ? localStorage.getItem("fc_user_mobile") || "6289417338" : "");
    const name = localStorage.getItem(`${prefix}_name`) || "";
    const email = localStorage.getItem(`${prefix}_email`) || "";
    const companyName = localStorage.getItem(`${prefix}_company`) || "";
    const gstin = localStorage.getItem(`${prefix}_gstin`) || "";
    return { mobile, name, email, companyName, gstin };
  } catch {
    return {
      mobile: mode === "wholesale" ? "6289417338" : "",
      name: "",
      email: "",
      companyName: "",
      gstin: "",
    };
  }
}

export async function fetchAccountProfileFromServer(mode: StoreMode): Promise<any> {
  const mobile = getActiveUserMobile(mode);
  if (!mobile) return null;
  try {
    const res = await fetch(`/api/users?type=${mode}&mobile=${encodeURIComponent(mobile)}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (data.success && data.user) {
      const u = data.user;
      const prefix = getAccountKeyPrefix(mode);
      if (typeof window !== "undefined") {
        if (u.name) localStorage.setItem(`${prefix}_name`, u.name);
        if (u.email) localStorage.setItem(`${prefix}_email`, u.email);
        if (u.companyName) localStorage.setItem(`${prefix}_company`, u.companyName);
        if (u.gstin) localStorage.setItem(`${prefix}_gstin`, u.gstin);
        if (Array.isArray(u.addresses)) {
          localStorage.setItem(`${prefix}_addresses`, JSON.stringify(u.addresses));
        }
      }
      return u;
    }
  } catch (err) {
    console.warn("Failed to fetch profile from server database:", err);
  }
  return null;
}

export function saveAccountProfile(
  mode: StoreMode,
  profile: {
    mobile?: string;
    name?: string;
    email?: string;
    companyName?: string;
    gstin?: string;
    addresses?: UserAddress[];
  }
): void {
  if (typeof window === "undefined") return;
  const prefix = getAccountKeyPrefix(mode);
  try {
    if (profile.mobile !== undefined) localStorage.setItem(`${prefix}_mobile`, profile.mobile);
    if (profile.name !== undefined) localStorage.setItem(`${prefix}_name`, profile.name);
    if (profile.email !== undefined) localStorage.setItem(`${prefix}_email`, profile.email);
    if (profile.companyName !== undefined) localStorage.setItem(`${prefix}_company`, profile.companyName);
    if (profile.gstin !== undefined) localStorage.setItem(`${prefix}_gstin`, profile.gstin);
    if (profile.addresses !== undefined) {
      localStorage.setItem(`${prefix}_addresses`, JSON.stringify(profile.addresses));
    }
  } catch (err) {
    console.error(`Error saving ${prefix} profile:`, err);
  }

  const mobile = profile.mobile || getActiveUserMobile(mode);
  if (mobile) {
    fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: mode,
        mobile,
        name: profile.name,
        email: profile.email,
        companyName: profile.companyName,
        gstin: profile.gstin,
        addresses: profile.addresses,
      }),
    }).catch((err) => {
      console.warn("Failed to save account to database:", err);
    });
  }
}

export function getAccountAddresses(mode: StoreMode): UserAddress[] {
  if (typeof window === "undefined") return [];
  const prefix = getAccountKeyPrefix(mode);
  try {
    const raw = localStorage.getItem(`${prefix}_addresses`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export function saveAccountAddresses(mode: StoreMode, addresses: UserAddress[]): void {
  if (typeof window === "undefined") return;
  const prefix = getAccountKeyPrefix(mode);
  try {
    localStorage.setItem(`${prefix}_addresses`, JSON.stringify(addresses));
  } catch (err) {
    console.error(`Error saving ${prefix} addresses:`, err);
  }

  const mobile = getActiveUserMobile(mode);
  if (mobile) {
    fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: mode,
        mobile,
        addresses,
      }),
    }).catch((err) => {
      console.warn("Failed to save addresses to database:", err);
    });
  }
}
