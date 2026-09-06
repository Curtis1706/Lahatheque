// ─── Types Espace Juriste (legal_reviewer) ──────────────────────────────────
// Alignés sur le plan de specs techniques Django — Section 4 (Rôle 4) & Sections 10-11

export type ContractType =
  | "author_contract"        // Contrat d'édition auteur
  | "university_agreement"  // Convention / Accord cadre université
  | "publisher_partnership"  // Partenariat éditeur tiers
  | "pre_edition";           // Contrat de pré-édition

export type LegalContractStatus = "active" | "expired" | "pending_signature" | "archived";

export type ClassificationSource = "ai_suggested" | "manual_override";

export interface EligibleContractBook {
  id: string;
  title: string;
  isbn: string;
  status: string;
  cover_url: string;
  authors: string[];
  author_user_ids: string[];
  is_paper_available?: boolean;
  has_audio_tracks?: boolean;
  price_digital?: number | null;
  price_paper?: number | null;
  price_audio?: number | null;
}

export interface EligibleContractAuthor {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface EligibleContractPublisher {
  id: string;
  name: string;
  email: string;
  rate: number;
}

export interface EligibleContractInstitution {
  id: string;
  name: string;
  country: string;
  rate: number;
}

export interface EligibleContractPreEdition {
  id: string;
  code: string;
  title: string;
  author_name: string;
  author_email: string;
}

export interface EligibleContractJuriste {
  id: string;
  first_name?: string;
  last_name?: string;
  name: string;
}

export interface ContractFormOptions {
  ouvrages: EligibleContractBook[];
  authors: EligibleContractAuthor[];
  publishers: EligibleContractPublisher[];
  institutions: EligibleContractInstitution[];
  pre_editions: EligibleContractPreEdition[];
  juristes_disponibles?: EligibleContractJuriste[];
}

export interface ContractRoyaltySplit {
  id?: string;
  user_id?: string;
  name?: string;
  beneficiaire_nom?: string;
  role_libelle: string;
  pourcentage: number;
  taux_papier?: number;
  taux_numerique?: number;
  taux_audio_tts?: number;
}

export interface LegalContract {
  id: string;
  reference: string;
  title: string;
  contracting_party: string;
  contracting_party_email?: string;
  contracting_party_phone?: string;
  juriste_responsable?: {
    id: string;
    name: string;
  } | null;
  party_type: "author" | "university" | "publisher" | "other";
  type: ContractType;
  signed_at: string;
  expires_at?: string;
  file_url: string;
  file_name: string;
  file_size?: number; // octets (jusqu'à 800 Mo)
  tags: string[];
  status: LegalContractStatus;
  notes?: string;
  extracted_text?: string;
  extracted_text_preview?: string;
  indexing_status?: "pending" | "processing" | "indexed" | "failed";
  ocr_engine_used?: string;
  ocr_confidence_score?: number;
  snippet_highlight?: string;
  relevance_rank?: number;
  
  // Liaisons directes avec les entités réelles
  ouvrage_id?: string;
  ouvrage_title?: string;
  ouvrage_cover?: string;
  ouvrage_isbn?: string;
  signataire_user_id?: string;
  signataire_name?: string;
  
