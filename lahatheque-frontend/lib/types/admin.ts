export type AdminRole = 
  | "admin"
  | "super_admin"
  | "student"
  | "teacher"
  | "university"
  | "publisher"
  | "author"
  | "legal_reviewer"
  | "layout_artist"
  | "chief_layout"
  | "manager"
  | "wholesaler"
  | "commercial_wholesaler"
  | "coordination_manager"
  | "partner_api";

export interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: AdminRole;
  active_roles: AdminRole[];
  is_active: boolean;
  is_verified?: boolean;
  country: string;
  phone?: string;
  date_joined?: string;
  created_at?: string;
  last_active_at?: string;
  last_login?: string;
  status?: "active" | "suspended" | "pending_activation";
  organization?: string;
  extra_info?: Record<string, any>;
}

export interface AdminKpi {
  totalRevenue: number;
  totalSales: number;
  totalConsultations: number;
  activeUsers: number;
  pendingSubmissions: number;
  pendingUnpaidInvoices: number;
  revenueTrend: number;
  salesTrend: number;
  usersTrend: number;
}

export interface RoleDistribution {
  role: AdminRole;
  label: string;
  count: number;
  percentage: number;
  colorToken: string;
}

export interface RevenueCategoryBreakdown {
  category: string;
  label: string;
  amount: number;
  percentage: number;
  colorToken: string;
}

export interface AdminCatalogBook {
  id: string;
  isbn?: string;
  title: string;
  authors: string[];
  author_name?: string;
  publisher_name: string;
  discipline?: string;
  category?: string;
  status: "draft" | "submitted" | "in_review" | "approved" | "rejected" | "published" | "archived";
  format_type?: string;
  protection_type?: string;
  price_digital: number;
  price_paper: number;
  price?: number;
  sales_count: number;
  consultation_count: number;
  publication_date?: string;
  published_at?: string;
  drm_active?: boolean;
  total_reads?: number;
  total_revenue?: number;
}

export interface AdminSale {
  id: string;
  order_number?: string;
  user_email: string;
  user_name: string;
  buyer_name?: string;
  buyer_email?: string;
  buyer_type?: "individual" | "university" | "institution" | "wholesaler";
  item_type?: "book" | "subscription" | "bouquet";
  item_title?: string;
  book_title?: string;
  subscription_name?: string;
  type?: string;
  amount: number;
  currency?: string;
  payment_method?: "card" | "mobile_money" | "bank_transfer";
  payment_status: "paid" | "pending" | "failed" | "refunded";
  order_status?: "completed" | "pending" | "cancelled";
  created_at: string;
  country?: string;
}

export interface AdminRoyalty {
  id: string;
  beneficiary_name: string;
  beneficiary_type: "author" | "publisher" | "university";
  book_title?: string;
  period_month: string;
  total_reads: number;
  total_revenue: number;
  payout_amount: number;
  status: "pending" | "approved" | "settled" | "on_hold";
}

export interface AdminReminder {
  id: string;
  type: "pending_deposit" | "unpaid_invoice" | "expiring_subscription" | "missing_contract";
  entity_name: string;
  entity_type: "author" | "publisher" | "university" | "client";
  target_email: string;
  amount_or_count?: string;
  days_overdue: number;
  status: "pending" | "sent" | "resolved";
  created_at: string;
}

export interface AdminAccessLog {
  id: string;
  user_email: string;
  user_role: string;
  ip_address: string;
  country: string;
  action_type: string;
  resource: string;
  timestamp: string;
  details?: string;
}

export interface PartnerApiKey {
  id: string;
  name: string;
  partner: string;
  clientId: string;
  clientSecret: string;
  allowedOrigins: string[];
  webhookUrl: string;
  scopes: string[];
  created_at: string;
  is_active: boolean;
  last_used: string;
  activeSessionsCount: number;

  // Quotas & Privileges Partenaire
  isUnlimited: boolean;
  dailyRequestLimit: number | "unlimited";
  concurrentSessionsLimit: number | "unlimited";

  // Périmètre d'accès aux documents
  accessMode?: "mixed" | "external_only" | "catalog_only";
  allowByod: boolean;
  allowedDocumentSources: string[];
  maxFileSizeMb: number;
}
