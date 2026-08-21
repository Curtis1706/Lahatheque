/**
 * Service Manager — Espace Gestionnaire Stock & Livraison
 * 100% connecté aux endpoints Django BFF — zéro import mock.
 */

import type {
  StockItem,
  StockItemDetail,
  StockMovement,
  StockAlert,
  ManagerOrder,
  ManagerKpi,
  EscalatedOutage,
} from "@/lib/types/manager";

const BFF = "/api/bff/commerce/manager";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function bffGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BFF}${path}`, { credentials: "include" });
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

// ─── KPIs ─────────────────────────────────────────────────────────────────────

export async function getManagerKpis(): Promise<ManagerKpi & { timeline: { label: string; value: number }[] }> {
  const months = ["Janv", "Févr", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];
  const now = new Date();
  const fallbackTimeline = Array.from({ length: 4 }, (_, i) => {
    const dt = new Date(now.getTime() - (3 - i) * 7 * 24 * 60 * 60 * 1000);
    return { label: `${String(dt.getDate()).padStart(2, "0")} ${months[dt.getMonth()]}`, value: 0 };
  });

  try {
    const raw = await bffGet<any>("/kpis/");
    // Normalisation snake_case Django → camelCase frontend
    return {
      totalStock: raw.total_stock ?? raw.totalStock ?? 0,
      outOfStockCount: raw.out_of_stock_count ?? raw.outOfStockCount ?? 0,
      lowStockCount: raw.low_stock_count ?? raw.lowStockCount ?? 0,
      ordersToShip: raw.orders_to_ship ?? raw.ordersToShip ?? 0,
      ordersInTransit: raw.orders_in_transit ?? raw.ordersInTransit ?? 0,
      deliveredThisMonth: raw.delivered_this_month ?? raw.deliveredThisMonth ?? 0,
      deliveredThisWeek: raw.delivered_this_week ?? raw.deliveredThisWeek ?? 0,
      deliveredToday: raw.delivered_today ?? raw.deliveredToday ?? 0,
      timeline: raw.timeline ?? fallbackTimeline,
    };
  } catch {
    return {
      totalStock: 0, outOfStockCount: 0, lowStockCount: 0,
      ordersToShip: 0, ordersInTransit: 0,
      deliveredThisMonth: 0, deliveredThisWeek: 0,
      deliveredToday: 0, timeline: fallbackTimeline,
    };
  }
}


// ─── Entrepôts ────────────────────────────────────────────────────────────────

export interface Entrepot {
  id: string;
  code: string;
  nom: string;
  pays: string;
  ville: string;
  adresse: string;
  responsable_nom: string;
  telephone: string;
}

export async function getEntrepots(): Promise<Entrepot[]> {
  try {
    return await bffGet<Entrepot[]>("/entrepots/");
  } catch {
    return [];
  }
}

// ─── Stock ────────────────────────────────────────────────────────────────────

export async function getStockItems(filters?: {
  status?: string;
  warehouse?: string;
  country?: string;
  search?: string;
}): Promise<StockItem[]> {
  const params = new URLSearchParams();
  if (filters?.status && filters.status !== "all") params.set("status", filters.status);
  if (filters?.warehouse) params.set("warehouse", filters.warehouse);
  if (filters?.country) params.set("country", filters.country);
  if (filters?.search) params.set("search", filters.search);
  try {
    const raw = await bffGet<any>(`/stock/?${params.toString()}`);
    const list = Array.isArray(raw) ? raw : (raw as any)?.results || (raw as any)?.data || [];
    return list.map((s: any) => ({
      id: s.id,
      isbn: s.isbn ?? "",
      title: s.title ?? "",
      authors: s.authors ?? [],
      discipline: s.discipline ?? "",
      warehouse: s.warehouse ?? "",
      country: s.pays ?? s.country ?? "",
      quantity: s.quantite_disponible ?? s.quantity ?? 0,
      alert_threshold: s.seuil_alerte ?? s.alert_threshold ?? 0,
      status: (s.statut ?? s.status ?? "normal") as StockItem["status"],
      last_restock_at: s.last_restock_at,
      // Champs enrichis BFF
      warehouse_nom: s.warehouse_nom,
      pays: s.pays,
      ville: s.ville,
      quantite_reelle: s.quantite_reelle,
      quantite_reservee: s.quantite_reservee,
      quantite_disponible: s.quantite_disponible,
      seuil_alerte: s.seuil_alerte,
      statut: s.statut,
    } as StockItem & Record<string, any>));
  } catch {
    return [];
  }
}


export async function getStockItemDetail(id: string): Promise<StockItemDetail | null> {
  try {
    const s = await bffGet<any>(`/stock/${id}/`);
    return {
      id: s.id,
      isbn: s.isbn ?? "",
      title: s.title ?? "",
      authors: s.authors ?? [],
      discipline: s.discipline ?? "",
      warehouse: s.warehouse ?? "",
      country: s.pays ?? s.country ?? "",
      quantity: s.quantite_disponible ?? s.quantity ?? 0,
      alert_threshold: s.seuil_alerte ?? s.alert_threshold ?? 0,
      status: (s.statut ?? s.status ?? "normal") as StockItem["status"],
      last_restock_at: s.last_restock_at,
      publisher_name: s.publisher_name ?? "",
      publication_date: s.publication_date ?? "",
      recent_movements: (s.recent_movements ?? []).map((m: any) => ({
        id: m.id,
        book_id: m.book_id ?? s.id,
        book_title: s.title ?? "",
        warehouse: s.warehouse ?? "",
        movement_type: (m.type_mouvement ?? m.movement_type ?? "restock"),
        quantity: m.quantite ?? m.quantity ?? 0,
        reason: m.motif ?? m.reason,
        origin: m.origin ?? "manual",
        created_at: m.created_at ?? "",
        created_by: m.created_by ?? "—",
      })),
    } as StockItemDetail;
  } catch {
    return null;
  }
}


export async function updateStockAlertThreshold(id: string, seuil_alerte: number): Promise<void> {
  await bffPatch(`/stock/${id}/`, { seuil_alerte });
}

// ─── Ouvrages disponibles pour le stock ───────────────────────────────────────

export interface AvailableBookForStock {
  ouvrage_id: string;
  stock_id: string | null;
  title: string;
  isbn: string;
  authors: string;
  cover_url: string;
  discipline: string;
  format_type: string;
  warehouse: string;
  warehouse_nom: string;
  quantite_reelle: number;
  quantite_disponible: number;
  seuil_alerte: number;
  is_new_stock: boolean;
}

export async function getAvailableBooksForStock(search?: string): Promise<AvailableBookForStock[]> {
  try {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    const raw = await bffGet<any>(`/stock/available-books/${params}`);
    const list = Array.isArray(raw) ? raw : (raw as any)?.results || (raw as any)?.data || [];
    return list as AvailableBookForStock[];
  } catch {
    return [];
  }
}

// ─── Réassort ─────────────────────────────────────────────────────────────────

export interface RestockPayload {
  stock_id?: string;
  ouvrage_id?: string;
  quantite: number;
  reference_document?: string;
}

export async function createRestock(payload: RestockPayload): Promise<void> {
  await bffPost("/stock/restock/", payload);
}

// ─── Sortie Manuelle ──────────────────────────────────────────────────────────

export interface ManualExitPayload {
  stock_id: string;
  quantite: number;
  motif: string;
  type_mouvement?: "manual_exit" | "adjustment" | "return";
}

export async function createManualExit(payload: ManualExitPayload): Promise<void> {
  await bffPost("/stock/exit/", payload);
}

// ─── Mouvements ───────────────────────────────────────────────────────────────

export async function getStockMovements(stockId?: string): Promise<StockMovement[]> {
  const params = stockId ? `?stock_id=${stockId}` : "";
  try {
    const raw = await bffGet<any>(`/stock/movements/${params}`);
    const list = Array.isArray(raw) ? raw : (raw as any)?.results || (raw as any)?.data || [];
    return list.map((m: any) => ({
      id: m.id,
      book_id: m.stock_id ?? m.book_id ?? m.id,
      book_title: m.title ?? m.book_title ?? "",
      warehouse: m.warehouse ?? "",
      movement_type: (m.type_mouvement ?? m.movement_type ?? "restock") as StockMovement["movement_type"],
      quantity: m.quantite ?? m.quantity ?? 0,
      reason: m.motif ?? m.reason,
      origin: (m.origin ?? "manual") as StockMovement["origin"],
      created_at: m.created_at ?? "",
      created_by: m.created_by ?? "—",
    }));
  } catch {
    return [];
  }
}


// ─── Alertes ──────────────────────────────────────────────────────────────────

export async function getStockAlerts(): Promise<StockAlert[]> {
  try {
    const raw = await bffGet<any>("/stock/alerts/");
    const list = Array.isArray(raw) ? raw : (raw as any)?.results || (raw as any)?.data || [];
    return list.map((a: any) => ({
      id: a.id,
      book_id: a.id,
      book_title: a.title ?? "",
      isbn: a.isbn ?? "",
      warehouse: a.warehouse ?? "",
      country: a.pays ?? a.country ?? "",
      quantity: a.quantite_disponible ?? a.quantity ?? 0,
      alert_threshold: a.seuil_alerte ?? a.alert_threshold ?? 0,
      alert_type: (a.statut === "out_of_stock" ? "out_of_stock" : "low_stock") as StockAlert["alert_type"],
      triggered_at: a.last_restock_at ?? new Date().toISOString(),
      escalation_status: (a.escalation_status ?? "not_escalated") as StockAlert["escalation_status"],
    }));
  } catch {
    return [];
  }
}


// ─── Normalisation BFF → ManagerOrder ────────────────────────────────────────
// Le BFF renvoie des champs Django (client_nom, carrier_name, statut, created_at)
// — on les mappe ici vers les champs frontend attendus par les pages

function normalizeDelivery(raw: any): ManagerOrder {
  // Mapping statut Django → statut frontend
  const statusMap: Record<string, ManagerOrder["status"]> = {
    en_preparation: "to_ship",
    expedie: "shipped",
    livre: "delivered",
    to_ship: "to_ship",
    shipped: "shipped",
    delivered: "delivered",
  };
  const rawStatut = raw.statut ?? raw.status ?? "to_ship";
  const frontendStatus = statusMap[rawStatut] ?? ("to_ship" as ManagerOrder["status"]);

  return {
    id: raw.id,
    customer_name: raw.client_nom ?? raw.customer_name ?? "—",
    customer_email: raw.client_email ?? raw.customer_email ?? "—",
    shipping_address: raw.shipping_address ?? "",
    city: raw.city ?? "",
    country: raw.country ?? "",
    carrier: raw.carrier_name ?? raw.carrier,
    tracking_number: raw.tracking_number,
    status: frontendStatus,
    order_date: raw.created_at ?? raw.order_date ?? "",
    shipped_at: raw.shipped_at,
    delivered_at: raw.delivered_at,
    warehouse: raw.warehouse ?? "",
    items: raw.items ?? [],
    notifications: raw.notifications ?? [],
  } as ManagerOrder;
}


// ─── Livraisons ───────────────────────────────────────────────────────────────

export async function getDeliveries(statut?: string): Promise<ManagerOrder[]> {
  const params = statut ? `?statut=${statut}` : "";
  try {
    const raw = await bffGet<any[]>(`/deliveries/${params}`);
    return raw.map(normalizeDelivery);
  } catch {
    return [];
  }
}

export async function getDeliveryDetail(id: string): Promise<ManagerOrder | null> {
  try {
    const raw = await bffGet<any>(`/deliveries/${id}/`);
    return normalizeDelivery(raw);
  } catch {
    return null;
  }
}


export async function updateDelivery(
  id: string,
  payload: Partial<{ statut: string; carrier_name: string; tracking_number: string; shipping_address: string; city: string; country: string }>
): Promise<void> {
  await bffPatch(`/deliveries/${id}/`, payload);
}

// ─── Escalade Admin ───────────────────────────────────────────────────────────

export async function escalateAlert(alertId: string, impactDescription?: string): Promise<void> {
  await bffPost(`/stock/escalate/`, { stock_id: alertId, impact_description: impactDescription ?? "" });
}

// ─── Alias de compatibilité pour les pages delivery ───────────────────────────

/** Alias : récupère les livraisons par statut Django (en_preparation, expedie, livre) */
export async function getOrdersByStatus(statut: "to_ship" | "shipped" | "delivered" | "en_preparation" | "expedie" | "livre"): Promise<ManagerOrder[]> {
  // Mapping frontend → Django
  const statusMap: Record<string, string> = {
    to_ship: "en_preparation",
    shipped: "expedie",
    delivered: "livre",
  };
  const djangoStatus = statusMap[statut] ?? statut;
  return getDeliveries(djangoStatus);
}

/** Alias : marque une livraison comme expédiée */
export async function markAsShipped(id: string, carrier: string, trackingNumber: string): Promise<void> {
  await updateDelivery(id, {
    statut: "expedie",
    carrier_name: carrier,
    tracking_number: trackingNumber,
  });
}

/** Alias : marque une livraison comme livrée */
export async function markAsDelivered(id: string): Promise<void> {
  await updateDelivery(id, { statut: "livre" });
}

/** Alias : récupère le détail d'une livraison */
export async function getOrderDetail(id: string): Promise<ManagerOrder | null> {
  return getDeliveryDetail(id);
}

/** Alias : récupère la distribution par entrepôt (wrapper mock pour l'overview) */
export async function getWarehouseDistribution(): Promise<import("@/lib/types/manager").WarehouseDistribution[]> {
  try {
    const items = await getStockItems();
    // Agrégation client-side par entrepôt
    const warehouseMap = new Map<string, { warehouse: string; country: string; total: number }>();
    for (const item of items) {
      const key = item.warehouse;
      const existing = warehouseMap.get(key);
      const qty = (item as any).quantite_disponible ?? item.quantity ?? 0;
      if (existing) {
        existing.total += qty;
      } else {
        warehouseMap.set(key, { warehouse: item.warehouse, country: (item as any).pays ?? item.country ?? "", total: qty });
      }
    }
    const totalAll = Array.from(warehouseMap.values()).reduce((s, v) => s + v.total, 0) || 1;
    const COLORS = ["var(--color-navy)", "var(--color-gold)", "var(--color-success)", "var(--color-warning)", "var(--color-error)"];
    return Array.from(warehouseMap.values()).map((v, i) => ({
      warehouse: v.warehouse,
      country: v.country,
      total_quantity: v.total,
      percentage: Math.round((v.total / totalAll) * 100),
      colorToken: COLORS[i % COLORS.length],
    }));
  } catch {
    return [];
  }
}

// ─── Coordination Admin ───────────────────────────────────────────────────────

/** Récupère les ruptures escaladées vers l'Admin. */
export async function getEscalatedOutages(): Promise<EscalatedOutage[]> {
  try {
    // On réutilise l'endpoint des alertes et on filtre les escaladées côté client
    const alerts = await bffGet<any[]>("/stock/alerts/");
    return alerts
      .filter((a) => a.escalation_status && a.escalation_status !== "not_escalated")
      .map((a) => ({
        id: a.id,
        book_id: a.id,
        book_title: a.title ?? "",
        isbn: a.isbn ?? "",
        warehouse: a.warehouse ?? "",
        reported_at: a.last_restock_at ?? new Date().toISOString(),
        admin_status: (a.escalation_status === "escalated" ? "reported" : "acknowledged") as "reported" | "acknowledged" | "resolved",
        impact_description: `${a.statut === "out_of_stock" ? "Rupture totale" : "Seuil bas"} — ${a.quantite_disponible ?? 0} ex. disponibles`,
        reported_by: "Gestionnaire",
      }));
  } catch {
    return [];
  }
}

/** Escalade une rupture vers l'Admin et retourne l'EscalatedOutage créé. */
export async function escalateToAdmin(alertId: string, impactDescription: string): Promise<EscalatedOutage> {
  await bffPost("/stock/escalate/", { stock_id: alertId, impact_description: impactDescription });
  // Retourne un objet synthétique — le détail sera rechargé par la page
  return {
    id: alertId,
    book_id: alertId,
    book_title: "—",
    isbn: "—",
    warehouse: "—",
    reported_at: new Date().toISOString(),
    admin_status: "reported" as const,
    impact_description: impactDescription,
    reported_by: "Gestionnaire",
  };
}




