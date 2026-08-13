// ─── Services Gestionnaire (Manager) ──────────────────────────────────────────
// Fonctions async avec délai simulé — jamais de fetch en dur

import type {
  StockItem,
  StockItemDetail,
  StockMovement,
  StockAlert,
  ManagerOrder,
  EscalatedOutage,
  ManagerKpi,
  WarehouseDistribution,
  RestockPayload,
  ManualExitPayload,
  StockFilterStatus,
} from "../types/manager";

import {
  mockStockItems,
  mockStockMovements,
  mockStockAlerts,
  mockManagerOrders,
  mockEscalatedOutages,
  mockManagerKpis,
  mockWarehouseDistribution,
  mockStockItemDetails,
} from "../mock/manager";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── KPIs ─────────────────────────────────────────────────────────────────────

export async function getManagerKpis(): Promise<ManagerKpi> {
  await delay(600);
  return { ...mockManagerKpis };
}

export async function getWarehouseDistribution(): Promise<WarehouseDistribution[]> {
  await delay(500);
  return [...mockWarehouseDistribution];
}

// ─── Stock ────────────────────────────────────────────────────────────────────

export async function getStockItems(filters?: {
  status?: StockFilterStatus;
  search?: string;
  warehouse?: string;
}): Promise<StockItem[]> {
  await delay(700);
  let items = [...mockStockItems];

  if (filters?.status && filters.status !== "all") {
    items = items.filter((i) => i.status === filters.status);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.isbn.toLowerCase().includes(q)
    );
  }
  if (filters?.warehouse) {
    items = items.filter((i) => i.warehouse === filters.warehouse);
  }

  return items;
}

export async function getStockItemDetail(id: string): Promise<StockItemDetail | null> {
  await delay(600);
  const detail = mockStockItemDetails[id];
  if (detail) return { ...detail, recent_movements: [...detail.recent_movements] };

  // Fallback : construire un détail basique à partir du stock item
  const item = mockStockItems.find((i) => i.id === id);
  if (!item) return null;

  return {
    ...item,
    publisher_name: "LAHA Éditions",
    publication_date: "2024-01-01",
    recent_movements: mockStockMovements
      .filter((m) => m.book_id === id)
      .map((m) => ({ ...m })),
  };
}

export async function updateAlertThreshold(
  bookId: string,
  newThreshold: number
): Promise<boolean> {
  await delay(800);
  const item = mockStockItems.find((i) => i.id === bookId);
  if (item) {
    item.alert_threshold = newThreshold;
    return true;
  }
  return false;
}

// ─── Mouvements ───────────────────────────────────────────────────────────────

