import { NextResponse } from "next/server";
import { getOrders, createOrder, getProductById, updateProduct, type OrderItem } from "@/lib/db";
import { sendOrderConfirmationEmail } from "@/lib/resend";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const customer = searchParams.get("customer") || searchParams.get("mobile");

    // 1. If a specific customer is requested, return ONLY orders belonging to that customer
    if (customer && customer.trim()) {
      const cleanCustomer = customer.trim().toLowerCase();
      const cleanDigits = customer.replace(/\D/g, "");
      let orders = getOrders().filter((o) => {
        const matchMobile = cleanDigits && o.customerMobile?.replace(/\D/g, "") === cleanDigits;
        const matchEmail = o.customerEmail && o.customerEmail.trim().toLowerCase() === cleanCustomer;
        const matchRaw = o.customerMobile && o.customerMobile.trim().toLowerCase() === cleanCustomer;
        return Boolean(matchMobile || matchEmail || matchRaw);
      });

      if (type === "wholesale") {
        orders = orders.filter((o) => o.orderType === "wholesale");
      } else if (type === "retail") {
        orders = orders.filter((o) => o.orderType !== "wholesale");
      }

      return NextResponse.json(
        { success: true, orders },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
        }
      );
    }

    // 2. Listing ALL orders across the store requires admin authentication
    if (!isAdminAuthenticated(req)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin session required to view all orders." },
        { status: 401 }
      );
    }

    let orders = getOrders();
    if (type === "wholesale") {
      orders = orders.filter((o) => o.orderType === "wholesale");
    } else if (type === "retail") {
      orders = orders.filter((o) => o.orderType !== "wholesale");
    }

    return NextResponse.json(
      { success: true, orders },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (err) {
    console.error("GET /api/orders error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customerMobile, customerEmail, customerName, items, shipping } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Cart items are required to place an order" },
        { status: 400 }
      );
    }

    const orderType =
      body.orderType === "wholesale" || body.storeMode === "wholesale"
        ? "wholesale"
        : "retail";

    // SERVER-SIDE PRICE & ITEM VERIFICATION
    // Protect against client-side price tampering by looking up real prices in database
    const verifiedItems: OrderItem[] = [];
    let calculatedSubtotal = 0;

    for (let idx = 0; idx < items.length; idx++) {
      const rawItem = items[idx];
      const prodId = String(rawItem.id || rawItem.productId || "");
      const dbProduct = prodId ? getProductById(prodId) : undefined;
      const quantity = Math.max(1, Number(rawItem.quantity) || 1);

      let itemPrice = 0;
      let itemName = String(rawItem.name || "Jewellery Item").trim();
      let itemImage = String(rawItem.image || "/images/products/moon-necklace.jpg");

      if (dbProduct) {
        itemName = dbProduct.name;
        itemImage = dbProduct.image || itemImage;
        const rPrice = dbProduct.retailPrice ?? dbProduct.price ?? 0;
        const wPrice = dbProduct.wholesalePrice ?? dbProduct.price ?? rPrice;
        itemPrice = orderType === "wholesale" ? wPrice : rPrice;

        // Atomically decrement stock when order is placed
        if (typeof dbProduct.stock === "number" && dbProduct.stock > 0) {
          updateProduct(dbProduct.id, {
            stock: Math.max(0, dbProduct.stock - quantity),
          });
        }
      } else {
        // Fallback for custom items if ever needed
        itemPrice = Math.max(0, Number(rawItem.price) || 0);
      }

      calculatedSubtotal += itemPrice * quantity;
      verifiedItems.push({
        id: prodId || `item-${Date.now()}-${idx}`,
        name: itemName,
        price: itemPrice,
        quantity,
        image: itemImage,
      });
    }

    // Enforce Wholesale Minimum Order Threshold
    if (orderType === "wholesale" && calculatedSubtotal < 3000) {
      return NextResponse.json(
        {
          success: false,
          message: "Minimum wholesale order subtotal is ₹3,000 across cart.",
        },
        { status: 400 }
      );
    }

    const finalSubtotal = Number(calculatedSubtotal.toFixed(1));
    const finalGst = Number((finalSubtotal * 0.03).toFixed(1));
    const finalShipping = Number(shipping) === 0 ? 0 : 125;
    const finalTotal = Number((finalSubtotal + finalGst + finalShipping).toFixed(1));

    const emailStr = (customerEmail || "").trim();
    const mobileStr = (customerMobile || "").trim();
    const validMobile =
      mobileStr || emailStr || (orderType === "wholesale" ? "Wholesale Partner" : "Retail Customer");

    const newOrder = createOrder({
      customerMobile: validMobile,
      customerEmail: emailStr || (validMobile.includes("@") ? validMobile : undefined),
      customerName: (customerName || "").trim() || "Customer",
      items: verifiedItems,
      subtotal: finalSubtotal,
      gst: finalGst,
      shipping: finalShipping,
      total: finalTotal,
      status: "Pending",
      orderType,
    });

    // Send confirmation email
    let recipientEmail = emailStr || (validMobile.includes("@") ? validMobile : "");
    if (!recipientEmail) {
      try {
        const { getRetailUsers, getWholesaleUsers } = await import("@/lib/db");
        if (orderType === "wholesale") {
          const wsUser = getWholesaleUsers().find(
            (u) =>
              (u.mobile && u.mobile.replace(/\D/g, "") === validMobile.replace(/\D/g, "")) ||
              (u.name && u.name.toLowerCase() === (customerName || "").toLowerCase())
          );
          if (wsUser?.email) recipientEmail = wsUser.email;
        } else {
          const retUser = getRetailUsers().find(
            (u) =>
              (u.mobile && u.mobile.replace(/\D/g, "") === validMobile.replace(/\D/g, "")) ||
              (u.email && u.email.includes("@"))
          );
          if (retUser?.email) recipientEmail = retUser.email;
        }
      } catch (lookupErr) {
        console.warn("[Orders API] User email lookup note:", lookupErr);
      }
    }

    if (recipientEmail && recipientEmail.includes("@")) {
      sendOrderConfirmationEmail({
        orderNumber: newOrder.orderNumber,
        customerName: newOrder.customerName,
        customerEmail: recipientEmail,
        customerMobile: newOrder.customerMobile,
        orderType: newOrder.orderType,
        items: newOrder.items,
        subtotal: newOrder.subtotal,
        gst: newOrder.gst,
        shipping: newOrder.shipping,
        total: newOrder.total,
        createdAt: newOrder.createdAt,
      }).catch((emailErr) => {
        console.error("[Orders API] Background order email failed:", emailErr);
      });
    }

    return NextResponse.json({ success: true, order: newOrder }, { status: 201 });
  } catch (err) {
    console.error("POST /api/orders error:", err);
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : "Failed to create order",
      },
      { status: 500 }
    );
  }
}
