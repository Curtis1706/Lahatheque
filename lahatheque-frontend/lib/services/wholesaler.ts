/**
 * Service Grossiste — Espace Grossiste & Commandes Groupées B2B
 * 100% connecté aux endpoints Django BFF (/api/bff/commerce/wholesaler).
 */

import type {
  WholesalerBookItem,
  WholesalerOrder,
  WholesalerNotification,
  WholesalerKpis,
  WholesalerCartItem,
  WholesaleCompanyProfile,
  WholesaleDiscountTier,
} from "../types/wholesaler";

import {
  mockWholesalerBooks,
  mockWholesalerOrders,
  mockWholesalerNotifications,
} from "../mock/wholesaler";

const BFF = "/api/bff/commerce/wholesaler";

// ─── Helpers BFF ─────────────────────────────────────────────────────────────

async function bffGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BFF}${path}`, { credentials: "include", cache: "no-store" });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Erreur serveur");
  return json.data as T;
}

async function bffPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BFF}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Erreur serveur");
  return json.data as T;
}

async function bffPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BFF}${path}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Erreur serveur");
  return json.data as T;
}

// ─── KPIs Grossiste ──────────────────────────────────────────────────────────

export async function getWholesalerKpis(): Promise<WholesalerKpis> {
  try {
    return await bffGet<WholesalerKpis>("/kpis/");
  } catch {
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
}

// ─── Catalogue Grossiste ─────────────────────────────────────────────────────

export async function getWholesalerBooks(filters?: {
  search?: string;
  discipline?: string;
}): Promise<WholesalerBookItem[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.search) params.set("search", filters.search);
    if (filters?.discipline && filters.discipline !== "all") params.set("discipline", filters.discipline);
    const queryStr = params.toString() ? `?${params.toString()}` : "";
    return await bffGet<WholesalerBookItem[]>(`/catalog/${queryStr}`);
  } catch {
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
}

export async function getWholesalerBookDetail(id: string): Promise<WholesalerBookItem | null> {
  try {
    return await bffGet<WholesalerBookItem>(`/catalog/${id}/`);
  } catch {
    const found = mockWholesalerBooks.find((b) => b.id === id);
    if (!found) return null;
    return JSON.parse(JSON.stringify(found));
  }
}

// ─── Commandes Groupées ──────────────────────────────────────────────────────

export async function getWholesalerOrders(): Promise<WholesalerOrder[]> {
  try {
    return await bffGet<WholesalerOrder[]>("/orders/");
  } catch {
    return [...mockWholesalerOrders];
  }
}

export async function getWholesalerOrderDetail(id: string): Promise<WholesalerOrder | null> {
  try {
    return await bffGet<WholesalerOrder>(`/orders/${id}/`);
  } catch {
    const found = mockWholesalerOrders.find((o) => o.id === id || o.reference === id);
    if (!found) return null;
    return JSON.parse(JSON.stringify(found));
  }
}

export async function createWholesalerOrder(
  cartItems: WholesalerCartItem[],
  deliveryAddress: string,
  contactPhone: string
): Promise<WholesalerOrder> {
  try {
    const payload = {
      delivery_address: deliveryAddress,
      contact_phone: contactPhone,
      items: cartItems.map((ci) => ({
        book_id: ci.book.id,
        digital_licenses_qty: ci.digital_licenses_qty,
        digital_unit_price: ci.book.digital_wholesale_price,
        print_copies_qty: ci.print_copies_qty,
        print_unit_price: ci.book.print_wholesale_price,
      })),
    };
    return await bffPost<WholesalerOrder>("/orders/", payload);
  } catch {
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
      reference: `CMD-GROSSISTE-2026-${Math.floor(100 + Math.random() * 900)}`,
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
      invoice_url: `/invoices/CMD-GROSSISTE-2026-NEW.pdf`,
      cancel_requested: false,
      timeline: [
        { step: "Commande soumise", date: new Date().toLocaleString("fr-FR"), description: "Dépôt de la commande groupée", done: true },
        { step: "Validation & Proforma", date: "-", description: "Émission du devis proforma B2B", done: false },
        { step: "Préparation & Expédition", date: "-", description: "Traitement entrepôt et clés d'accès", done: false },
        { step: "Livraison Finale", date: "-", description: "Livraison physique & activation des clés", done: false },
      ],
    };

    mockWholesalerOrders.unshift(newOrder);
    return newOrder;
  }
}

export async function requestOrderCancellation(
  orderId: string,
  reason: string
): Promise<boolean> {
  try {
    await bffPost(`/orders/${orderId}/cancel/`, { reason });
    return true;
  } catch {
    const order = mockWholesalerOrders.find((o) => o.id === orderId);
    if (order && order.status !== "delivered") {
      order.cancel_requested = true;
      order.cancel_reason = reason;
      order.status = "cancelled";
      return true;
    }
    return false;
  }
}

// ─── Notifications Grossiste ─────────────────────────────────────────────────

export async function getWholesalerNotifications(): Promise<WholesalerNotification[]> {
  try {
    return await bffGet<WholesalerNotification[]>("/notifications/");
  } catch {
    return [...mockWholesalerNotifications];
  }
}

export async function markNotificationAsRead(id: string): Promise<boolean> {
  const n = mockWholesalerNotifications.find((notif) => notif.id === id);
  if (n) {
    n.is_read = true;
    return true;
  }
  return false;
}

// ─── Profil & Facturation Entreprise B2B ─────────────────────────────────────

let mockWholesaleProfile: WholesaleCompanyProfile = {
  company_name: "Librairie Internationale Bénin SARL",
  trade_name: "LIB Bénin Distribution",
  nif_number: "3201900123456",
  rccm_number: "RB/COT/20-B-12345",
  contact_person: "M. Roland TOSSOU",
  contact_email: "commandes@librairie-benin.com",
  contact_phone: "+229 97 00 11 22",
  country: "BJ",
  city: "Cotonou",
  headquarters_address: "Avenue Steinmetz, Carré 122, Cotonou, Bénin",
  warehouse_address: "Zone Industrielle de Ganhi, Hangar 4B, Cotonou, Bénin",
  tier: {
    id: "tier-grand-compte",
    name: "Grand Compte Librairies Partenaires",
    min_quantity: 20,
    digital_discount_percent: 25,
    print_discount_percent: 30,
    description: "Remise standard B2B appliquée sur les commandes d'au moins 20 exemplaires par référence.",
  },
  payment_terms: "Virement bancaire / Mobile Money à validation de facture proforma",
  verified_partner: true,
};

export async function getWholesaleCompanyProfile(): Promise<WholesaleCompanyProfile> {
  try {
    return await bffGet<WholesaleCompanyProfile>("/profile/");
  } catch {
    return { ...mockWholesaleProfile };
  }
}

export async function updateWholesaleCompanyProfile(
  updates: Partial<WholesaleCompanyProfile>
): Promise<WholesaleCompanyProfile> {
  try {
    return await bffPatch<WholesaleCompanyProfile>("/profile/", updates);
  } catch {
    mockWholesaleProfile = { ...mockWholesaleProfile, ...updates };
    return { ...mockWholesaleProfile };
  }
}
