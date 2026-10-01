import fs from "fs";
import path from "path";

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  retailPrice?: number;
  wholesalePrice?: number;
  channel?: "both" | "wholesale" | "retail";
  category: string;
  image: string;
  stock: number;
  metal: string;
  target: string;
  occasion: string;
  rating: number;
  reviewsCount: number;
  subtitle: string;
  featured: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  orderType: "wholesale" | "retail";
  customerMobile: string;
  customerName?: string;
  items: OrderItem[];
  subtotal: number;
  gst: number;
  shipping: number;
  total: number;
  status: "Pending" | "Confirmed" | "Dispatched" | "Delivered";
  createdAt: string;
}

export interface UserAddress {
  id: string;
  businessName?: string;
  contactName: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  gstin?: string;
}

export interface UserAccount {
  id: string;
  accountType: "wholesale" | "retail";
  mobile: string;
  name: string;
  email?: string;
  companyName?: string;
  gstin?: string;
  addresses: UserAddress[];
  createdAt: string;
  updatedAt: string;
}

export interface DbCart {
  id: string;
  accountType: "wholesale" | "retail";
  userKey: string; // mobile or guest id
  items: OrderItem[];
  updatedAt: string;
}

export interface DbWishlist {
  id: string;
  accountType: "wholesale" | "retail";
  userKey: string;
  productIds: string[];
  updatedAt: string;
}

export interface WholesaleApplication {
  id: string;
  name: string;
  businessName: string;
  email: string;
  instagramId?: string;
  mobile: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseData {
  products: Product[];
  categories: Category[];
  orders: Order[];
  users: UserAccount[];
  carts: DbCart[];
  wishlists: DbWishlist[];
  wholesaleApplications: WholesaleApplication[];
}

const DB_DIR = process.env.DATABASE_DIR
  ? path.resolve(process.env.DATABASE_DIR)
  : path.resolve(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "database.json");

// Initial Seed Data
const defaultData: DatabaseData = {
  products: [],
  categories: [],
  orders: [],
  users: [],
  carts: [],
  wishlists: [],
  wholesaleApplications: [],
};

// In-memory RAM cache for 0ms read operations
let cachedDb: DatabaseData | null = null;

// Ensure database file exists and load into memory
function getDb(): DatabaseData {
  if (cachedDb) {
    return cachedDb;
  }

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true, mode: 0o777 });
  }

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), "utf-8");
    cachedDb = { ...defaultData };
    return cachedDb;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    const rawProducts = Array.isArray(parsed.products) ? parsed.products : [];
    const normalizedProducts: Product[] = rawProducts.map((p: any) => {
      const rPrice =
        typeof p.retailPrice === "number"
          ? p.retailPrice
          : typeof p.price === "number"
          ? p.price
          : 0;
      const wPrice =
        typeof p.wholesalePrice === "number"
          ? p.wholesalePrice
          : typeof p.price === "number"
          ? p.price
          : 0;
      return {
        ...p,
        channel: p.channel || "both",
        retailPrice: rPrice,
        wholesalePrice: wPrice,
        price: rPrice || wPrice || 0,
      };
    });

    const rawOrders = Array.isArray(parsed.orders) ? parsed.orders : [];
    const normalizedOrders: Order[] = rawOrders.map((o: any) => ({
      ...o,
      orderType: o.orderType || "retail",
    }));

    cachedDb = {
      products: normalizedProducts,
      categories: Array.isArray(parsed.categories) ? parsed.categories : [],
      orders: normalizedOrders,
      users: Array.isArray(parsed.users) ? parsed.users : [],
      carts: Array.isArray(parsed.carts) ? parsed.carts : [],
      wishlists: Array.isArray(parsed.wishlists) ? parsed.wishlists : [],
      wholesaleApplications: Array.isArray(parsed.wholesaleApplications)
        ? parsed.wholesaleApplications
        : [],
    };
    return cachedDb;
  } catch {
    cachedDb = {
      products: [],
      categories: [],
      orders: [],
      users: [],
      carts: [],
      wishlists: [],
      wholesaleApplications: [],
    };
    return cachedDb;
  }
}

