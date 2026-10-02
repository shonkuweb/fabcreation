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
  customerEmail?: string;
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

export interface RetailUser {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  addresses: UserAddress[];
  createdAt: string;
  updatedAt: string;
}

export interface WholesaleUser {
  id: string;
  name: string;
  businessName: string;
  mobile: string;
  email: string;
  gstin?: string;
  instagramId?: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  addresses: UserAddress[];
  createdAt: string;
  updatedAt: string;
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
  retailUsers: RetailUser[];
  wholesaleUsers: WholesaleUser[];
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
  retailUsers: [],
  wholesaleUsers: [],
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

    // Retail Users Table
    let retailUsers: RetailUser[] = [];
    if (Array.isArray(parsed.retailUsers)) {
      retailUsers = parsed.retailUsers;
    } else if (Array.isArray(parsed.users)) {
      retailUsers = parsed.users
        .filter((u: any) => u.accountType === "retail")
        .map((u: any) => ({
          id: u.id || `ret-usr-${Date.now()}`,
          name: u.name || "Customer",
          email: u.email || u.mobile || "",
          mobile: u.mobile || "",
          addresses: Array.isArray(u.addresses) ? u.addresses : [],
          createdAt: u.createdAt || new Date().toISOString(),
          updatedAt: u.updatedAt || new Date().toISOString(),
        }));
    }

    // Wholesale Users Table
    let wholesaleUsers: WholesaleUser[] = [];
    if (Array.isArray(parsed.wholesaleUsers)) {
      wholesaleUsers = parsed.wholesaleUsers;
    } else if (Array.isArray(parsed.wholesaleApplications)) {
      wholesaleUsers = parsed.wholesaleApplications.map((a: any) => ({
        id: a.id || `ws-usr-${Date.now()}`,
        name: a.name || "",
        businessName: a.businessName || "",
        mobile: a.mobile || "",
        email: a.email || "",
        gstin: a.gstin || "",
        instagramId: a.instagramId || "",
        status: a.status || "pending",
        rejectionReason: a.rejectionReason,
        addresses: [],
        createdAt: a.createdAt || new Date().toISOString(),
        updatedAt: a.updatedAt || new Date().toISOString(),
      }));
    }

