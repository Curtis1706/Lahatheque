// ─── Types Gestionnaire (Manager) ─────────────────────────────────────────────
// Alignés sur le plan de specs techniques Django — rôle « Gestionnaire »
// Périmètre : stock papier uniquement, livraison physique, coordination Admin

// ─── Stock ────────────────────────────────────────────────────────────────────

export type StockStatus = "normal" | "low_stock" | "out_of_stock";

export interface StockItem {
  id: string;
  isbn: string;
  title: string;
  authors: string[];
  discipline: string;
  warehouse: string;
  country: string;
  quantity: number;
  alert_threshold: number;
  status: StockStatus;
  last_restock_at?: string;
}

export interface StockItemDetail extends StockItem {
  publisher_name: string;
  publication_date: string;
  recent_movements: StockMovement[];
}

// ─── Mouvements de Stock ──────────────────────────────────────────────────────

export type MovementType = "restock" | "sale" | "return" | "damage" | "correction";

export type MovementOrigin = "manual" | "auto_order" | "supplier_return";

export interface StockMovement {
  id: string;
  book_id: string;
  book_title: string;
  warehouse: string;
  movement_type: MovementType;
  quantity: number;
  reason?: string;
  origin: MovementOrigin;
  created_at: string;
  created_by: string;
}

export interface RestockPayload {
  book_id: string;
  warehouse: string;
  quantity: number;
  date: string;
}

export interface ManualExitPayload {
  book_id: string;
  warehouse: string;
  quantity: number;
  reason: string;
}

// ─── Alertes de Stock ─────────────────────────────────────────────────────────

export type AlertType = "out_of_stock" | "low_stock";

export type EscalationStatus = "not_escalated" | "escalated" | "acknowledged" | "resolved";

export interface StockAlert {
  id: string;
  book_id: string;
  book_title: string;
  isbn: string;
  warehouse: string;
  country: string;
  quantity: number;
  alert_threshold: number;
  alert_type: AlertType;
  triggered_at: string;
  escalation_status: EscalationStatus;
}

// ─── Commandes Physiques (vue Gestionnaire) ───────────────────────────────────

export type ManagerOrderStatus = "to_ship" | "shipped" | "delivered";

export interface ManagerOrderItem {
  id: string;
  book_title: string;
  isbn: string;
  quantity: number;
}

export interface OrderNotification {
  id: string;
  type: "shipment" | "delivery";
  sent_at: string;
  recipient_email: string;
}

export interface ManagerOrder {
  id: string;
  customer_name: string;
  customer_email: string;
  shipping_address: string;
  city: string;
  country: string;
  items: ManagerOrderItem[];
  status: ManagerOrderStatus;
  carrier?: string;
  tracking_number?: string;
  order_date: string;
  shipped_at?: string;
  delivered_at?: string;
  notifications: OrderNotification[];
  warehouse: string;
}

// ─── Ruptures remontées à l'Admin ─────────────────────────────────────────────

export type AdminOutageStatus = "reported" | "acknowledged" | "resolved";

export interface EscalatedOutage {
  id: string;
  book_id: string;
  book_title: string;
  isbn: string;
  warehouse: string;
  reported_at: string;
  admin_status: AdminOutageStatus;
  impact_description: string;
  reported_by: string;
}

// ─── KPI Vue d'ensemble ───────────────────────────────────────────────────────

export interface ManagerKpi {
  totalStock: number;
  outOfStockCount: number;
  lowStockCount: number;
  ordersToShip: number;
  ordersInTransit: number;
  deliveredThisMonth: number;
  deliveredThisWeek: number;
  deliveredToday: number;
}

// ─── Répartition stock par entrepôt ───────────────────────────────────────────

export interface WarehouseDistribution {
  warehouse: string;
  country: string;
  total_quantity: number;
  percentage: number;
  colorToken: string;
}

// ─── Filtres ──────────────────────────────────────────────────────────────────

export type StockFilterStatus = "all" | "normal" | "low_stock" | "out_of_stock";
export type DeliveryPeriodFilter = "today" | "week" | "month" | "all";
