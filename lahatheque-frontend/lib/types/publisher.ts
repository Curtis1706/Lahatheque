// ─── Types Espace Éditeur Tiers (publisher) ──────────────────────────────────
// Alignés sur le plan de specs techniques Django — Section 5 (Dépôt Éditeurs Tiers), 6, 9, 10.3 & 12

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
}

export interface PublisherRoyaltyPayment {
  id: string;
  amount: number;
  currency: string;
  period: string;
  status: "paid" | "processing";
  payment_date: string;
  payment_method: string;
  invoice_url?: string;
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
