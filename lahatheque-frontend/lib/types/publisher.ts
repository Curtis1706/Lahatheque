// ─── Types Espace Éditeur Tiers (publisher) ──────────────────────────────────
// Alignés sur le plan de specs techniques Django — Section 4.1.7, 4.1.C, 5, 6, 9, 10.3 & 12

export type PublisherEntityType = "company" | "individual";

export type ValidationStep =
  | "step_1_deposited"          // 1. Dépôt effectué
  | "step_2_auto_check"         // 2. Contrôle automatique (fichiers, virus, format)
  | "step_3_editorial_review"   // 3. Examen éditorial LAHA Éditions
  | "step_4_notification"       // 4. Notification (Approbation / Correction demandée)
  | "step_5_published";         // 5. Publication officielle sur la vitrine

export type PublisherBookStatus = "draft" | "pending" | "revision_requested" | "approved" | "published";

export type SalesModel = "purchase" | "subscription" | "free" | "bundle";

export interface ProtectionConfig {
  watermark_enabled: boolean;
  watermark_position: "top-left" | "top-right" | "center" | "bottom-right";
  watermark_opacity: number; // ex: 30%
  user_watermarking: boolean; // Tatouage invisible par utilisateur (Automatique non désactivable)
  lcp_drm_enabled: boolean;
  max_allowed_devices: number;
  max_loan_days: number;
  disable_copy_paste: boolean;
  disable_print: boolean;
  audio_encryption_auto: boolean; // Chiffrement audio (Automatique)
  access_tracing_auto: boolean; // Traçabilité complète IP/User/Appareil (Automatique)
}

export interface PublisherBook {
  id: string;
  publisher_id: string;
  publisher_name: string;
  title: string;
  subtitle?: string;
  isbn_digital: string;
  isbn_print?: string;
  doi?: string;
  authors: string[];
  contributors?: {
    name: string;
    role: "co_author" | "translator" | "prefacer" | "editor";
    orcid?: string;
  }[];
  discipline: string;
  language?: string;
  keywords: string[];
  target_audience: "universitaire" | "professionnel" | "grand_public";
  price: number;
  currency: string;
  sales_model: SalesModel;
  allowed_territories: string[]; // ex: ["Bénin", "Togo", "Côte d'Ivoire", "Monde"]
  embargo_date?: string;
  summary: string;
  authors_bio?: string;
  cover_url?: string;
  file_url?: string;
  file_format?: "pdf" | "epub" | "audio";
  licence_type: "tous_droits_reserves" | "creative_commons";
  contract_reference: string;
  contractual_royalty_rate: number; // Pourcentage en lecture seule convenu au contrat
  status: PublisherBookStatus;
  validation_step: ValidationStep;
  editorial_comment?: string;
  consultations_count: number;
  downloads_count: number;
  revenue_generated: number;
  created_at: string;
  protection_config: ProtectionConfig;
}

export interface PublisherAiMetadataSuggestion {
  summary: string;
  discipline: string;
  language: string;
  country: string;
  suggested_keywords: string[];
  target_audience: "universitaire" | "professionnel" | "grand_public";
  confidence_score: number;
}

export interface PublisherProfileData {
  id: string;
  entity_type: PublisherEntityType;
  company_name: string;
  trade_name?: string;
  logo_url?: string;
  nif_number: string;
  rccm_number?: string;
  identity_card_number?: string;
  country: string;
  city: string;
  headquarters_address: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  bank_name?: string;
  bank_iban?: string;
  bank_swift?: string;
  momo_number?: string;
  contract_reference: string;
  contractual_royalty_rate: number;
  is_verified: boolean;
}

export interface BatchImportReport {
  batch_id: string;
  file_name: string;
  format: "onix_3" | "csv" | "json" | "zip";
  total_records: number;
  success_count: number;
  error_count: number;
  errors: {
    line_number: number;
    isbn_or_title: string;
    error_message: string;
  }[];
  status: "processing" | "completed" | "completed_with_errors" | "failed";
  created_at: string;
}

export interface ApiKey {
  id: string;
  name: string;
  client_id: string;
  client_secret_masked: string;
  client_secret?: string; // Présent uniquement à la création
  permissions: string[];
  created_at: string;
  last_used_at?: string;
  status: "active" | "revoked";
}

export interface PublisherAuditLog {
  id: string;
  book_id: string;
  book_title: string;
  user_email: string;
  access_time: string;
  ip_address: string;
  country: string;
  device: string;
  watermark_trace_code: string;
  is_suspicious?: boolean;
}

export interface PublisherRoyaltyPayment {
  id: string;
  reference?: string;
  amount: number;
  currency: string;
  period: string;
  status: "paid" | "processing" | "pending" | "failed";
  payment_date?: string;
  paid_at?: string;
  payment_method?: string;
  invoice_url?: string;
  pdf_statement_url?: string;
  total_sales_amount?: number;
  royalty_rate?: number;
  net_royalty_amount?: number;
}

export interface PublisherKpis {
  totalBooks: number;
  pendingValidations: number;
  publishedBooks: number;
  totalConsultations: number;
  totalDownloads: number;
  totalRevenue: number;
  pendingRoyalties: number;
  contractualRoyaltyRate: number;
}
