export type AdminRole =
  | "student"
  | "teacher"
  | "librarian"
  | "publisher"
  | "author"
  | "legal_reviewer"
  | "layout_artist"
  | "chief_layout"
  | "partner_api"
  | "wholesaler"
  | "manager"
  | "admin"
  | "super_admin";

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

export interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: AdminRole;
  active_roles: AdminRole[];
  is_active: boolean;
  is_verified: boolean;
  country: string;
  phone?: string;
  date_joined: string;
  last_active_at?: string;
  extra_info?: {
    institution_name?: string;
    books_count?: number;
    total_sales_amount?: number;
    pending_royalties?: number;
    subscription_plan?: string;
    active_bouquets_count?: number;
  };
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
  isbn: string;
  title: string;
  authors: string[];
  publisher_name: string;
  discipline: string;
  status: "draft" | "submitted" | "in_review" | "layout_pending" | "published" | "rejected";
  format_type: "pdf" | "epub" | "audio";
  protection_type: "lcp" | "watermark" | "none";
  price_digital: number;
  price_paper: number;
  sales_count: number;
  consultation_count: number;
  publication_date: string;
}

export interface AdminSale {
  id: string;
  user_email: string;
  user_name: string;
  book_title?: string;
  subscription_name?: string;
  type: "unitaire_digital" | "unitaire_papier" | "abonnement_individuel" | "bouquet_institution";
  amount: number;
  currency: string;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  order_status: "pending" | "processing" | "completed" | "cancelled";
  created_at: string;
  country: string;
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
