import { NextResponse } from "next/server";
import { getOrders, createOrder, getProductById, updateProduct, getSettings, type OrderItem } from "@/lib/db";
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
      let itemWholesaleMinQty = rawItem.wholesaleMinQty ? Number(rawItem.wholesaleMinQty) : 1;

      if (dbProduct) {
        itemName = dbProduct.name;
        itemImage = dbProduct.image || itemImage;
        const rPrice = dbProduct.retailPrice ?? dbProduct.price ?? 0;
        const wPrice = dbProduct.wholesalePrice ?? dbProduct.price ?? rPrice;
        itemPrice = orderType === "wholesale" ? wPrice : rPrice;
        itemWholesaleMinQty = dbProduct.wholesaleMinQty ?? itemWholesaleMinQty;
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
        wholesaleMinQty: itemWholesaleMinQty,
      });
    }

    const settings = getSettings();
    const wholesaleMinCart = Number(settings.wholesaleMinCartValue ?? 3000);
    const wholesaleMinQty = Number(settings.wholesaleMinQuantity ?? 1);
    const wholesaleDelivery = Number(settings.wholesaleDeliveryCharge ?? 125);

    const retailMinCart = Number(settings.retailMinCartValue ?? 0);
    const retailFreeShip = Number(settings.retailFreeShippingThreshold ?? 999);
    const retailDelivery = Number(settings.retailDeliveryCharge ?? 125);

    const totalQuantity = verifiedItems.reduce((sum, item) => sum + item.quantity, 0);

    // Enforce Wholesale Minimum Order Threshold & Quantities
    if (orderType === "wholesale") {
      // 1. Enforce individual product MOQs
      for (const item of verifiedItems) {
        const itemMOQ = item.wholesaleMinQty ?? 1;
        if (itemMOQ > 1 && item.quantity < itemMOQ) {
          return NextResponse.json(
            {
              success: false,
              message: `Minimum wholesale quantity for "${item.name}" is ${itemMOQ} pieces (current: ${item.quantity}).`,
            },
            { status: 400 }
          );
        }
      }

      // 2. Enforce total cart value minimum
      if (wholesaleMinCart > 0 && calculatedSubtotal < wholesaleMinCart) {
        return NextResponse.json(
          {
            success: false,
            message: `Minimum wholesale order subtotal is ₹${wholesaleMinCart.toLocaleString("en-IN")} across cart.`,
          },
          { status: 400 }
        );
      }

      // 3. Enforce total pieces count minimum
      if (wholesaleMinQty > 1 && totalQuantity < wholesaleMinQty) {
        return NextResponse.json(
          {
            success: false,
            message: `Minimum wholesale order quantity is ${wholesaleMinQty} pieces across cart (current: ${totalQuantity}).`,
          },
          { status: 400 }
        );
      }
    }

    // Enforce Retail Minimum Order Threshold (if configured)
    if (orderType === "retail" && retailMinCart > 0 && calculatedSubtotal < retailMinCart) {
      return NextResponse.json(
        {
          success: false,
          message: `Minimum retail order subtotal is ₹${retailMinCart.toLocaleString("en-IN")} across cart.`,
        },
        { status: 400 }
      );
    }

    // Decrement stock only after all validations have passed
    for (const item of verifiedItems) {
      if (item.id && !item.id.startsWith("item-")) {
        const p = getProductById(item.id);
        if (p && typeof p.stock === "number" && p.stock > 0) {
          updateProduct(p.id, {
            stock: Math.max(0, p.stock - item.quantity),
          });
        }
      }
    }

    const finalSubtotal = Number(calculatedSubtotal.toFixed(1));
    const finalGst = Number((finalSubtotal * 0.03).toFixed(1));

    // Dynamic Shipping calculation based on admin configuration
    let finalShipping = 0;
    if (orderType === "wholesale") {
      finalShipping = wholesaleDelivery;
    } else {
      // Retail B2C shipping: free shipping if subtotal >= retailFreeShippingThreshold, else retailDeliveryCharge
      if (finalSubtotal >= retailFreeShip) {
        finalShipping = 0;
      } else {
        finalShipping = retailDelivery;
      }
    }
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