    cachedDb = {
      products: normalizedProducts,
      categories: Array.isArray(parsed.categories) ? parsed.categories : [],
      orders: normalizedOrders,
      retailUsers,
      wholesaleUsers,
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
      retailUsers: [],
      wholesaleUsers: [],
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

// ---------------- RETAIL USERS (SEPARATE DATABASE TABLE) ----------------
export function getRetailUsers(): RetailUser[] {
  return getDb().retailUsers || [];
}

export function getRetailUserByEmail(email: string): RetailUser | null {
  const db = getDb();
  const cleanEmail = email.trim().toLowerCase();
  const user = (db.retailUsers || []).find(
    (u) => (u.email || "").trim().toLowerCase() === cleanEmail
  );
  return user || null;
}

export function getRetailUserById(id: string): RetailUser | null {
  const db = getDb();
  return (db.retailUsers || []).find((u) => u.id === id) || null;
}

export function upsertRetailUser(data: {
  name: string;
  email: string;
  mobile?: string;
  addresses?: UserAddress[];
}): RetailUser {
  const db = getDb();
  db.retailUsers = db.retailUsers || [];
  const cleanEmail = (data.email || "").trim().toLowerCase();
  const now = new Date().toISOString();

  const index = db.retailUsers.findIndex(
    (u) => (u.email || "").trim().toLowerCase() === cleanEmail
  );

  if (index > -1) {
    const existing = db.retailUsers[index];
    const updated: RetailUser = {
      ...existing,
      name: data.name.trim() || existing.name,
      mobile: data.mobile?.trim() || existing.mobile || "",
      addresses: Array.isArray(data.addresses) ? data.addresses : existing.addresses,
      updatedAt: now,
    };
    db.retailUsers[index] = updated;
    saveDb(db);
    return updated;
  }

  const newUser: RetailUser = {
    id: `ret-usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: data.name.trim() || "Retail Customer",
    email: cleanEmail,
    mobile: data.mobile?.trim() || "",
    addresses: Array.isArray(data.addresses) ? data.addresses : [],
    createdAt: now,
    updatedAt: now,
  };
  db.retailUsers.push(newUser);
  saveDb(db);
  return newUser;
}

export function deleteRetailUser(id: string): boolean {
  const db = getDb();
  db.retailUsers = db.retailUsers || [];
  const beforeLen = db.retailUsers.length;
  db.retailUsers = db.retailUsers.filter((u) => u.id !== id);
  if (db.retailUsers.length !== beforeLen) {
    saveDb(db);
    return true;
  }
  return false;
}

// ---------------- UNIFIED BRIDGE FOR COMPATIBILITY ----------------
export function getUserAccount(
  accountType: "wholesale" | "retail",
  key: string
): UserAccount | null {
  const db = getDb();
  const cleanKey = key.trim().toLowerCase();

  if (accountType === "retail") {
    const retUser = (db.retailUsers || []).find(
      (u) =>
        (u.email || "").trim().toLowerCase() === cleanKey ||
        (u.mobile || "").trim() === cleanKey
    );
    if (!retUser) return null;
    return {
      id: retUser.id,
      accountType: "retail",
      name: retUser.name,
      email: retUser.email,
      mobile: retUser.mobile || retUser.email,
      addresses: retUser.addresses || [],
      createdAt: retUser.createdAt,
      updatedAt: retUser.updatedAt,
    };
  } else {
    const cleanMobile = key.replace(/\D/g, "");
    const wsUser = (db.wholesaleUsers || []).find(
      (u) =>
        u.mobile.replace(/\D/g, "") === cleanMobile ||
        (u.email || "").trim().toLowerCase() === cleanKey
    );
    if (!wsUser) return null;
    return {
      id: wsUser.id,
      accountType: "wholesale",
      name: wsUser.name,
      companyName: wsUser.businessName,
      email: wsUser.email,
      mobile: wsUser.mobile,
      gstin: wsUser.gstin,
      addresses: wsUser.addresses || [],
      createdAt: wsUser.createdAt,
      updatedAt: wsUser.updatedAt,
    };
  }
}

export function upsertUserAccount(
  accountType: "wholesale" | "retail",
  key: string,
  data: Partial<UserAccount>
): UserAccount {
  if (accountType === "retail") {
    const email = data.email || (key.includes("@") ? key : "");
    const updated = upsertRetailUser({
      name: data.name || "Retail Customer",
      email: email || key,
      mobile: data.mobile,
      addresses: data.addresses,
    });
    return {
      id: updated.id,
      accountType: "retail",
      name: updated.name,
      email: updated.email,
      mobile: updated.mobile || updated.email,
      addresses: updated.addresses,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  } else {
    const cleanMobile = (data.mobile || key).replace(/\D/g, "");
    const wsUser = createWholesaleUser({
      name: data.name || "Wholesale Partner",
      businessName: data.companyName || "Wholesale Business",
      email: data.email || "",
      mobile: cleanMobile,
      gstin: data.gstin,
    });
    return {
      id: wsUser.id,
      accountType: "wholesale",
      name: wsUser.name,
      companyName: wsUser.businessName,
      email: wsUser.email,
      mobile: wsUser.mobile,
      gstin: wsUser.gstin,
      addresses: wsUser.addresses || [],
      createdAt: wsUser.createdAt,
      updatedAt: wsUser.updatedAt,
    };
  }
}

export function getUserAccounts(accountType?: "wholesale" | "retail"): UserAccount[] {
  const db = getDb();
  if (accountType === "retail") {
    return (db.retailUsers || []).map((u) => ({
      id: u.id,
      accountType: "retail",
      name: u.name,
      email: u.email,
      mobile: u.mobile || u.email,
      addresses: u.addresses || [],
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));
  }
  if (accountType === "wholesale") {
    return (db.wholesaleUsers || []).map((u) => ({
      id: u.id,
      accountType: "wholesale",
      name: u.name,
      companyName: u.businessName,
      email: u.email,
      mobile: u.mobile,
      gstin: u.gstin,
      addresses: u.addresses || [],
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));
  }
  return [
    ...(db.retailUsers || []).map((u) => ({
      id: u.id,
      accountType: "retail" as const,
      name: u.name,
      email: u.email,
      mobile: u.mobile || u.email,
      addresses: u.addresses || [],
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    })),
    ...(db.wholesaleUsers || []).map((u) => ({
      id: u.id,
      accountType: "wholesale" as const,
      name: u.name,
      companyName: u.businessName,
      email: u.email,
      mobile: u.mobile,
      gstin: u.gstin,
      addresses: u.addresses || [],
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    })),
  ];
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

// ---------------- WHOLESALE USERS (SEPARATE DATABASE TABLE) ----------------
export function getWholesaleUsers(
  status?: "pending" | "approved" | "rejected",
  mobile?: string
): WholesaleUser[] {
  const db = getDb();
  let list = db.wholesaleUsers || [];
  if (status) {
    list = list.filter((u) => u.status === status);
  }
  if (mobile) {
    const clean = mobile.replace(/\D/g, "");
    list = list.filter((u) => u.mobile.replace(/\D/g, "") === clean);
  }
  return list.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getWholesaleUserByMobile(mobile: string): WholesaleUser | null {
  const list = getWholesaleUsers(undefined, mobile);
  return list.length > 0 ? list[0] : null;
}

export function getWholesaleUserByEmail(email: string): WholesaleUser | null {
  const db = getDb();
  const cleanEmail = (email || "").trim().toLowerCase();
  const found = (db.wholesaleUsers || []).find(
    (u) => (u.email || "").trim().toLowerCase() === cleanEmail
  );
  return found || null;
}

export function createWholesaleUser(data: {
  name: string;
  businessName: string;
  email: string;
  mobile: string;
  gstin?: string;
  instagramId?: string;
}): WholesaleUser {
  const db = getDb();
  db.wholesaleUsers = db.wholesaleUsers || [];
  const cleanMobile = data.mobile.replace(/\D/g, "");
  const cleanEmail = (data.email || "").trim().toLowerCase();
  const now = new Date().toISOString();

  // If already exists with this mobile, update existing record
  const existingIndex = db.wholesaleUsers.findIndex(
    (u) => u.mobile.replace(/\D/g, "") === cleanMobile
  );

  if (existingIndex > -1) {
    const existing = db.wholesaleUsers[existingIndex];
    const updated: WholesaleUser = {
      ...existing,
      name: data.name.trim() || existing.name,
      businessName: data.businessName.trim() || existing.businessName,
      email: cleanEmail || existing.email,
      gstin: data.gstin?.trim() || existing.gstin || "",
      instagramId: data.instagramId?.trim() || existing.instagramId || "",
      status: existing.status === "approved" ? "approved" : "pending",
      updatedAt: now,
    };
    db.wholesaleUsers[existingIndex] = updated;
    db.wholesaleApplications = db.wholesaleUsers.map((w) => ({
      id: w.id,
      name: w.name,
      businessName: w.businessName,
      email: w.email,
      instagramId: w.instagramId,
      mobile: w.mobile,
      status: w.status,
      rejectionReason: w.rejectionReason,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
    }));
    saveDb(db);
    return updated;
  }

  const newUser: WholesaleUser = {
    id: `ws-usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: data.name.trim(),
    businessName: data.businessName.trim(),
    email: cleanEmail,
    mobile: cleanMobile,
    gstin: data.gstin?.trim() || "",
    instagramId: data.instagramId?.trim() || "",
    status: "pending",
    addresses: [],
    createdAt: now,
    updatedAt: now,
  };

  db.wholesaleUsers.push(newUser);
  db.wholesaleApplications = db.wholesaleUsers.map((w) => ({
    id: w.id,
    name: w.name,
    businessName: w.businessName,
    email: w.email,
    instagramId: w.instagramId,
    mobile: w.mobile,
    status: w.status,
    rejectionReason: w.rejectionReason,
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
  }));
  saveDb(db);
  return newUser;
}

export function updateWholesaleUserStatus(
  id: string,
  status: "pending" | "approved" | "rejected",
  reason?: string
): WholesaleUser | null {
  const db = getDb();
  db.wholesaleUsers = db.wholesaleUsers || [];
  const index = db.wholesaleUsers.findIndex((u) => u.id === id);
  if (index === -1) return null;

  const now = new Date().toISOString();
  db.wholesaleUsers[index].status = status;
  if (reason !== undefined) {
    db.wholesaleUsers[index].rejectionReason = reason;
  }
  db.wholesaleUsers[index].updatedAt = now;

  db.wholesaleApplications = db.wholesaleUsers.map((w) => ({
    id: w.id,
    name: w.name,
    businessName: w.businessName,
    email: w.email,
    instagramId: w.instagramId,
    mobile: w.mobile,
    status: w.status,
    rejectionReason: w.rejectionReason,
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
  }));
  saveDb(db);
  return db.wholesaleUsers[index];
}

export function updateWholesaleUser(
  id: string,
  updates: Partial<WholesaleUser>
): WholesaleUser | null {
  const db = getDb();
  db.wholesaleUsers = db.wholesaleUsers || [];
  const index = db.wholesaleUsers.findIndex((u) => u.id === id);
  if (index === -1) return null;

  const now = new Date().toISOString();
  db.wholesaleUsers[index] = {
    ...db.wholesaleUsers[index],
    ...updates,
    updatedAt: now,
  };
  saveDb(db);
  return db.wholesaleUsers[index];
}

export function deleteWholesaleUser(id: string): boolean {
  const db = getDb();
  db.wholesaleUsers = db.wholesaleUsers || [];
  const beforeLen = db.wholesaleUsers.length;
  db.wholesaleUsers = db.wholesaleUsers.filter((u) => u.id !== id);
  if (db.wholesaleUsers.length !== beforeLen) {
    db.wholesaleApplications = (db.wholesaleApplications || []).filter((a) => a.id !== id);
    saveDb(db);
    return true;
  }
  return false;
}

// ---------------- BACKWARD COMPATIBILITY ALIASES ----------------
export function getWholesaleApplications(
  status?: "pending" | "approved" | "rejected",
  mobile?: string
): WholesaleApplication[] {
  return getWholesaleUsers(status, mobile) as unknown as WholesaleApplication[];
}

export function getWholesaleApplicationByMobile(
  mobile: string
): WholesaleApplication | null {
  return getWholesaleUserByMobile(mobile) as unknown as WholesaleApplication | null;
}

export function createWholesaleApplication(data: {
  name: string;
  businessName: string;
  email: string;
  instagramId?: string;
  mobile: string;
  gstin?: string;
}): WholesaleApplication {
  return createWholesaleUser(data) as unknown as WholesaleApplication;
}

export function updateWholesaleApplicationStatus(
  id: string,
  status: "pending" | "approved" | "rejected",
  reason?: string
): WholesaleApplication | null {
  return updateWholesaleUserStatus(id, status, reason) as unknown as WholesaleApplication | null;
}

export function deleteWholesaleApplication(id: string): boolean {
  return deleteWholesaleUser(id);
}