export async function getStockMovements(bookId?: string): Promise<StockMovement[]> {
  await delay(700);
  let movements = [...mockStockMovements];
  if (bookId) {
    movements = movements.filter((m) => m.book_id === bookId);
  }
  return movements.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function createRestock(payload: RestockPayload): Promise<StockMovement> {
  await delay(1000);
  const newMovement: StockMovement = {
    id: `mv-${Date.now()}`,
    book_id: payload.book_id,
    book_title:
      mockStockItems.find((i) => i.id === payload.book_id)?.title || "Ouvrage inconnu",
    warehouse: payload.warehouse,
    movement_type: "restock",
    quantity: payload.quantity,
    origin: "manual",
    created_at: new Date().toISOString(),
    created_by: "Gestionnaire A. SOSSA",
  };
  mockStockMovements.unshift(newMovement);

  // Mettre à jour la quantité du stock
  const item = mockStockItems.find((i) => i.id === payload.book_id);
  if (item) {
    item.quantity += payload.quantity;
    item.last_restock_at = new Date().toISOString();
    if (item.quantity > item.alert_threshold) item.status = "normal";
    else if (item.quantity > 0) item.status = "low_stock";
  }

  return newMovement;
}

export async function createManualExit(payload: ManualExitPayload): Promise<StockMovement> {
  await delay(1000);
  const newMovement: StockMovement = {
    id: `mv-${Date.now()}`,
    book_id: payload.book_id,
    book_title:
      mockStockItems.find((i) => i.id === payload.book_id)?.title || "Ouvrage inconnu",
    warehouse: payload.warehouse,
    movement_type: "damage",
    quantity: -Math.abs(payload.quantity),
    reason: payload.reason,
    origin: "manual",
    created_at: new Date().toISOString(),
    created_by: "Gestionnaire A. SOSSA",
  };
  mockStockMovements.unshift(newMovement);

  const item = mockStockItems.find((i) => i.id === payload.book_id);
  if (item) {
    item.quantity = Math.max(0, item.quantity - Math.abs(payload.quantity));
    if (item.quantity === 0) item.status = "out_of_stock";
    else if (item.quantity <= item.alert_threshold) item.status = "low_stock";
  }

  return newMovement;
}

// ─── Alertes ──────────────────────────────────────────────────────────────────

export async function getStockAlerts(): Promise<StockAlert[]> {
  await delay(600);
  return [...mockStockAlerts];
}

export async function escalateAlert(alertId: string): Promise<boolean> {
  await delay(800);
  const alert = mockStockAlerts.find((a) => a.id === alertId);
  if (alert) {
    alert.escalation_status = "escalated";
    return true;
  }
  return false;
}

// ─── Commandes ────────────────────────────────────────────────────────────────

export async function getOrdersByStatus(
  status: "to_ship" | "shipped" | "delivered"
): Promise<ManagerOrder[]> {
  await delay(700);
  return mockManagerOrders
    .filter((o) => o.status === status)
    .map((o) => ({ ...o, items: [...o.items], notifications: [...o.notifications] }));
}

export async function getOrderDetail(id: string): Promise<ManagerOrder | null> {
  await delay(500);
  const order = mockManagerOrders.find((o) => o.id === id);
  if (!order) return null;
  return { ...order, items: [...order.items], notifications: [...order.notifications] };
}

export async function markAsShipped(
  orderId: string,
  carrier: string,
  trackingNumber: string
): Promise<boolean> {
  await delay(1000);
  const order = mockManagerOrders.find((o) => o.id === orderId);
  if (order && order.status === "to_ship") {
    order.status = "shipped";
    order.carrier = carrier;
    order.tracking_number = trackingNumber;
    order.shipped_at = new Date().toISOString();
    order.notifications.push({
      id: `notif-${Date.now()}`,
      type: "shipment",
      sent_at: new Date().toISOString(),
      recipient_email: order.customer_email,
    });
    return true;
  }
  return false;
}

export async function markAsDelivered(orderId: string): Promise<boolean> {
  await delay(1000);
  const order = mockManagerOrders.find((o) => o.id === orderId);
  if (order && order.status === "shipped") {
    order.status = "delivered";
    order.delivered_at = new Date().toISOString();
    order.notifications.push({
      id: `notif-${Date.now()}`,
      type: "delivery",
      sent_at: new Date().toISOString(),
      recipient_email: order.customer_email,
    });
    return true;
  }
  return false;
}

// ─── Coordination ─────────────────────────────────────────────────────────────

export async function getEscalatedOutages(): Promise<EscalatedOutage[]> {
  await delay(600);
  return [...mockEscalatedOutages];
}

export async function escalateToAdmin(
  alertId: string,
  impactDescription: string
): Promise<EscalatedOutage> {
  await delay(1000);
  const alert = mockStockAlerts.find((a) => a.id === alertId);
  const newOutage: EscalatedOutage = {
    id: `esc-${Date.now()}`,
    book_id: alert?.book_id || "",
    book_title: alert?.book_title || "Ouvrage inconnu",
    isbn: alert?.isbn || "",
    warehouse: alert?.warehouse || "Entrepôt Cotonou",
    reported_at: new Date().toISOString(),
    admin_status: "reported",
    impact_description: impactDescription,
    reported_by: "Gestionnaire A. SOSSA",
  };
  mockEscalatedOutages.push(newOutage);

  if (alert) {
    alert.escalation_status = "escalated";
  }

  return newOutage;
}
