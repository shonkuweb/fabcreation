import fs from "fs";
import path from "path";

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
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
  customerMobile: string;
  items: OrderItem[];
  subtotal: number;
  gst: number;
  shipping: number;
  total: number;
  status: "Pending" | "Confirmed" | "Dispatched" | "Delivered";
  createdAt: string;
}

export interface DatabaseData {
  products: Product[];
  categories: Category[];
  orders: Order[];
}

const DB_DIR = process.env.DATABASE_DIR
  ? path.resolve(process.env.DATABASE_DIR)
  : path.resolve(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "database.json");

const R2_BASE = "https://pub-ce8688bc6c654bcfb99716f7c9373bcd.r2.dev/fab-creations";

// Initial Seed Data (starts empty with no default hardcoded data)
const defaultData: DatabaseData = {
  products: [],
  categories: [],
  orders: [],
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
    cachedDb = {
      products: Array.isArray(parsed.products) ? parsed.products : [],
      categories: Array.isArray(parsed.categories) ? parsed.categories : [],
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
    };
    return cachedDb;
  } catch {
    cachedDb = {
      products: [],
      categories: [],
      orders: [],
    };
    return cachedDb;
  }
}

function saveDb(data: DatabaseData): void {
  // Update RAM cache immediately
  cachedDb = data;
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true, mode: 0o777 });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`[DB Error] Failed to write database to ${DB_FILE}:`, err);
    throw err;
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
  const newProduct: Product = {
    ...productData,
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

  db.products[index] = { ...db.products[index], ...updates };
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
export function getOrders(): Order[] {
  return getDb().orders;
}

export function createOrder(orderData: Omit<Order, "id" | "orderNumber" | "createdAt">): Order {
  const db = getDb();
  const orderNumber = `FC-${1000 + db.orders.length + 1}`;
  const newOrder: Order = {
    ...orderData,
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