function saveDb(data: DatabaseData): void {
  // Update RAM cache immediately for 0ms read and consistency
  cachedDb = data;
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true, mode: 0o777 });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`[DB Error] Failed to write database to ${DB_FILE}:`, err);
    try {
      if (fs.existsSync(DB_FILE)) {
        fs.chmodSync(DB_FILE, 0o666);
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (retryErr) {
      console.warn(`[DB Warning] Retained changes in RAM cache due to disk write issue:`, retryErr);
    }
  }
}

// ---------------- PRODUCTS ----------------
export function getProducts(): Product[] {
  return getDb().products;
}

export function getProductById(id: string): Product | undefined {
  return getDb().products.find((p) => p.id === id);
}

export function createProduct(productData: Omit<Product, "id" | "createdAt">): Product {
  const db = getDb();
  const retailPrice = Number(productData.retailPrice ?? productData.price ?? 0);
  const wholesalePrice = Number(productData.wholesalePrice ?? productData.price ?? retailPrice ?? 0);
  const newProduct: Product = {
    ...productData,
    retailPrice,
    wholesalePrice,
    channel: productData.channel || "both",
    price: retailPrice || wholesalePrice,
    id: `prod-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  db.products.unshift(newProduct);
  saveDb(db);
  return newProduct;
}

export function updateProduct(id: string, updates: Partial<Product>): Product | null {
  const db = getDb();
  const index = db.products.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const current = db.products[index];
  const nextRetail = updates.retailPrice !== undefined ? Number(updates.retailPrice) : current.retailPrice;
  const nextWholesale = updates.wholesalePrice !== undefined ? Number(updates.wholesalePrice) : current.wholesalePrice;
  const nextPrice = nextRetail ?? nextWholesale ?? updates.price ?? current.price;

  db.products[index] = {
    ...current,
    ...updates,
    retailPrice: nextRetail,
    wholesalePrice: nextWholesale,
    price: nextPrice,
    channel: updates.channel || current.channel || "both",
  };
  saveDb(db);
  return db.products[index];
}

export function deleteProduct(id: string): boolean {
  const db = getDb();
  const initialLength = db.products.length;
  db.products = db.products.filter((p) => p.id !== id);
  if (db.products.length !== initialLength) {
    saveDb(db);
    return true;
  }
  return false;
}

// ---------------- CATEGORIES ----------------
export function getCategories(): Category[] {
  return getDb().categories;
}

export function createCategory(name: string): Category {
  const db = getDb();
  const trimmed = name.trim();
  const existing = db.categories.find(
    (c) => c.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (existing) {
    return existing;
  }

  const newCategory: Category = {
    id: `cat-${Date.now()}`,
    name: trimmed,
    createdAt: new Date().toISOString(),
  };
  db.categories.push(newCategory);
  saveDb(db);
  return newCategory;
}

export function deleteCategory(id: string): boolean {
  const db = getDb();
  const initialLength = db.categories.length;
  db.categories = db.categories.filter((c) => c.id !== id);
  if (db.categories.length !== initialLength) {
    saveDb(db);
    return true;
  }
  return false;
}

// ---------------- ORDERS ----------------
export function getOrders(orderType?: "wholesale" | "retail", customerMobile?: string): Order[] {
  let list = getDb().orders;
  if (orderType) {
    list = list.filter((o) => o.orderType === orderType);
  }
  if (customerMobile) {
    list = list.filter((o) => o.customerMobile === customerMobile);
  }
  return list;
}

export function createOrder(orderData: Omit<Order, "id" | "orderNumber" | "createdAt">): Order {
  const db = getDb();
  const orderNumber = `FC-${1000 + db.orders.length + 1}`;
  const newOrder: Order = {
    ...orderData,
    orderType: orderData.orderType || "retail",
    id: `ord-${Date.now()}`,
    orderNumber,
    createdAt: new Date().toISOString(),
  };
  db.orders.unshift(newOrder);
  saveDb(db);
  return newOrder;
}

export function updateOrderStatus(
  id: string,
  status: "Pending" | "Confirmed" | "Dispatched" | "Delivered"
): Order | null {
  const db = getDb();
  const order = db.orders.find((o) => o.id === id);
  if (!order) return null;

  order.status = status;
  saveDb(db);
  return order;
}

export function deleteOrder(id: string): boolean {
  const db = getDb();
  const initialLength = db.orders.length;
  db.orders = db.orders.filter((o) => o.id !== id);
  if (db.orders.length !== initialLength) {
    saveDb(db);
    return true;
  }
  return false;
}

// ---------------- USERS & ACCOUNTS (DATABASE-BACKED) ----------------
export function getUserAccount(
  accountType: "wholesale" | "retail",
  mobile: string
): UserAccount | null {
  const db = getDb();
  const cleanMobile = mobile.trim();
  const user = db.users.find(
    (u) => u.accountType === accountType && u.mobile === cleanMobile
  );
  return user || null;
}

export function upsertUserAccount(
  accountType: "wholesale" | "retail",
  mobile: string,
  data: Partial<UserAccount>
): UserAccount {
  const db = getDb();
  const cleanMobile = mobile.trim();
  const index = db.users.findIndex(
    (u) => u.accountType === accountType && u.mobile === cleanMobile
  );
  const now = new Date().toISOString();

  if (index > -1) {
    const existing = db.users[index];
    const updated: UserAccount = {
      ...existing,
      ...data,
      accountType,
      mobile: cleanMobile,
      updatedAt: now,
    };
    db.users[index] = updated;
    saveDb(db);
    return updated;
  } else {
    const newUser: UserAccount = {
      id: `usr-${accountType}-${Date.now()}`,
      accountType,
      mobile: cleanMobile,
      name: data.name || (accountType === "wholesale" ? "Wholesale Partner" : "Retail Customer"),
      email: data.email || "",
      companyName: data.companyName || "",
      gstin: data.gstin || "",
      addresses: data.addresses || [],
      createdAt: now,
      updatedAt: now,
    };
    db.users.push(newUser);
    saveDb(db);
    return newUser;
  }
}

export function getUserAccounts(accountType?: "wholesale" | "retail"): UserAccount[] {
  const list = getDb().users;
  if (accountType) {
    return list.filter((u) => u.accountType === accountType);
  }
  return list;
}

// ---------------- CARTS (DATABASE-BACKED) ----------------
export function getDbCart(
  accountType: "wholesale" | "retail",
  userKey: string
): OrderItem[] {
  const db = getDb();
  const key = (userKey || "guest").trim();
  const found = db.carts.find(
    (c) => c.accountType === accountType && c.userKey === key
  );
  return found ? found.items : [];
}

export function saveDbCart(
  accountType: "wholesale" | "retail",
  userKey: string,
  items: OrderItem[]
): DbCart {
  const db = getDb();
  const key = (userKey || "guest").trim();
  const now = new Date().toISOString();
  const index = db.carts.findIndex(
    (c) => c.accountType === accountType && c.userKey === key
  );

  if (index > -1) {
    db.carts[index].items = items;
    db.carts[index].updatedAt = now;
    saveDb(db);
    return db.carts[index];
  } else {
    const newCart: DbCart = {
      id: `cart-${accountType}-${Date.now()}`,
      accountType,
      userKey: key,
      items,
      updatedAt: now,
    };
    db.carts.push(newCart);
    saveDb(db);
    return newCart;
  }
}

export function clearDbCart(
  accountType: "wholesale" | "retail",
  userKey: string
): void {
  const db = getDb();
  const key = (userKey || "guest").trim();
  db.carts = db.carts.filter(
    (c) => !(c.accountType === accountType && c.userKey === key)
  );
  saveDb(db);
}

// ---------------- WISHLISTS (DATABASE-BACKED) ----------------
export function getDbWishlist(
  accountType: "wholesale" | "retail",
  userKey: string
): string[] {
  const db = getDb();
  const key = (userKey || "guest").trim();
  const found = db.wishlists.find(
    (w) => w.accountType === accountType && w.userKey === key
  );
  return found ? found.productIds : [];
}

export function saveDbWishlist(
  accountType: "wholesale" | "retail",
  userKey: string,
  productIds: string[]
): DbWishlist {
  const db = getDb();
  const key = (userKey || "guest").trim();
  const now = new Date().toISOString();
  const index = db.wishlists.findIndex(
    (w) => w.accountType === accountType && w.userKey === key
  );

  if (index > -1) {
    db.wishlists[index].productIds = productIds;
    db.wishlists[index].updatedAt = now;
    saveDb(db);
    return db.wishlists[index];
  } else {
    const newW: DbWishlist = {
      id: `wish-${accountType}-${Date.now()}`,
      accountType,
      userKey: key,
      productIds,
      updatedAt: now,
    };
    db.wishlists.push(newW);
    saveDb(db);
    return newW;
  }
}

// ---------------- WHOLESALE APPLICATIONS (B2B APPROVAL SYSTEM) ----------------
export function getWholesaleApplications(
  status?: "pending" | "approved" | "rejected",
  mobile?: string
): WholesaleApplication[] {
  const db = getDb();
  let list = db.wholesaleApplications || [];
  if (status) {
    list = list.filter((a) => a.status === status);
  }
  if (mobile) {
    const clean = mobile.replace(/\D/g, "");
    list = list.filter((a) => a.mobile.replace(/\D/g, "") === clean);
  }
  return list.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getWholesaleApplicationByMobile(
  mobile: string
): WholesaleApplication | null {
  const list = getWholesaleApplications(undefined, mobile);
  return list.length > 0 ? list[0] : null;
}

export function createWholesaleApplication(data: {
  name: string;
  businessName: string;
  email: string;
  instagramId?: string;
  mobile: string;
}): WholesaleApplication {
  const db = getDb();
  db.wholesaleApplications = db.wholesaleApplications || [];
  const cleanMobile = data.mobile.replace(/\D/g, "");
  const now = new Date().toISOString();

  // If already exists with this mobile, update existing application
  const existingIndex = db.wholesaleApplications.findIndex(
    (a) => a.mobile.replace(/\D/g, "") === cleanMobile
  );

  if (existingIndex > -1) {
    const existing = db.wholesaleApplications[existingIndex];
    // If it was rejected or pending, refresh it
    const newStatus = existing.status === "approved" ? "approved" : "pending";
    const updated: WholesaleApplication = {
      ...existing,
      name: data.name.trim() || existing.name,
      businessName: data.businessName.trim() || existing.businessName,
      email: data.email.trim() || existing.email,
      instagramId: data.instagramId?.trim() || existing.instagramId,
      status: newStatus,
      updatedAt: now,
    };
    db.wholesaleApplications[existingIndex] = updated;
    saveDb(db);
    return updated;
  }

  const newApp: WholesaleApplication = {
    id: `ws-app-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: data.name.trim(),
    businessName: data.businessName.trim(),
    email: data.email.trim(),
    instagramId: data.instagramId?.trim() || "",
    mobile: cleanMobile,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  db.wholesaleApplications.push(newApp);
  saveDb(db);
  return newApp;
}

export function updateWholesaleApplicationStatus(
  id: string,
  status: "pending" | "approved" | "rejected",
  reason?: string
): WholesaleApplication | null {
  const db = getDb();
  db.wholesaleApplications = db.wholesaleApplications || [];
  const index = db.wholesaleApplications.findIndex((a) => a.id === id);
  if (index === -1) return null;

  const now = new Date().toISOString();
  db.wholesaleApplications[index].status = status;
  if (reason !== undefined) {
    db.wholesaleApplications[index].rejectionReason = reason;
  }
  db.wholesaleApplications[index].updatedAt = now;
  saveDb(db);
  return db.wholesaleApplications[index];
}

export function deleteWholesaleApplication(id: string): boolean {
  const db = getDb();
  db.wholesaleApplications = db.wholesaleApplications || [];
  const beforeLen = db.wholesaleApplications.length;
  db.wholesaleApplications = db.wholesaleApplications.filter((a) => a.id !== id);
  if (db.wholesaleApplications.length !== beforeLen) {
    saveDb(db);
    return true;
  }
  return false;
}
