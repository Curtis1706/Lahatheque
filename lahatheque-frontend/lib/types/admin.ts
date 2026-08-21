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
  salesCurve?: { month: string; total: number; online?: number; wholesalers?: number; subscriptions?: number }[];
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
  beneficiary_email?: string;
  book_title?: string;
  period_month: string;
  total_reads: number;
  total_revenue: number;
  payout_amount: number;
  status: "pending" | "approved" | "settled" | "on_hold" | "processed" | "rejected";
  payment_method?: string;
  account_details?: string;
  transaction_reference?: string;
  admin_notes?: string;
  created_at?: string;
  processed_at?: string;

  // Pourcentages et barèmes éditables par l'administrateur
  author_rate_percent?: number;
  publisher_rate_percent?: number;
  platform_rate_percent?: number;
  university_rate_percent?: number;
}

export interface GlobalPricingConfig {
  id?: string;
  prix_defaut_numerique_xof: number;
  prix_defaut_papier_xof: number;
  prix_defaut_audio_xof: number;
  prix_pass_mensuel_xof?: number;
  prix_pass_annuel_xof?: number;
  devise_defaut: string;
  
  // Barèmes de redevances par défaut
  default_author_royalty_rate: number;
  default_publisher_royalty_rate: number;
  default_university_royalty_rate: number;
  default_platform_share_rate: number;

  // Paramètres de protection DRM
  watermark_texte_defaut: string;
  watermark_opacite_defaut: number;
  restriction_impression_defaut: boolean;
  restriction_capture_defaut: boolean;
  duree_session_lecture_minutes: number;

  // Délais de relances
  delai_relance_depots_jours: number;
  delai_relance_impayes_jours: number;
  delai_relance_abonnements_jours: number;

  // Passerelles de paiement
  moneroo_actif: boolean;
  stripe_actif: boolean;
  fastermessage_sms_actif: boolean;
}

export interface PartnerRoyaltyConfig {
  partner_id: string;
  partner_name: string;
  partner_type: "author" | "publisher" | "university";
  contract_reference: string;
  custom_royalty_rate: number;
  payout_frequency: "monthly" | "quarterly" | "on_demand";
  payment_method_preferred: "momo" | "bank" | "orange" | "moov";
  account_identifier: string;
  last_updated?: string;
}

export interface AdminReminder {
  id: string;
  type: "pending_deposit" | "unpaid_invoice" | "expiring_subscription" | "missing_contract" | "depot_en_attente" | "facture_impayee" | "abonnement_expiration";
  canal?: "email" | "sms" | "in_app";
  entity_name: string;
  entity_type?: "author" | "publisher" | "university" | "client";
  target_email: string;
  objet?: string;
  message?: string;
  amount_or_count?: string;
  days_overdue?: number;
  status?: "pending" | "sent" | "resolved" | "envoye" | "echec" | "ouvert";
  reference_id?: string;
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

export interface AdminValidationProof {
  id: string;
  title: string;
  author_name: string;
  publisher_name: string;
  discipline: string;
  version: string;
  format: string;
  status: "pending_admin_approval" | "approved" | "published" | "rejected";
  submitted_by: string;
  submitted_at: string;
  reviewed_by: string;
  reviewed_at: string;
  rejection_reason?: string | null;
  file_url?: string;
  page_count?: number;
  lcp_compliant?: boolean;
  notes?: string;
}

export interface AdminContract {
  id: string;
  contract_number: string;
  title: string;
  partner_name: string;
  partner_type: "author" | "publisher" | "university";
  partner_email: string;
  royalty_rate: number;
  is_derogatory: boolean;
  status: "pending_admin_approval" | "en_vigueur" | "rejected" | "resilie";
  created_at: string;
  reviewed_by_juriste: string;
  rejection_reason?: string | null;
  notes?: string;
}

export interface AdminWarehouse {
  id: string;
  name: string;
  code: string;
  country: string;
  city: string;
  manager_name: string;
  total_items: number;
  critical_alerts: number;
}

export interface AdminStockMovement {
  id: string;
  book_title: string;
  warehouse_name: string;
  movement_type: "destruction_perte" | "reassort_imprimerie" | "transfert_inter_hub" | "vente_physique";
  quantity: number;
  reason: string;
  initiated_by: string;
  status: "pending_admin_approval" | "approved" | "rejected";
  rejection_reason?: string | null;
  created_at: string;
}

export interface AdminStockOverview {
  totalPhysicalStock: number;
  totalStockValueXof: number;
  totalWarehouses: number;
  pendingLossAdjustments: number;
  warehouses: AdminWarehouse[];
}

