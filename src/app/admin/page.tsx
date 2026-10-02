"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Lock,
  Package,
  Layers,
  ShoppingBag,
  TrendingUp,
  Plus,
  Trash2,
  Edit2,
  X,
  Upload,
  CheckCircle,
  Clock,
  Truck,
  CheckCheck,
  LogOut,
  Eye,
  EyeOff,
  Search,
  Users,
  User,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Instagram,
  Mail,
  Building2,
  Phone,
  AlertCircle,
  Crown,
} from "lucide-react";
import { Product, Category, Order, WholesaleApplication, RetailUser } from "@/lib/db";

const R2_BASE = "https://pub-ce8688bc6c654bcfb99716f7c9373bcd.r2.dev/fab-creations";
const LOGO_R2_URL = `${R2_BASE}/brand-logo.png`;

export default function AdminPage() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Admin Tab: "overview" | "products" | "categories" | "orders" | "requests"
  const [activeTab, setActiveTab] = useState<
    "overview" | "products" | "categories" | "orders" | "requests"
  >("products");

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [adminOrdersTab, setAdminOrdersTab] = useState<"wholesale" | "retail">("wholesale");
  const [accountRequests, setAccountRequests] = useState<WholesaleApplication[]>([]);
  const [retailUsers, setRetailUsers] = useState<RetailUser[]>([]);
  const [usersSubTab, setUsersSubTab] = useState<"wholesale" | "retail">("wholesale");
  const [requestFilter, setRequestFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [requestSearch, setRequestSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Product Modal (Add/Edit)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    price: "",
    retailPrice: "",
    wholesalePrice: "",
    channel: "both" as "both" | "wholesale" | "retail",
    category: "",
    image: "",
    stock: "10",
    subtitle: "Anti tarnish",
    metal: "Stainless Steel",
    target: "Women",
    occasion: "Daily Wear",
    featured: true,
  });
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // New Category input
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Check login on load
  useEffect(() => {
    const savedAuth = sessionStorage.getItem("fc_admin_auth");
    if (savedAuth === "true") {
      setIsAuthenticated(true);
      fetchData();
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setAuthError(null);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });

      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem("fc_admin_auth", "true");
        fetchData();
      } else {
        setAuthError("Incorrect password. Please try again.");
      }
    } catch {
      setAuthError("Authentication request failed.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    setIsAuthenticated(false);
    sessionStorage.removeItem("fc_admin_auth");
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, ordRes, reqRes, retRes] = await Promise.all([
        fetch("/api/products", { cache: "no-store" }),
        fetch("/api/categories", { cache: "no-store" }),
        fetch("/api/orders", { cache: "no-store" }),
        fetch("/api/wholesale-requests", { cache: "no-store" }),
        fetch("/api/retail-users", { cache: "no-store" }),
      ]);

      const [prodData, catData, ordData, reqData, retData] = await Promise.all([
        prodRes.json(),
        catRes.json(),
        ordRes.json(),
        reqRes.json(),
        retRes.json(),
      ]);

      if (prodData.success && Array.isArray(prodData.products)) {
        setProducts(prodData.products);
      }
      if (catData.success && Array.isArray(catData.categories)) {
        setCategories(catData.categories);
        if (!productForm.category && catData.categories.length > 0) {
          setProductForm((prev) => ({ ...prev, category: catData.categories[0].name }));
        }
      }
      if (ordData.success && Array.isArray(ordData.orders)) {
        setOrders(ordData.orders);
      }
      if (reqData.success && Array.isArray(reqData.requests)) {
        setAccountRequests(reqData.requests);
      }
      if (retData.success && Array.isArray(retData.users)) {
        setRetailUsers(retData.users);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Wholesale Requests Actions
  const handleApproveRequest = async (id: string) => {
    try {
      const res = await fetch(`/api/wholesale-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      const d = await res.json();
      if (d.success) {
        setAccountRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r))
        );
        showNotification("Wholesale account approved! User can now log in.");
      } else {
        showNotification(d.error || "Failed to approve account.");
      }
    } catch {
      showNotification("Failed to approve account.");
    }
  };

  const handleRejectRequest = async (id: string) => {
    const reason = window.prompt("Reason for rejection (optional):", "Business verification required") || "";
    try {
      const res = await fetch(`/api/wholesale-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected", reason }),
      });
      const d = await res.json();
      if (d.success) {
        setAccountRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "rejected", rejectionReason: reason } : r))
        );
        showNotification("Wholesale account request rejected.");
      } else {
        showNotification(d.error || "Failed to reject account.");
      }
    } catch {
      showNotification("Failed to reject account.");
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (!confirm("Are you sure you want to delete this account request?")) return;
    try {
      const res = await fetch(`/api/wholesale-requests/${id}`, {
        method: "DELETE",
      });
      const d = await res.json();
      if (d.success) {
        setAccountRequests((prev) => prev.filter((r) => r.id !== id));
        showNotification("Account request deleted.");
      }
    } catch {
      showNotification("Failed to delete request.");
    }
  };

  // Image Upload to R2 (reusable for file selector and drag-and-drop)
  const processImageFile = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (PNG, JPG, WebP, etc.)");
      return;
    }

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setProductForm((prev) => ({ ...prev, image: data.url }));
        showNotification("Image uploaded & optimized to Cloudflare R2!");
      } else {
        alert("Image upload failed: " + data.message);
      }
    } catch {
      alert("Error uploading image");
    } finally {
      setIsUploadingImage(false);
      setIsDraggingImage(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    if (!isDraggingImage) setIsDraggingImage(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingImage(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processImageFile(files[0]);
    }
  };

  // Save Product (Add or Edit)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalRetail = Number(productForm.retailPrice || productForm.price || 0);
    const finalWholesale = Number(productForm.wholesalePrice || productForm.price || 0);

    if (!productForm.name || (!finalRetail && !finalWholesale)) {
      alert("Please fill in Product Name and Pricing (Retail and/or Wholesale)");
      return;
    }

    const payload = {
      ...productForm,
      retailPrice: finalRetail,
      wholesalePrice: finalWholesale,
      price: finalRetail || finalWholesale,
    };

    try {
      if (editingProduct) {
        // Update
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          showNotification(`Updated "${productForm.name}" successfully!`);
          setIsProductModalOpen(false);
          fetchData();
        }
      } else {
        // Create
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          showNotification(`Created "${productForm.name}" successfully!`);
          setIsProductModalOpen(false);
          fetchData();
        }
      }
    } catch {
      alert("Failed to save product");
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showNotification(`Deleted "${name}"`);
        fetchData();
      }
    } catch {
      alert("Failed to delete product");
    }
  };

  // Open Edit Modal
  const handleEditProduct = (p: Product) => {
    setEditingProduct(p);
    const rPrice = p.retailPrice ?? p.price ?? "";
    const wPrice = p.wholesalePrice ?? p.price ?? "";
    setProductForm({
      name: p.name,
      sku: p.sku,
      price: String(rPrice || wPrice || ""),
      retailPrice: String(rPrice),
      wholesalePrice: String(wPrice),
      channel: p.channel || "both",
      category: p.category,
      image: p.image,
      stock: String(p.stock),
      subtitle: p.subtitle,
      metal: p.metal,
      target: p.target,
      occasion: p.occasion,
      featured: p.featured,
    });
    setIsCustomCategory(!categories.some((c) => c.name.toLowerCase() === p.category?.toLowerCase()));
    setIsProductModalOpen(true);
  };

  // Open Add Modal
  const handleAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: "",
      sku: `${Math.floor(100 + Math.random() * 900)}`,
      price: "",
      retailPrice: "",
      wholesalePrice: "",
      channel: "both",
      category: categories[0]?.name || "",
      image: "",
      stock: "10",
      subtitle: "Anti tarnish",
      metal: "Stainless Steel",
      target: "Women",
      occasion: "Daily Wear",
      featured: true,
    });
    setIsCustomCategory(categories.length === 0);
    setIsProductModalOpen(true);
  };

  // Add Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const catName = newCategoryName.trim();
    if (!catName) {
      alert("Please enter a category name");
      return;
    }

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: catName }),
      });
      const data = await res.json();
      if (data.success && data.category) {
        showNotification(`Category "${catName}" added!`);
        setNewCategoryName("");
        // Optimistic update
        setCategories((prev) => {
          if (prev.some((c) => c.name.toLowerCase() === catName.toLowerCase())) return prev;
          return [...prev, data.category];
        });
        fetchData();
      } else {
        alert(data.message || "Failed to add category");
      }
    } catch (err) {
      console.error("Add category error:", err);
      alert("Failed to add category. Please check connection.");
    }
  };

  // Delete Category
  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return;

    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showNotification(`Deleted category "${name}"`);
        setCategories((prev) => prev.filter((c) => c.id !== id));
        fetchData();
      } else {
        alert(data.message || "Failed to delete category");
      }
    } catch (err) {
      console.error("Delete category error:", err);
      alert("Failed to delete category");
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`Order status updated to "${newStatus}"`);
        fetchData();
      }
    } catch {
      alert("Failed to update status");
    }
  };

  // Delete Order
  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`Are you sure you want to delete order #${orderNumber}?`)) return;

    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showNotification(`Order #${orderNumber} deleted`);
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        fetchData();
      } else {
        alert(data.message || "Failed to delete order");
      }
    } catch {
      alert("Failed to delete order");
    }
  };

  // Total Revenue Calculation
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

  // Filtered Products
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* =================================================================== */
  /* 1. PASSWORD GATE (LOGIN SCREEN)                                     */
  /* =================================================================== */
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen w-full bg-[#050505] text-white flex items-center justify-center p-4 select-none relative">
        {/* Subtle Ambient Gold Glow */}
        <div 
          className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] h-[460px] rounded-full opacity-20 blur-[120px]"
          style={{
            background: "radial-gradient(circle, rgba(229,169,60,0.5) 0%, transparent 70%)"
          }}
        />

        <div className="w-full max-w-[390px] bg-[#0d0d0d] border border-[#d69e3d] rounded-[24px] p-7 shadow-[0_12px_45px_rgba(0,0,0,0.85)] z-10 flex flex-col items-center">
          {/* Circular Logo */}
          <div className="w-[100px] h-[100px] relative rounded-full overflow-hidden mb-5">
            <Image
              src={LOGO_R2_URL}
              alt="Fab Creations Logo"
              width={110}
              height={110}
              priority
              unoptimized
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/images/logo.png";
              }}
              className="object-contain w-full h-full"
            />
          </div>

          <p className="text-[#e5a93c] text-[11px] font-semibold tracking-[0.2em] uppercase mb-1.5">
            ADMINISTRATOR ACCESS
          </p>
          <h1 className="text-white text-[22px] font-serif font-medium text-center mb-1">
            Fab Creations Portal
          </h1>
          <p className="text-[#8e8e93] text-[13px] text-center mb-6">
            Enter master password to manage your B2B store
          </p>

          <form onSubmit={handleLogin} className="w-full space-y-4">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter admin password"
                autoFocus
                required
                className="w-full h-[50px] rounded-[14px] bg-[#141414] border border-[#e5a93c] px-4 pr-11 text-white text-[14.5px] outline-none focus:ring-1 focus:ring-[#f5c767]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8e8e93] hover:text-[#e5a93c] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {authError && (
              <p className="text-rose-400 text-xs text-center font-medium">
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full h-[50px] rounded-[14px] bg-gradient-to-r from-[#e5a93c] to-[#f5c767] hover:brightness-105 active:scale-[0.99] text-[#111111] font-semibold text-[14.5px] flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-75"
            >
              <Lock className="w-4 h-4" />
              <span>{isLoggingIn ? "Verifying..." : "Enter Admin Panel"}</span>
            </button>
          </form>

          <p className="text-[#666666] text-xs text-center mt-6">
            Default Password: <code className="text-[#e5a93c]">admin@fab2026</code>
          </p>
        </div>
      </main>
    );
  }

  /* =================================================================== */
  /* 2. AUTHENTICATED ADMIN DASHBOARD                                   */
  /* =================================================================== */
  return (
    <div className="min-h-screen w-full bg-[#050505] text-white select-none">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 bg-[#171207] border border-[#e5a93c] text-[#f5c767] text-xs font-medium rounded-xl shadow-2xl animate-fade-in flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-[#e5a93c]" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#080808]/95 backdrop-blur-md border-b border-[#1f1f1f] px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 relative rounded-full overflow-hidden">
            <Image
              src={LOGO_R2_URL}
              alt="Fab Creations"
              width={40}
              height={40}
              unoptimized
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/images/logo.png";
              }}
              className="object-contain w-full h-full"
            />
          </div>
          <div>
            <h2 className="text-white text-[15px] font-serif font-medium leading-tight">
              Fab Creations Admin
            </h2>
            <div className="flex items-center gap-1.5 text-[11px] text-[#22c55e]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
              <span>Store Database Synced</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/home"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#333333] hover:border-[#e5a93c] text-xs text-[#a0a0a0] hover:text-[#e5a93c] transition-colors"
          >
            <span>View Live Store</span>
            <span>↗</span>
          </a>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141414] border border-[#2e2e2e] hover:border-rose-800 text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#1c1c1c] pb-3 mb-6 overflow-x-auto">
          {[
            { id: "products", label: "Products", icon: <Package className="w-4 h-4" /> },
            { id: "categories", label: "Categories", icon: <Layers className="w-4 h-4" /> },
            { id: "orders", label: "Orders", icon: <ShoppingBag className="w-4 h-4" /> },
            { id: "requests", label: "Account Requests", icon: <Users className="w-4 h-4" /> },
            { id: "overview", label: "Overview", icon: <TrendingUp className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-[#171207] border border-[#e5a93c] text-[#e5a93c] shadow-sm"
                  : "bg-[#0f0f0f] border border-[#222222] text-[#8e8e93] hover:text-white"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.id === "products" && (
                <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-[#222] text-[#aaa]">
                  {products.length}
                </span>
              )}
              {tab.id === "orders" && (
                <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-[#222] text-[#aaa]">
                  {orders.length}
                </span>
              )}
              {tab.id === "requests" && (
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                    accountRequests.filter((r) => r.status === "pending").length > 0
                      ? "bg-amber-500/25 border border-amber-500/50 text-amber-300 animate-pulse"
                      : "bg-[#222] text-[#aaa]"
                  }`}
                >
                  {accountRequests.filter((r) => r.status === "pending").length > 0
                    ? `${accountRequests.filter((r) => r.status === "pending").length} new`
                    : accountRequests.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ============================================================= */}
        {/* TAB 1: PRODUCTS MANAGEMENT                                    */}
        {/* ============================================================= */}
        {activeTab === "products" && (
          <div className="space-y-4">
            {/* Header with Search and Add Product Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8e8e93]" />
                <input
                  type="text"
                  placeholder="Search products by title, SKU, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 rounded-xl bg-[#0f0f0f] border border-[#262626] pl-9 pr-4 text-xs text-white placeholder-[#666] outline-none focus:border-[#e5a93c]"
                />
              </div>

              <button
                onClick={handleAddProduct}
                className="h-10 px-4 rounded-xl bg-[#e5a93c] hover:bg-[#f5c767] text-[#111111] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Product</span>
              </button>
            </div>

            {/* Products Table */}
            <div className="w-full bg-[#0d0d0d] border border-[#222222] rounded-[18px] overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#121212] border-b border-[#222222] text-[#8e8e93] uppercase tracking-wider text-[10.5px]">
                    <tr>
                      <th className="py-3 px-4">Item</th>
                      <th className="py-3 px-3">SKU</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Channel</th>
                      <th className="py-3 px-3">Pricing (Retail / B2B)</th>
                      <th className="py-3 px-3">Stock</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1a1a]">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-[#121212] transition-colors">
                        {/* Item Name + Thumbnail */}
                        <td className="py-3 px-4 flex items-center gap-3">
                          <div className="w-11 h-11 rounded-lg overflow-hidden relative bg-[#1c1c1c] border border-[#262626] shrink-0">
                            <Image
                              src={p.image}
                              alt={p.name}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="text-white font-medium text-[13px]">{p.name}</p>
                            <p className="text-[#8e8e93] text-[11px]">{p.subtitle}</p>
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="py-3 px-3 text-[#a0a0a0] font-mono">{p.sku}</td>

                        {/* Category */}
                        <td className="py-3 px-3">
                          <span className="px-2.5 py-0.5 rounded-full border border-[#2f2716] bg-[#141008] text-[#e5a93c] text-[11px]">
                            {p.category}
                          </span>
                        </td>

                        {/* Channel Visibility Badge */}
                        <td className="py-3 px-3">
                          {p.channel === "retail" ? (
                            <span className="px-2 py-0.5 rounded-full border border-emerald-500/40 bg-emerald-950/40 text-emerald-300 text-[10.5px] font-medium whitespace-nowrap">
                              Retail Only
                            </span>
                          ) : p.channel === "wholesale" ? (
                            <span className="px-2 py-0.5 rounded-full border border-sky-500/40 bg-sky-950/40 text-sky-300 text-[10.5px] font-medium whitespace-nowrap">
                              Wholesale Only
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full border border-[#d69e3d]/40 bg-[#241a0c] text-[#f5c767] text-[10.5px] font-medium whitespace-nowrap">
                              Both Channels
                            </span>
                          )}
                        </td>

                        {/* Pricing (Retail & Wholesale) */}
                        <td className="py-3 px-3">
                          <div className="flex flex-col gap-0.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-[11.5px]">
                              <span className="text-[#777]">Retail:</span>
                              <span className="text-white font-medium">₹{p.retailPrice ?? p.price}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11.5px]">
                              <span className="text-[#777]">B2B:</span>
                              <span className="text-[#f5c767] font-semibold">₹{p.wholesalePrice ?? p.price}</span>
                            </div>
                          </div>
                        </td>

                        {/* Stock */}
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                              p.stock > 0
                                ? "bg-emerald-950/60 text-emerald-400 border border-emerald-900/50"
                                : "bg-rose-950/60 text-rose-400 border border-rose-900/50"
                            }`}
                          >
                            {p.stock} in stock
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditProduct(p)}
                              className="p-1.5 rounded-lg border border-[#333] hover:border-[#e5a93c] text-[#a0a0a0] hover:text-[#e5a93c] transition-colors cursor-pointer"
                              title="Edit product"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              className="p-1.5 rounded-lg border border-[#333] hover:border-rose-500 text-[#a0a0a0] hover:text-rose-400 transition-colors cursor-pointer"
                              title="Delete product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 2: CATEGORIES MANAGEMENT                                  */}
        {/* ============================================================= */}
        {activeTab === "categories" && (
          <div className="space-y-5 max-w-xl animate-fade-in">
            {/* Add Category Card */}
            <div className="bg-[#0d0d0d] border border-[#222222] rounded-[20px] p-5 shadow-sm space-y-3">
              <h3 className="text-white text-[15px] font-serif font-medium">
                Add New Category
              </h3>
              <form onSubmit={handleAddCategory} className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter category name (e.g. Chains, Rings, Bangles)"
                  className="flex-1 h-11 rounded-xl bg-[#141414] border border-[#262626] px-4 text-sm text-white placeholder-[#666] outline-none focus:border-[#e5a93c]"
                />
                <button
                  type="submit"
                  className="h-11 px-5 rounded-xl bg-[#e5a93c] hover:bg-[#f5c767] text-black text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Category</span>
                </button>
              </form>
            </div>

            {/* Categories List */}
            <div className="bg-[#0d0d0d] border border-[#222222] rounded-[20px] p-3 divide-y divide-[#1a1a1a]">
              <div className="p-3 flex items-center justify-between text-xs text-[#8e8e93]">
                <span>Category Name</span>
                <span>Actions</span>
              </div>
              {categories.length > 0 ? (
                categories.map((c) => {
                  const count = products.filter(
                    (p) => p.category?.toLowerCase() === c.name?.toLowerCase()
                  ).length;
                  return (
                    <div
                      key={c.id}
                      className="p-3.5 flex items-center justify-between hover:bg-[#121212] rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#171207] border border-[#3a2c16] flex items-center justify-center text-[#e5a93c]">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-white font-medium text-[14px]">{c.name}</p>
                          <p className="text-[#8e8e93] text-[11.5px]">{count} products</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(c.id, c.name)}
                        className="p-2 rounded-lg border border-[#333] hover:border-rose-500 text-[#8e8e93] hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-[#8e8e93] text-xs">
                  No categories created yet. Enter a name above to create your first category.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 3: ORDERS MANAGEMENT                                      */}
        {/* ============================================================= */}
        {activeTab === "orders" && (() => {
          const wholesaleOrders = orders.filter((o) => o.orderType === "wholesale");
          const retailOrders = orders.filter((o) => o.orderType !== "wholesale");
          const displayedOrders = adminOrdersTab === "wholesale" ? wholesaleOrders : retailOrders;

          return (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-white text-[16px] font-serif font-medium">
                    Customer Orders ({orders.length})
                  </h3>
                  <p className="text-[#8e8e93] text-xs">
                    Manage and fulfill your wholesale and retail customer orders
                  </p>
                </div>

                {/* Wholesale vs Retail Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-[#141414] border border-[#262626] rounded-xl w-fit">
                  <button
                    type="button"
                    onClick={() => setAdminOrdersTab("wholesale")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                      adminOrdersTab === "wholesale"
                        ? "bg-[#e5a93c] text-black shadow-md font-bold"
                        : "text-[#8e8e93] hover:text-white"
                    }`}
                  >
                    <span>Wholesale Orders</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        adminOrdersTab === "wholesale"
                          ? "bg-black/25 text-black font-bold"
                          : "bg-[#222] text-[#e5a93c]"
                      }`}
                    >
                      {wholesaleOrders.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdminOrdersTab("retail")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                      adminOrdersTab === "retail"
                        ? "bg-[#e5a93c] text-black shadow-md font-bold"
                        : "text-[#8e8e93] hover:text-white"
                    }`}
                  >
                    <span>Retail Orders</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        adminOrdersTab === "retail"
                          ? "bg-black/25 text-black font-bold"
                          : "bg-[#222] text-[#e5a93c]"
                      }`}
                    >
                      {retailOrders.length}
                    </span>
                  </button>
                </div>
              </div>

              {displayedOrders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayedOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-[#0d0d0d] border border-[#222222] rounded-[20px] p-5 shadow-md flex flex-col justify-between space-y-4"
                    >
                      {/* Header: Order # + Date + Channel Badge */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[#e5a93c] font-mono font-semibold text-sm">
                              {ord.orderNumber}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                                ord.orderType === "wholesale"
                                  ? "bg-amber-950/60 text-[#f5c767] border border-[#e5a93c]/50"
                                  : "bg-blue-950/60 text-blue-300 border border-blue-800/50"
                              }`}
                            >
                              {ord.orderType === "wholesale" ? "Wholesale" : "Retail"}
                            </span>
                          </div>
                          <p className="text-[#8e8e93] text-xs pt-1">
                            {new Date(ord.createdAt).toLocaleString()}
                          </p>
                        </div>

                        {/* Status Badge & Actions */}
                        <div className="flex items-center gap-2">
                          <select
                            value={ord.status}
                            onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                            className={`text-xs font-semibold rounded-lg px-2.5 py-1 border outline-none cursor-pointer ${
                              ord.status === "Delivered"
                                ? "bg-emerald-950/60 text-emerald-400 border-emerald-800"
                                : ord.status === "Dispatched"
                                ? "bg-blue-950/60 text-blue-400 border-blue-800"
                                : ord.status === "Confirmed"
                                ? "bg-amber-950/60 text-[#f5c767] border-[#e5a93c]"
                                : "bg-neutral-900 text-neutral-400 border-neutral-700"
                            }`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Dispatched">Dispatched</option>
                            <option value="Delivered">Delivered</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(ord.id, ord.orderNumber)}
                            className="p-1.5 rounded-lg bg-red-950/40 border border-red-800/60 text-red-400 hover:bg-red-900/60 hover:text-red-200 transition-colors cursor-pointer"
                            title="Delete Order"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Customer Phone */}
                      <div className="p-2.5 rounded-xl bg-[#141414] border border-[#222222] flex items-center justify-between text-xs">
                        <span className="text-[#8e8e93]">Customer Phone:</span>
                        <span className="text-white font-medium">+91 {ord.customerMobile}</span>
                      </div>

                      {/* Items List */}
                      <div className="space-y-2">
                        {ord.items.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between text-xs py-1 border-b border-[#1c1c1c] last:border-0"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded relative bg-[#1c1c1c] overflow-hidden shrink-0">
                                <Image
                                  src={item.image || `${R2_BASE}/products/moon-necklace.jpg`}
                                  alt={item.name}
                                  fill
                                  unoptimized
                                  className="object-cover"
                                />
                              </div>
                              <div>
                                <p className="text-white font-medium">{item.name}</p>
                                <p className="text-[#8e8e93] text-[10.5px]">Qty: {item.quantity}</p>
                              </div>
                            </div>
                            <span className="text-[#f5c767] font-medium">
                              ₹{item.price * item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Pricing Breakdown */}
                      <div className="pt-2 border-t border-[#1f1f1f] flex items-center justify-between text-xs">
                        <span className="text-[#8e8e93]">
                          Subtotal: ₹{ord.subtotal} | Shipping: ₹{ord.shipping}
                        </span>
                        <span className="text-white text-sm font-semibold">Total: ₹{ord.total}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full bg-[#0d0d0d] border border-[#222222] rounded-[20px] p-12 text-center">
                  <p className="text-white font-medium text-sm">
                    No {adminOrdersTab === "wholesale" ? "wholesale" : "retail"} orders found
                  </p>
                  <p className="text-[#8e8e93] text-xs mt-1">
                    Orders placed on the {adminOrdersTab === "wholesale" ? "wholesale" : "retail"} store will appear here.
                  </p>
                </div>
              )}
            </div>
          );
        })()}

        {/* ============================================================= */}
        {/* TAB 4: OVERVIEW                                               */}
        {/* ============================================================= */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Stat 1 */}
              <div className="p-4 rounded-[18px] bg-[#0d0d0d] border border-[#222] space-y-1">
                <p className="text-[#8e8e93] text-xs">Total Products</p>
                <p className="text-[#e5a93c] text-2xl font-serif font-bold">{products.length}</p>
              </div>

              {/* Stat 2 */}
              <div className="p-4 rounded-[18px] bg-[#0d0d0d] border border-[#222] space-y-1">
                <p className="text-[#8e8e93] text-xs">Categories</p>
                <p className="text-[#e5a93c] text-2xl font-serif font-bold">{categories.length}</p>
              </div>

              {/* Stat 3 */}
              <div className="p-4 rounded-[18px] bg-[#0d0d0d] border border-[#222] space-y-1">
                <p className="text-[#8e8e93] text-xs">Total Orders</p>
                <p className="text-[#e5a93c] text-2xl font-serif font-bold">{orders.length}</p>
              </div>

              {/* Stat 4 */}
              <div className="p-4 rounded-[18px] bg-[#0d0d0d] border border-[#222] space-y-1">
                <p className="text-[#8e8e93] text-xs">Gross Revenue</p>
                <p className="text-[#f5c767] text-2xl font-serif font-bold">₹{totalRevenue.toLocaleString()}</p>
              </div>
            </div>

            <div className="p-5 rounded-[20px] bg-[#0d0d0d] border border-[#222] space-y-3">
              <h4 className="text-white text-sm font-semibold">Quick Guide</h4>
              <p className="text-xs text-[#a0a0a0] leading-relaxed">
                • <strong>Products</strong>: Add new jewellery items or edit prices and stock. Uploaded photos are pushed directly to your Cloudflare R2 bucket (`chf-media`).<br />
                • <strong>Categories</strong>: Create new sections (e.g. Rings, Bracelets) that immediately appear in the store's category pop-up.<br />
                • <strong>Orders</strong>: View incoming buyer orders with phone numbers and mark them as Confirmed, Dispatched, or Delivered.<br />
                • <strong>Account Requests</strong>: Review wholesale buyer applications with shop name, contact email, and Instagram profile. Approve to grant instant wholesale pricing access.
              </p>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 5: USERS & ACCOUNTS (WHOLESALE PARTNERS & RETAIL USERS)   */}
        {/* ============================================================= */}
        {activeTab === "requests" && (
          <div className="space-y-4 animate-fade-in">
            {/* Top Switcher: Wholesale Partners vs Retail Customers */}
            <div className="flex bg-[#111] p-1.5 rounded-2xl border border-[#262626] max-w-lg mb-2">
              <button
                type="button"
                onClick={() => setUsersSubTab("wholesale")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  usersSubTab === "wholesale"
                    ? "bg-[#e5a93c] text-black shadow-md"
                    : "text-[#8e8e93] hover:text-white"
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Wholesale Partners</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${usersSubTab === "wholesale" ? "bg-black/25 text-black" : "bg-[#222] text-[#aaa]"}`}>
                  {accountRequests.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setUsersSubTab("retail")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  usersSubTab === "retail"
                    ? "bg-[#e5a93c] text-black shadow-md"
                    : "text-[#8e8e93] hover:text-white"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Retail Customers</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${usersSubTab === "retail" ? "bg-black/25 text-black" : "bg-[#222] text-[#aaa]"}`}>
                  {retailUsers.length}
                </span>
              </button>
            </div>

            {usersSubTab === "retail" ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0d0d0d] border border-[#222] p-4 rounded-[20px]">
                  <div>
                    <h4 className="text-white font-serif font-bold text-sm">Retail Customers Table</h4>
                    <p className="text-[11px] text-[#8e8e93]">
                      Direct 2-step OTP customers. Zero admin approval needed for purchasing.
                    </p>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#777]" />
                    <input
                      type="text"
                      placeholder="Search retail email or name..."
                      value={requestSearch}
                      onChange={(e) => setRequestSearch(e.target.value)}
                      className="w-full h-9 rounded-xl bg-[#141414] border border-[#262626] pl-8 pr-3 text-xs text-white placeholder-[#666] outline-none focus:border-[#e5a93c]"
                    />
                  </div>
                </div>

                {(() => {
                  const filteredRetail = retailUsers.filter((u) => {
                    if (!requestSearch) return true;
                    const q = requestSearch.toLowerCase();
                    return (
                      u.name.toLowerCase().includes(q) ||
                      u.email.toLowerCase().includes(q) ||
                      (u.mobile && u.mobile.includes(q))
                    );
                  });

                  if (filteredRetail.length === 0) {
                    return (
                      <div className="p-12 text-center bg-[#0d0d0d] border border-[#222] rounded-[24px] space-y-2">
                        <Users className="w-10 h-10 mx-auto text-[#555]" />
                        <h4 className="text-white text-base font-serif font-medium">No Retail Customers Found</h4>
                        <p className="text-xs text-[#777]">Retail customers who verify OTP will appear here.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {filteredRetail.map((u) => (
                        <div
                          key={u.id}
                          className="p-4 rounded-[20px] bg-[#0d0d0d] border border-[#222] hover:border-[#333] transition-all space-y-2.5 shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-white font-semibold text-sm">{u.name}</h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Active • Instant Access
                            </span>
                          </div>
                          <div className="space-y-1 text-xs text-[#8e8e93]">
                            <p className="flex items-center gap-1.5 text-white/90">
                              <Mail className="w-3.5 h-3.5 text-[#e5a93c]" />
                              <span>{u.email}</span>
                            </p>
                            {u.mobile && u.mobile !== u.email && (
                              <p className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-[#e5a93c]" />
                                <span>+91 {u.mobile}</span>
                              </p>
                            )}
                            <p className="text-[11px] text-[#666] pt-1">
                              Registered: {new Date(u.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            ) : (
              <>
            {/* Header & Filter Controls for Wholesale */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0d0d0d] border border-[#222] p-4 rounded-[20px]">
              <div className="flex items-center gap-2 overflow-x-auto">
                {(["all", "pending", "approved", "rejected"] as const).map((filter) => {
                  const count =
                    filter === "all"
                      ? accountRequests.length
                      : accountRequests.filter((r) => r.status === filter).length;
                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setRequestFilter(filter)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-medium capitalize transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        requestFilter === filter
                          ? "bg-[#e5a93c] text-black font-semibold shadow-md"
                          : "bg-[#141414] border border-[#262626] text-[#8e8e93] hover:text-white"
                      }`}
                    >
                      <span>{filter === "all" ? "All Requests" : filter}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          requestFilter === filter
                            ? "bg-black/20 text-black"
                            : filter === "pending" && count > 0
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-[#222] text-[#777]"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search in Requests */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#777]" />
                <input
                  type="text"
                  placeholder="Search name, shop, or phone..."
                  value={requestSearch}
                  onChange={(e) => setRequestSearch(e.target.value)}
                  className="w-full h-9 rounded-xl bg-[#141414] border border-[#262626] pl-8 pr-3 text-xs text-white placeholder-[#666] outline-none focus:border-[#e5a93c]"
                />
              </div>
            </div>

            {/* Filtered Account Requests Cards / Table */}
            {(() => {
              const filtered = accountRequests.filter((req) => {
                if (requestFilter !== "all" && req.status !== requestFilter) return false;
                if (!requestSearch) return true;
                const q = requestSearch.toLowerCase();
                return (
                  req.name.toLowerCase().includes(q) ||
                  req.businessName.toLowerCase().includes(q) ||
                  req.mobile.includes(q) ||
                  req.email.toLowerCase().includes(q) ||
                  (req.instagramId && req.instagramId.toLowerCase().includes(q))
                );
              });

              if (filtered.length === 0) {
                return (
                  <div className="p-12 text-center bg-[#0d0d0d] border border-[#222] rounded-[24px] space-y-2">
                    <Users className="w-10 h-10 mx-auto text-[#555]" />
                    <h4 className="text-white text-base font-serif font-medium">No Account Requests</h4>
                    <p className="text-xs text-[#777]">
                      {requestFilter === "all"
                        ? "No wholesale applications have been received yet."
                        : `No ${requestFilter} wholesale applications found.`}
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filtered.map((req) => (
                    <div
                      key={req.id}
                      className="p-5 rounded-[22px] bg-[#0d0d0d] border border-[#222] hover:border-[#333] transition-all space-y-4 shadow-md"
                    >
                      {/* Top Header: Business Name & Status */}
                      <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#1c1c1c]">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-white font-semibold text-[15px]">
                              {req.businessName}
                            </h4>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold capitalize ${
                                req.status === "approved"
                                  ? "bg-emerald-950/80 border border-emerald-500/50 text-emerald-300"
                                  : req.status === "rejected"
                                  ? "bg-red-950/80 border border-red-500/50 text-red-300"
                                  : "bg-amber-950/80 border border-amber-500/50 text-amber-300 animate-pulse"
                              }`}
                            >
                              {req.status}
                            </span>
                          </div>
                          <p className="text-[#8e8e93] text-xs mt-0.5 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-[#e5a93c]" />
                            <span>{req.name}</span>
                            <span className="text-[#555]">•</span>
                            <span>
                              {new Date(req.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteRequest(req.id)}
                          title="Delete Request"
                          className="p-1.5 rounded-lg text-[#666] hover:text-red-400 hover:bg-red-950/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Contact Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-[#141414] border border-[#1f1f1f] flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[#a0a0a0]">
                            <Phone className="w-3.5 h-3.5 text-[#e5a93c]" />
                            <span>+91 {req.mobile}</span>
                          </div>
                          <a
                            href={`https://wa.me/91${req.mobile}?text=Hello%20${encodeURIComponent(
                              req.name
                            )}%2C%20this%20is%20Fab%20Creations%20regarding%20your%20wholesale%20account.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:underline flex items-center gap-0.5 font-medium"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>Chat</span>
                          </a>
                        </div>

                        <div className="p-2.5 rounded-xl bg-[#141414] border border-[#1f1f1f] flex items-center gap-2 text-[#a0a0a0] truncate">
                          <Mail className="w-3.5 h-3.5 text-[#e5a93c] shrink-0" />
                          <a
                            href={`mailto:${req.email}`}
                            className="hover:text-white truncate"
                            title={req.email}
                          >
                            {req.email}
                          </a>
                        </div>

                        {req.instagramId && (
                          <div className="p-2.5 rounded-xl bg-[#141414] border border-[#1f1f1f] flex items-center gap-2 text-[#a0a0a0] sm:col-span-2">
                            <Instagram className="w-3.5 h-3.5 text-[#e5a93c] shrink-0" />
                            <a
                              href={`https://instagram.com/${req.instagramId.replace("@", "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#e5a93c] hover:underline font-medium"
                            >
                              {req.instagramId.startsWith("@") ? req.instagramId : `@${req.instagramId}`}
                            </a>
                            <span className="text-[#666] text-[11px]">(Instagram Shop)</span>
                          </div>
                        )}
                      </div>

                      {req.rejectionReason && (
                        <div className="p-2 rounded-lg bg-red-950/30 border border-red-900/40 text-[11px] text-red-300">
                          Rejection Reason: {req.rejectionReason}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="pt-2 flex items-center gap-2 border-t border-[#1c1c1c]">
                        {req.status !== "approved" && (
                          <button
                            type="button"
                            onClick={() => handleApproveRequest(req.id)}
                            className="flex-1 py-2 px-3 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Approve Wholesale Account</span>
                          </button>
                        )}

                        {req.status !== "rejected" && (
                          <button
                            type="button"
                            onClick={() => handleRejectRequest(req.id)}
                            className="py-2 px-3 rounded-xl bg-[#181818] hover:bg-red-950/50 border border-[#2a2a2a] hover:border-red-600/50 text-[#8e8e93] hover:text-red-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Reject</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
            </>
          )}
          </div>
        )}
      </div>

      {/* ============================================================= */}
      {/* PRODUCT ADD / EDIT MODAL                                      */}
      {/* ============================================================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#0d0d0d] border border-[#d69e3d] rounded-[24px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#222]">
              <h3 className="text-white text-[18px] font-serif font-medium">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-[#8e8e93] hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProduct} className="space-y-4 pt-4 text-xs">
              {/* Image Upload Area with Drag & Drop */}
              <div>
                <label className="block text-[#a0a0a0] mb-2 font-medium">
                  Product Image (Drag & Drop or Click to Browse)
                </label>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />

                <div
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative w-full rounded-2xl p-4 border-2 border-dashed transition-all duration-200 cursor-pointer flex flex-col sm:flex-row items-center gap-4 select-none ${
                    isDraggingImage
                      ? "border-[#e5a93c] bg-[#1c160c] shadow-[0_0_20px_rgba(229,169,60,0.35)] scale-[1.01]"
                      : "border-[#2c2c2c] bg-[#111111] hover:border-[#e5a93c]/50 hover:bg-[#15120c]"
                  }`}
                >
                  {/* Image Preview / Upload Icon Thumbnail */}
                  <div className="w-20 h-20 rounded-xl bg-[#161616] border border-[#262626] overflow-hidden relative flex items-center justify-center shrink-0 shadow-inner">
                    {productForm.image ? (
                      <Image
                        src={productForm.image}
                        alt="Product Preview"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <Upload className={`w-7 h-7 transition-colors ${isDraggingImage ? "text-[#e5a93c] animate-bounce" : "text-[#555]"}`} />
                    )}
                    {isUploadingImage && (
                      <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-[#e5a93c]/30 border-t-[#e5a93c] rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Drop zone helper text and status */}
                  <div className="flex-1 text-center sm:text-left space-y-1">
                    {isUploadingImage ? (
                      <div>
                        <p className="text-[#e5a93c] font-semibold text-xs animate-pulse">
                          Uploading & optimizing image to Cloudflare R2...
                        </p>
                        <p className="text-[#777] text-[11px]">Converting to modern WebP</p>
                      </div>
                    ) : isDraggingImage ? (
                      <div>
                        <p className="text-[#e5a93c] font-semibold text-xs">
                          Drop image file here to upload!
                        </p>
                        <p className="text-[#aaa] text-[11px]">Release to start upload immediately</p>
                      </div>
                    ) : productForm.image ? (
                      <div>
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                          <span className="text-emerald-400 font-semibold text-xs flex items-center gap-1">
                            ✓ Image Ready
                          </span>
                          <span className="text-[10px] text-[#777]">· Drag new photo to replace</span>
                        </div>
                        <p className="text-[#888] text-[11px] truncate max-w-[260px]">
                          {productForm.image}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-white font-medium text-xs">
                          <span className="text-[#e5a93c] font-semibold">Drag & drop</span> image here, or <span className="text-[#e5a93c] underline">browse files</span>
                        </p>
                        <p className="text-[#777] text-[11px]">
                          Supports JPEG, PNG, WebP (auto-compressed and hosted on R2 CDN)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    type="button"
                    disabled={isUploadingImage}
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#1c160c] border border-[#e5a93c] text-[#e5a93c] hover:bg-[#e5a93c] hover:text-black font-semibold text-xs transition-all cursor-pointer shrink-0 disabled:opacity-50 shadow-sm"
                  >
                    {isUploadingImage ? "Uploading..." : productForm.image ? "Change Image" : "Select Image"}
                  </button>
                </div>
              </div>

              {/* Title & SKU */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#a0a0a0] mb-1 font-medium">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="e.g. Moon Necklace"
                    className="w-full h-10 rounded-xl bg-[#141414] border border-[#262626] px-3 text-white outline-none focus:border-[#e5a93c]"
                  />
                </div>

                <div>
                  <label className="block text-[#a0a0a0] mb-1 font-medium">SKU</label>
                  <input
                    type="text"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    placeholder="e.g. 979"
                    className="w-full h-10 rounded-xl bg-[#141414] border border-[#262626] px-3 text-white outline-none focus:border-[#e5a93c]"
                  />
                </div>
              </div>

              {/* Channel Availability (Both / Wholesale / Retail) */}
              <div className="space-y-1.5">
                <label className="block text-[#a0a0a0] font-medium text-xs">
                  Store Channel Availability *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "both", label: "Both Channels", sub: "Retail & Wholesale" },
                    { id: "wholesale", label: "Wholesale Only", sub: "B2B with login" },
                    { id: "retail", label: "Retail Only", sub: "Public (no login)" },
                  ].map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setProductForm({ ...productForm, channel: ch.id as any })}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        productForm.channel === ch.id
                          ? "border-[#e5a93c] bg-[#221808] text-white shadow-sm ring-1 ring-[#e5a93c]"
                          : "border-[#242424] bg-[#121212] text-[#8e8e93] hover:border-[#383838]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold text-[11.5px] text-white">{ch.label}</span>
                        {productForm.channel === ch.id && (
                          <span className="w-2 h-2 rounded-full bg-[#e5a93c]" />
                        )}
                      </div>
                      <span className="text-[10px] text-[#777]">{ch.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dual Price Boxes: Retail Price & Wholesale Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#a0a0a0] mb-1 font-medium">
                    Retail Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={productForm.retailPrice}
                    onChange={(e) => setProductForm({ ...productForm, retailPrice: e.target.value })}
                    placeholder="e.g. 299"
                    className="w-full h-10 rounded-xl bg-[#141414] border border-[#262626] px-3 text-white outline-none focus:border-[#e5a93c]"
                  />
                  <p className="text-[10.5px] text-[#666] mt-0.5">Public price (No login)</p>
                </div>

                <div>
                  <label className="block text-[#a0a0a0] mb-1 font-medium">
                    Wholesale Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={productForm.wholesalePrice}
                    onChange={(e) => setProductForm({ ...productForm, wholesalePrice: e.target.value })}
                    placeholder="e.g. 80"
                    className="w-full h-10 rounded-xl bg-[#141414] border border-[#262626] px-3 text-white outline-none focus:border-[#e5a93c]"
                  />
                  <p className="text-[10.5px] text-[#666] mt-0.5">B2B price (OTP login)</p>
                </div>
              </div>

              {/* Category */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[#a0a0a0] font-medium">Category *</label>
                  <button
                    type="button"
                    onClick={() => setIsCustomCategory(!isCustomCategory)}
                    className="text-[11px] text-[#e5a93c] hover:underline cursor-pointer"
                  >
                    {isCustomCategory ? "Select existing" : "+ New category"}
                  </button>
                </div>
                {isCustomCategory || categories.length === 0 ? (
                  <input
                    type="text"
                    required
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    placeholder="Type category (e.g. Chains, Rings)"
                    className="w-full h-10 rounded-xl bg-[#141414] border border-[#262626] px-3 text-white outline-none focus:border-[#e5a93c]"
                  />
                ) : (
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full h-10 rounded-xl bg-[#141414] border border-[#262626] px-3 text-white outline-none focus:border-[#e5a93c] cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Stock & Subtitle */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#a0a0a0] mb-1 font-medium">Stock Units</label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="w-full h-10 rounded-xl bg-[#141414] border border-[#262626] px-3 text-white outline-none focus:border-[#e5a93c]"
                  />
                </div>

                <div>
                  <label className="block text-[#a0a0a0] mb-1 font-medium">Subtitle / Tagline</label>
                  <input
                    type="text"
                    value={productForm.subtitle}
                    onChange={(e) => setProductForm({ ...productForm, subtitle: e.target.value })}
                    placeholder="e.g. Anti tarnish"
                    className="w-full h-10 rounded-xl bg-[#141414] border border-[#262626] px-3 text-white outline-none focus:border-[#e5a93c]"
                  />
                </div>
              </div>

              {/* Metal & Occasion */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#a0a0a0] mb-1 font-medium">Metal Type</label>
                  <input
                    type="text"
                    value={productForm.metal}
                    onChange={(e) => setProductForm({ ...productForm, metal: e.target.value })}
                    placeholder="e.g. Stainless Steel"
                    className="w-full h-10 rounded-xl bg-[#141414] border border-[#262626] px-3 text-white outline-none focus:border-[#e5a93c]"
                  />
                </div>

                <div>
                  <label className="block text-[#a0a0a0] mb-1 font-medium">Occasion</label>
                  <input
                    type="text"
                    value={productForm.occasion}
                    onChange={(e) => setProductForm({ ...productForm, occasion: e.target.value })}
                    placeholder="e.g. Daily Wear"
                    className="w-full h-10 rounded-xl bg-[#141414] border border-[#262626] px-3 text-white outline-none focus:border-[#e5a93c]"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-[#e5a93c] to-[#f5c767] text-black font-semibold text-xs flex items-center justify-center gap-2 hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer shadow-lg"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{editingProduct ? "Update Product" : "Save Product to Store"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
