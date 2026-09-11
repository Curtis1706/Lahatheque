// =========================================================================
// TYPES & DTOS FINANCIERS - SUITE GESTION DES FINANCES
// Conformes aux spécifications de réconciliation dynamique et zéro encombrement
// =========================================================================

export type SaleChannel = 'b2c_individual' | 'b2b_university' | 'b2b_wholesale';
export type ItemFormat = 'digital' | 'paper' | 'audio' | 'bouquet';

// -------------------------------------------------------------------------
// Ventes & Revenus (/admin/sales)
// -------------------------------------------------------------------------

export interface AdminSaleOrderItem {
  id: string;
  book_id?: string;
  book_title: string;
  isbn?: string;
  cover_url?: string;
  author_names?: string[];
  author_display?: string;
  institution_name?: string;
  publisher_name?: string;
  format: ItemFormat;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  subtotal: number;
}

export interface AdminSaleOrder {
  id: string;
  order_reference: string;
  channel: SaleChannel;
  channel_label: string;
  buyer_name: string;
  buyer_email: string;
  buyer_role: 'student' | 'author' | 'university' | 'wholesaler' | 'client';
  created_at: string;
  payment_method: string;
  payment_status: 'paid' | 'pending' | 'failed' | 'refunded' | 'abandoned' | 'credit' | 'cancelled';
  payment_status_display?: string;
  is_paid?: boolean;
  gross_amount: number;
  discount_total: number;
  net_amount_paid: number;
  items_count: number;
  items: AdminSaleOrderItem[];
}

export interface AdminSalesConsolidatedResponse {
  total_revenue_consolidated: number;
  total_orders_count: number;
  channel_breakdown: {
    b2c_individual: { amount: number; orders_count: number; percentage: number };
    b2b_university: { amount: number; orders_count: number; percentage: number };
    b2b_wholesale: { amount: number; orders_count: number; percentage: number };
  };
  orders: AdminSaleOrder[];
  available_institutions?: string[];
  available_publishers?: string[];
}

// -------------------------------------------------------------------------
// Demandes de Versement (/admin/payouts)
// -------------------------------------------------------------------------

export interface AdminPayoutRequest {
  id: string;
  beneficiary_id: string;
  beneficiary_name: string;
  beneficiary_type: 'author' | 'publisher' | 'university';
  beneficiary_email: string;
  purpose_label: string;
  gross_base_amount: number;
  effective_rate_percent: number;
  net_payout_amount: number;
  payment_method: 'mobile_money' | 'bank_transfer' | string;
  payment_details_preview: string;
  status: 'pending' | 'approved' | 'processed' | 'rejected';
  transaction_reference?: string | null;
  payout_date?: string | null;
  receipt_file_url?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  processed_at?: string | null;
}

export interface AdminPayoutKpis {
  total_pending_amount: number;
  pending_count: number;
  total_settled_this_month: number;
  settled_this_month_count: number;
  distinct_beneficiaries_count: number;
  average_processing_time_hours: number;
}

export interface AdminPayoutsListResponse {
  count: number;
  page: number;
  total_pages: number;
  results: AdminPayoutRequest[];
}

// -------------------------------------------------------------------------
// Synthèse Multi-Partenaires & Redevances (/admin/finance)
// -------------------------------------------------------------------------

export interface AdminPartnerBookDetail {
  book_id: string;
  title: string;
  format: ItemFormat;
  units_or_reads_count: number;
  effective_rate_percent: number;
  gross_revenue_generated: number;
  royalties_earned: number;
}

export interface AdminPartnerRoyaltySummary {
  partner_id: string;
  partner_name: string;
  partner_type: 'author' | 'publisher' | 'university';
  books_count: number;
  total_units_sold: number;
  average_rate_percent: number;
  total_revenue_generated: number;
  total_royalties_due: number;
  total_royalties_paid: number;
  balance_outstanding: number;
  books: AdminPartnerBookDetail[];
}

// -------------------------------------------------------------------------
// Supervision & Cycle de Vie des Commandes (/admin/orders)
// -------------------------------------------------------------------------

export type AdminOrderPaymentStatus =
  | 'all'
  | 'paid'
  | 'pending'
  | 'credit'
  | 'abandoned'
  | 'failed'
  | 'cancelled';

export interface AdminOrderItemDetail {
  id: string;
  book_id?: string | null;
  book_title: string;
  format: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface AdminOrder {
  id: string;
  numero_commande: string;
  order_reference: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_role: string;
  total_amount: number;
  currency: string;
  statut_paiement: 'paid' | 'pending' | 'credit' | 'abandoned' | 'failed' | 'cancelled' | string;
  statut_paiement_display: string;
  statut_commande: string;
  statut_commande_display: string;
  mode_paiement: string;
  mode_paiement_display: string;
  is_credit_purchase: boolean;
  credit_due_date?: string | null;
  moneroo_id?: string | null;
  manual_payment_reference?: string;
  manual_payment_confirmed_by?: string | null;
  created_at: string;
  abandoned_at?: string | null;
  last_reminder_sent_at?: string | null;
  items_count: number;
  items: AdminOrderItemDetail[];
}

export interface AdminOrdersKpis {
  total_orders_count: number;
  paid_count: number;
  pending_count: number;
  credit_count: number;
  abandoned_count: number;
  failed_count: number;
  cancelled_count: number;
  total_paid_amount: number;
  total_credit_amount: number;
  potential_abandoned_loss: number;
}

export interface AdminOrdersResponse {
  kpis: AdminOrdersKpis;
  orders: AdminOrder[];
  total: number;
  current_page: number;
  total_pages: number;
}

