// ─── Types Maquettiste & Chef Maquettiste ─────────────────────────────────────
// Alignés sur le plan de specs techniques Django — Section 4 (Rôle 2) & Section C (IA)

export type LayoutDepositStatus =
  | "draft"              // Brouillon (non encore soumis)
  | "pending_validation" // En attente de validation par le Chef Maquettiste
  | "revision_requested" // Correction demandée par le Chef Maquettiste
  | "published";         // Validé et publié sur la vitrine publique

export type ClassificationSource = "ai_suggested" | "manual_override" | "manual";

export type DRMProtectionStatus = "applied" | "pending" | "none";

export interface AudioTrack {
  id: string;
  name: string;
  url: string;
  duration?: string;
  protection_status: DRMProtectionStatus;
}

export interface DepositFiles {
  book_file_url?: string;
  book_file_name?: string;
  book_file_size?: number; // octets
  format: "PDF" | "EPUB" | "AUDIO" | "PAPIER";
  cover_url?: string;
  cover_name?: string;
  audio_files?: AudioTrack[];
}

export interface DepositClassification {
  country: string;
  university: string;
  faculty: string;
  department?: string;
  discipline: string;
  disciplines?: string[];
  target_audience?: string;
  dewey_code?: string;
  collection?: string;
  source: ClassificationSource;
}

export interface DepositMetadata {
  title: string;
  subtitle?: string;
  authors: string[];
  publisher_name?: string;
  publication_year: number;
  language: string;
  language_source: ClassificationSource;
  summary: string;
  summary_source: ClassificationSource;
  isbn?: string;
  keywords?: string[];
  pre_edition_code?: string;
  pre_edition_title?: string;
  pre_edition_author?: string;
}

export interface LayoutDeposit {
  id: string;
  maquettiste_id: string;
  maquettiste_name: string;
  metadata: DepositMetadata;
  classification: DepositClassification;
  files: DepositFiles;
  status: LayoutDepositStatus;
  created_at: string;
  submitted_at?: string;
  validated_at?: string;
  chef_comment?: string;
  default_price: number;
  admin_price?: number;
  is_paper_available?: boolean;
  pre_edition_dossier?: any;
}

export interface SparklinePoint {
  date: string;
  value: number;
}

export interface MaquettisteKpi {
  totalDeposits?: number;
  draftCount: number;
  pendingValidationCount: number;
  revisionRequestedCount: number;
  publishedCount: number;
  timelines?: {
    total?: SparklinePoint[];
    pending: SparklinePoint[];
    published: SparklinePoint[];
    drafts: SparklinePoint[];
    rejected: SparklinePoint[];
  };
}

export interface ChefMaquettisteKpi {
  pendingValidationCount: number;
  validatedThisMonth: number;
  revisionRequestedThisMonth: number;
  averageProcessingTimeHours: number;
  timelines?: {
    pending: SparklinePoint[];
    published: SparklinePoint[];
    rejected: SparklinePoint[];
  };
}

export type DepositFilterStatus = "all" | "draft" | "pending_validation" | "revision_requested" | "published";
