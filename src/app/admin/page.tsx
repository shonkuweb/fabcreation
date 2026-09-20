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
} from "lucide-react";
import { Product, Category, Order } from "@/lib/db";

const R2_BASE = "https://pub-ce8688bc6c654bcfb99716f7c9373bcd.r2.dev/fab-creations";
const LOGO_R2_URL = `${R2_BASE}/logo.png`;

export default function AdminPage() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Admin Tab: "overview" | "products" | "categories" | "orders"
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "categories" | "orders">("products");

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
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
      const [prodRes, catRes, ordRes] = await Promise.all([
        fetch("/api/products", { cache: "no-store" }),
        fetch("/api/categories", { cache: "no-store" }),
        fetch("/api/orders", { cache: "no-store" }),
      ]);

      const [prodData, catData, ordData] = await Promise.all([
        prodRes.json(),
        catRes.json(),
        ordRes.json(),
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
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Image Upload to R2
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
        showNotification("Image uploaded to Cloudflare R2!");
      } else {
        alert("Image upload failed: " + data.message);
      }
    } catch {
      alert("Error uploading image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Save Product (Add or Edit)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) {
      alert("Please fill in Product Name and Price");
      return;
    }

    try {
      if (editingProduct) {
        // Update
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productForm),
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
          body: JSON.stringify(productForm),
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
    setProductForm({
      name: p.name,
      sku: p.sku,
      price: String(p.price),
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
            { id: "overview", label: "Overview", icon: <TrendingUp className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
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
                      <th className="py-3 px-3">B2B Price</th>
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

                        {/* Price */}
                        <td className="py-3 px-3 text-[#f5c767] font-semibold text-[13px]">
                          ₹{p.price}
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
        {activeTab === "orders" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white text-[16px] font-serif font-medium">
                Customer Orders ({orders.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-[#0d0d0d] border border-[#222222] rounded-[20px] p-5 shadow-md flex flex-col justify-between space-y-4"
                >
                  {/* Header: Order # + Date */}
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[#e5a93c] font-mono font-semibold text-sm">
                        {ord.orderNumber}
                      </span>
                      <p className="text-[#8e8e93] text-xs pt-0.5">
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
                      <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-[#1c1c1c] last:border-0">
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
                        <span className="text-[#f5c767] font-medium">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="pt-2 border-t border-[#1f1f1f] flex items-center justify-between text-xs">
                    <span className="text-[#8e8e93]">Subtotal: ₹{ord.subtotal} | Shipping: ₹{ord.shipping}</span>
                    <span className="text-white text-sm font-semibold">Total: ₹{ord.total}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
                • <strong>Orders</strong>: View incoming buyer orders with phone numbers and mark them as Confirmed, Dispatched, or Delivered.
              </p>
            </div>
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
              {/* Image Upload Area */}
              <div>
                <label className="block text-[#a0a0a0] mb-2 font-medium">Product Image (Upload to Cloudflare R2)</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-[#141414] border border-[#262626] overflow-hidden relative flex items-center justify-center shrink-0">
                    {productForm.image ? (
                      <Image
                        src={productForm.image}
                        alt="Preview"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <Upload className="w-6 h-6 text-[#555]" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isUploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-[#171207] border border-[#e5a93c] text-[#e5a93c] hover:bg-[#e5a93c] hover:text-black font-semibold text-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isUploadingImage ? "Uploading to R2..." : "Select & Upload Image"}
                    </button>
                    <p className="text-[#666] text-[11px]">
                      Upload directly to your R2 bucket for instant CDN delivery
                    </p>
                  </div>
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

              {/* Price & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#a0a0a0] mb-1 font-medium">B2B Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="e.g. 80"
                    className="w-full h-10 rounded-xl bg-[#141414] border border-[#262626] px-3 text-white outline-none focus:border-[#e5a93c]"
                  />
                </div>

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
