// ─── Modèles TypeScript pour le Espace Grossiste (wholesaler / super_client) ─

export type WholesalerOrderStatus =
  | "pending" // En attente de validation
  | "validated" // Validée par l'administrateur
  | "processing" // En préparation / expédition
  | "delivered" // Livrée / licences activées
  | "cancelled"; // Annulée

export type WholesaleFormat = "digital_license" | "print_paper" | "both";

export interface WholesalerBookItem {
  id: string;
  title: string;
  authors: string[];
  cover_url: string;
  isbn_digital: string;
  isbn_print?: string;
  discipline: string;
  publisher_name: string;
  digital_wholesale_price: number; // Prix de gros défini par l'Admin (XOF)
  print_wholesale_price: number; // Prix de gros papier (XOF)
  digital_discount_pct?: number; // % remise numérique accordé (ex: 25)
  paper_discount_pct?: number; // % remise papier accordé (ex: 32)
  public_price: number; // Prix public indicatif
  min_quantity: number; // Quantité minimale pour tarif grossiste
  stock_available_print: number;
  sample_excerpt_url?: string;
  summary: string;
}

export interface WholesalerCartItem {
  book_id: string;
  book: WholesalerBookItem;
  digital_licenses_qty: number;
  print_copies_qty: number;
}

export interface WholesalerOrderItem {
  book_id: string;
  title: string;
  authors: string[];
  isbn: string;
  digital_licenses_qty: number;
  digital_unit_price: number;
  print_copies_qty: number;
  print_unit_price: number;
  subtotal: number;
}

export interface WholesalerOrder {
  id: string;
  reference: string;
  created_at: string;
  company_name: string;
  delivery_address: string;
  contact_phone: string;
  items: WholesalerOrderItem[];
  total_digital_licenses: number;
  total_print_copies: number;
  total_amount: number;
  currency: string;
  status: WholesalerOrderStatus;
  invoice_url?: string;
  cancel_reason?: string;
  cancel_requested?: boolean;
  timeline: {
    step: string;
    date: string;
    description: string;
    done: boolean;
  }[];
}

export interface WholesalerNotification {
  id: string;
  type: "nouveaute" | "meilleure_vente";
  title: string;
  book_id: string;
  book_title: string;
  cover_url: string;
  description: string;
  created_at: string;
  is_read: boolean;
  wholesale_price: number;
}

export interface WholesalerKpis {
  pendingOrdersCount: number;
  totalLicensesPurchased: number;
  totalPrintCopiesPurchased: number;
  totalSpentAmount: number;
  unreadNotificationsCount: number;
}

export interface WholesaleDiscountTier {
  id: string;
  name: string;
  min_quantity: number;
  digital_discount_percent: number;
  print_discount_percent: number;
  description: string;
}

export interface WholesaleCompanyProfile {
  company_name: string;
  trade_name?: string;
  nif_number: string;
  rccm_number: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  country: string;
  city: string;
  headquarters_address: string;
  warehouse_address: string;
  tier: WholesaleDiscountTier;
  payment_terms: string;
  verified_partner: boolean;
}