  ouvrage?: {
    id: string;
    title: string;
    isbn: string;
    status: string;
    cover_url: string;
    total_sales_count: number;
    total_sales_revenue: number;
  };
  signataire?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  author_royalty_rate?: number;
  repartitions?: ContractRoyaltySplit[];
  linked_book_id?: string;
  linked_book_title?: string;
  amendments?: {
    id: string;
    title: string;
    date?: string;
    signed_at?: string;
    file_url?: string;
  }[];
  avenants?: {
    id: string;
    reference: string;
    title: string;
    signed_at: string;
    notes?: string;
    file_name?: string;
  }[];
}

export interface BookRoyalty {
  book_id: string;
  title: string;
  authors: string[];
  current_rate: number; // Pourcentage ex: 15 (15%)
  institution?: {
    id: string;
    name: string;
    royalty_rate: number;
  } | null;
  university_share_percent?: number | null;
  source: ClassificationSource;
  isbn?: string;
  last_updated: string;
  paper_rate?: number;
  digital_rate?: number;
  audio_tts_rate?: number; // Quote-part écoutes Audio TTS (Text-To-Speech)
  has_paper_version?: boolean;
  has_audio_version?: boolean;
  history: {
    date: string;
    rate: number;
    changed_by: string;
    applied_retroactively: boolean;
  }[];
}

export interface CoAuthorSplit {
  author_name: string;
  author_email?: string;
  percentage: number;
}

export interface AIRoyaltySuggestion {
  id: string;
  book_id: string;
  title: string;
  authors: string[];
  proposed_splits: CoAuthorSplit[];
  is_validated: boolean;
  ai_confidence: number; // ex: 92%
  extracted_clause?: string;
  suggested_rate?: number;
  pourcentage_suggere?: number;
}

export interface PreEditionContract {
  id: string;
  code_dossier?: string;
  title: string; // Titre prévisionnel
  author_name: string;
  author_email?: string;
  author_user_id?: string;
  university: string;
  faculty: string;
  expected_delivery_date?: string;
  status: "en_attente_depot" | "maquette_en_cours" | "depot_lie" | "valide_legalement" | "archive";
  linked_book_id?: string;
  contract_id?: string;
  contract_reference?: string;
  notes?: string;
  created_at: string;
}

export interface UniversityRoyalty {
  university_id: string;
  name: string;
  country: string;
  fixed_rate_percentage: number; // Toujours 15% (Section 10.2)
  total_sales_generated: number;
  amount_due: number;
  currency: string;
  status: "up_to_date" | "pending_transfer";
  contract_reference?: string;
}

export interface ThirdPartyPublisherRoyalty {
  publisher_id: string;
  name: string;
  contractual_rate: number; // Taux négocié modifiable par le juriste
  total_sales: number;
  amount_due: number;
  currency: string;
  last_updated?: string;
  status?: string;
  country?: string;
  contract_reference?: string;
}

export interface AuthorEmailReport {
  author_id?: string;
  report_id?: string;
  name?: string;
  author_name?: string;
  email?: string;
  author_email?: string;
  last_report_date?: string;
  next_report_date?: string;
  total_sales_count?: number;
  total_royalties_paid?: number;
  total_revenue_reported?: number;
  currency?: string;
  books_covered?: string[];
  sent_at?: string;
  status: "scheduled" | "sent" | "pending";
}

export interface ClientDebt {
  id: string;
  client_id?: string;
  client_name: string;
  client_email: string;
  client_type?: string;
  client_phone?: string;
  country?: string;
  amount?: number;
  unpaid_invoices_count?: number;
  total_debt_amount?: number;
  currency: string;
  due_date?: string;
  days_overdue: number;
  reminder_count: number;
  last_reminder_at?: string;
  status: "pending" | "reminded" | "final_notice" | "formal_notice" | "relance_niveau_1" | "relance_niveau_2" | "relance_niveau_3" | string;
  source?: "wholesale_credit" | "author_credit" | "unpaid_order" | string;
  reference_document?: string;
  motive?: string;
  notes?: string;
  auto_remind_enabled?: boolean;
  is_credit?: boolean;
}

export interface CreateClientDebtPayload {
  client_name: string;
  client_email: string;
  client_type: "bookstore" | "wholesaler" | "institution" | "author" | "individual" | "other";
  client_phone?: string;
  country?: string;
  amount: number;
  currency?: string;
  due_date: string;
  issue_date?: string;
  motive?: string;
  reference_document?: string;
  auto_remind_enabled?: boolean;
  initial_reminder_level?: 1 | 2 | 3;
  send_immediate_reminder?: boolean;
  cc_accountant?: boolean;
  notes?: string;
  file_name?: string;
}

export interface DebtReminderConfig {
  min_amount_threshold?: number;      // Seuil min (ex: 5000 FCFA)
  days_before_first_reminder?: number; // Delai (ex: 7 jours)
  max_reminders_count?: number;       // Nombre max (ex: 3)
  frequency_days?: number;            // Frequence entre relances (ex: 5 jours)
  auto_remind_enabled?: boolean;
  first_reminder_days?: number;
  second_reminder_days?: number;
  formal_notice_days?: number;
  auto_suspend_after_days?: number;
  cc_accountant?: boolean;
  accountant_email?: string;
}

export interface LegalKpis {
  totalContracts: number;
  pendingAiSuggestions: number;
  clientsInDebt: number;
  authorRemindersSent: number;
  activePreEditions: number;
  timeline?: { date: string; value: number }[];
}

export type PeriodType = "monthly" | "quarterly";

export interface SendAuthorStatementPayload {
  author_id: string;
  period_type: PeriodType;
  year: number;
  month?: number;
  quarter?: number;
  include_pdf?: boolean;
  custom_note?: string;
}

export interface SendBatchAuthorStatementsPayload {
  period_type: PeriodType;
  year: number;
  month?: number;
  quarter?: number;
  include_pdf?: boolean;
}

export interface SendDebtReminderPayload {
  debt_id: string;
  reminder_level: 1 | 2 | 3;
  custom_note?: string;
  custom_message?: string;
  cc_accountant?: boolean;
  client_id?: string;
  client_email?: string;
  amount?: number;
  days_overdue?: number;
}

export interface SendInstitutionStatementPayload {
  entity_type: "university" | "publisher";
  entity_id: string;
  period_type: PeriodType;
  year: number;
  month?: number;
  quarter?: number;
  include_pdf?: boolean;
  custom_note?: string;
}

export interface PendingPublicationBook {
  id: string;
  title: string;
  authors: string[];
  discipline: string;
  has_active_contract: boolean;
  cover_url?: string | null;
  created_at?: string | null;
}


