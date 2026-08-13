// ─── Services Async Espace Grossiste (wholesaler) ────────────────────────────

import type {
  WholesalerBookItem,
  WholesalerOrder,
  WholesalerNotification,
  WholesalerKpis,
  WholesalerCartItem,
} from "../types/wholesaler";

import {
  mockWholesalerBooks,
  mockWholesalerOrders,
  mockWholesalerNotifications,
} from "../mock/wholesaler";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── KPIs Grossiste ──────────────────────────────────────────────────────────

export async function getWholesalerKpis(): Promise<WholesalerKpis> {
  await delay(400);
  const pendingOrdersCount = mockWholesalerOrders.filter((o) => o.status === "processing" || o.status === "pending").length;
  const totalLicensesPurchased = mockWholesalerOrders.reduce((acc, o) => acc + o.total_digital_licenses, 0);
  const totalPrintCopiesPurchased = mockWholesalerOrders.reduce((acc, o) => acc + o.total_print_copies, 0);
  const totalSpentAmount = mockWholesalerOrders.reduce((acc, o) => acc + o.total_amount, 0);
  const unreadNotificationsCount = mockWholesalerNotifications.filter((n) => !n.is_read).length;

  return {
    pendingOrdersCount,
    totalLicensesPurchased,
    totalPrintCopiesPurchased,
    totalSpentAmount,
    unreadNotificationsCount,
  };
}

// ─── Catalogue Grossiste ─────────────────────────────────────────────────────

export async function getWholesalerBooks(filters?: {
  search?: string;
  discipline?: string;
}): Promise<WholesalerBookItem[]> {
  await delay(500);
  let list = [...mockWholesalerBooks];

  if (filters?.discipline && filters.discipline !== "all") {
    list = list.filter((b) => b.discipline === filters.discipline);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.isbn_digital.toLowerCase().includes(q) ||
        b.authors.some((a) => a.toLowerCase().includes(q))
    );
  }
  return list;
}

export async function getWholesalerBookDetail(id: string): Promise<WholesalerBookItem | null> {
  await delay(400);
  const found = mockWholesalerBooks.find((b) => b.id === id);
  if (!found) return null;
  return JSON.parse(JSON.stringify(found));
}

// ─── Commandes Groupées ──────────────────────────────────────────────────────

export async function getWholesalerOrders(): Promise<WholesalerOrder[]> {
  await delay(500);
  return [...mockWholesalerOrders];
}

export async function getWholesalerOrderDetail(id: string): Promise<WholesalerOrder | null> {
  await delay(400);
  const found = mockWholesalerOrders.find((o) => o.id === id || o.reference === id);
  if (!found) return null;
  return JSON.parse(JSON.stringify(found));
}

export async function createWholesalerOrder(
  cartItems: WholesalerCartItem[],
  deliveryAddress: string,
  contactPhone: string
): Promise<WholesalerOrder> {
  await delay(900);

  const orderItems = cartItems.map((ci) => {
    const digitalSubtotal = ci.digital_licenses_qty * ci.book.digital_wholesale_price;
    const printSubtotal = ci.print_copies_qty * ci.book.print_wholesale_price;
    return {
      book_id: ci.book.id,
      title: ci.book.title,
      authors: ci.book.authors,
      isbn: ci.book.isbn_digital,
      digital_licenses_qty: ci.digital_licenses_qty,
      digital_unit_price: ci.book.digital_wholesale_price,
      print_copies_qty: ci.print_copies_qty,
      print_unit_price: ci.book.print_wholesale_price,
      subtotal: digitalSubtotal + printSubtotal,
    };
  });

  const total_digital_licenses = cartItems.reduce((sum, ci) => sum + ci.digital_licenses_qty, 0);
  const total_print_copies = cartItems.reduce((sum, ci) => sum + ci.print_copies_qty, 0);
  const total_amount = orderItems.reduce((sum, oi) => sum + oi.subtotal, 0);

  const newOrder: WholesalerOrder = {
    id: `ord-wh-${Date.now().toString().slice(-4)}`,
    reference: `CMD-GROSSISTE-2025-${Math.floor(100 + Math.random() * 900)}`,
    created_at: new Date().toISOString(),
    company_name: "Librairie Internationale Bénin SARL",
    delivery_address: deliveryAddress,
    contact_phone: contactPhone,
    items: orderItems,
    total_digital_licenses,
    total_print_copies,
    total_amount,
    currency: "XOF",
    status: "pending",
    invoice_url: `/invoices/CMD-GROSSISTE-2025-NEW.pdf`,
    cancel_requested: false,
    timeline: [
      { step: "Commande soumise", date: new Date().toLocaleString("fr-FR"), description: "Dépôt de la commande groupée", done: true },
      { step: "Validation Administrateur", date: "-", description: "En cours de vérification par LAHA Éditions", done: false },
      { step: "Préparation & Expédition", date: "-", description: "Traitement entrepôt et clés d'accès", done: false },
      { step: "Livraison Finale", date: "-", description: "Livraison physique & numérique", done: false },
    ],
  };

  mockWholesalerOrders.unshift(newOrder);
  return newOrder;
}

export async function requestOrderCancellation(
  orderId: string,
  reason: string
): Promise<boolean> {
  await delay(600);
  const order = mockWholesalerOrders.find((o) => o.id === orderId);
  if (order && order.status !== "delivered") {
    order.cancel_requested = true;
    order.cancel_reason = reason;
    order.status = "cancelled";
    return true;
  }
  return false;
}

// ─── Notifications Grossiste ─────────────────────────────────────────────────

export async function getWholesalerNotifications(): Promise<WholesalerNotification[]> {
  await delay(400);
  return [...mockWholesalerNotifications];
}

export async function markNotificationAsRead(id: string): Promise<boolean> {
  await delay(300);
  const n = mockWholesalerNotifications.find((notif) => notif.id === id);
  if (n) {
    n.is_read = true;
    return true;
  }
  return false;
}
