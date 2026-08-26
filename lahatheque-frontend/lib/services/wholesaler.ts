/**
 * Service Grossiste — Espace Grossiste & Commandes Groupées B2B
 * 100% connecté aux endpoints Django BFF (/api/bff/commerce/wholesaler).
 */

import type {
  WholesalerBookItem,
  WholesalerOrder,
  WholesalerNotification,
  WholesaleTrendingData,
  WholesalerKpis,
  WholesalerCartItem,
  WholesaleCompanyProfile,
} from "../types/wholesaler";

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
  return bffGet<WholesalerKpis>("/kpis/");
}

// ─── Catalogue Grossiste ─────────────────────────────────────────────────────

export async function getWholesalerBooks(filters?: {
  search?: string;
  discipline?: string;
}): Promise<WholesalerBookItem[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.set("search", filters.search);
  if (filters?.discipline && filters.discipline !== "all") params.set("discipline", filters.discipline);
  const queryStr = params.toString() ? `?${params.toString()}` : "";
  return bffGet<WholesalerBookItem[]>(`/catalog/${queryStr}`);
}

export async function getWholesalerBookDetail(id: string): Promise<WholesalerBookItem | null> {
  try {
    return await bffGet<WholesalerBookItem>(`/catalog/${id}/`);
  } catch {
    return null;
  }
}

// ─── Commandes Groupées ──────────────────────────────────────────────────────

export async function getWholesalerOrders(): Promise<WholesalerOrder[]> {
  return bffGet<WholesalerOrder[]>("/orders/");
}

export async function getWholesalerOrderDetail(id: string): Promise<WholesalerOrder | null> {
  try {
    return await bffGet<WholesalerOrder>(`/orders/${id}/`);
  } catch {
    return null;
  }
}

export async function createWholesalerOrder(
  cartItems: WholesalerCartItem[],
  deliveryAddress: string,
  contactPhone: string
): Promise<WholesalerOrder> {
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
  return bffPost<WholesalerOrder>("/orders/", payload);
}

export async function requestOrderCancellation(
  orderId: string,
  reason: string
): Promise<boolean> {
  await bffPost(`/orders/${orderId}/cancel/`, { reason });
  return true;
}

// ─── Notifications & Tendances Grossiste ─────────────────────────────────────

export async function getWholesalerTrendingData(): Promise<WholesaleTrendingData> {
  const res = await bffGet<any>("/notifications/");
  if (res && Array.isArray(res.new_releases)) {
    return res as WholesaleTrendingData;
  }
  if (Array.isArray(res)) {
    return {
      new_releases: [],
      best_sellers: [],
      notifications: res,
    };
  }
  return {
    new_releases: res?.new_releases || [],
    best_sellers: res?.best_sellers || [],
    notifications: res?.notifications || [],
  };
}

export async function getWholesalerNotifications(): Promise<WholesalerNotification[]> {
  const data = await getWholesalerTrendingData();
  return data.notifications;
}

export async function markNotificationAsRead(id: string): Promise<boolean> {
  await bffPatch(`/notifications/${id}/`, { is_read: true });
  return true;
}

// ─── Profil & Facturation Entreprise B2B ─────────────────────────────────────

export async function getWholesaleCompanyProfile(): Promise<WholesaleCompanyProfile> {
  return bffGet<WholesaleCompanyProfile>("/profile/");
}

export async function updateWholesaleCompanyProfile(
  updates: Partial<WholesaleCompanyProfile>
): Promise<WholesaleCompanyProfile> {
  return bffPatch<WholesaleCompanyProfile>("/profile/", updates);
}
