// ─── Types Espace Juriste (legal_reviewer) ──────────────────────────────────
// Alignés sur le plan de specs techniques Django — Section 4 (Rôle 4) & Sections 10-11

export type ContractType =
  | "author_contract"        // Contrat d'édition auteur
  | "university_agreement"  // Convention / Accord cadre université
  | "publisher_partnership"  // Partenariat éditeur tiers
  | "pre_edition";           // Contrat de pré-édition

export type LegalContractStatus = "active" | "expired" | "pending_signature" | "archived";

export type ClassificationSource = "ai_suggested" | "manual_override";

export interface LegalContract {
  id: string;
  reference: string;
  title: string;
  contracting_party: string;
  party_type: "author" | "university" | "publisher" | "other";
  type: ContractType;
  signed_at: string;
  expires_at?: string;
  file_url: string;
  file_name: string;
  file_size?: number; // octets
  tags: string[];
  status: LegalContractStatus;
  linked_book_id?: string;
  linked_book_title?: string;
  notes?: string;
  amendments?: {
    id: string;
    title: string;
    date: string;
    file_url: string;
  }[];
}

export interface BookRoyalty {
  book_id: string;
  title: string;
  authors: string[];
  current_rate: number; // Pourcentage ex: 15 (15%)
  source: ClassificationSource;
  isbn?: string;
  last_updated: string;
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
}

export interface PreEditionContract {
  id: string;
  title: string; // Titre prévisionnel
  author_name: string;
  university: string;
  faculty: string;
  status: "en_attente_depot" | "depot_lie";
  linked_book_id?: string;
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
  last_updated: string;
  contract_reference?: string;
}

export interface AuthorEmailReport {
  author_id: string;
  name: string;
  email: string;
  last_report_date: string;
  next_report_date: string;
  total_sales_count: number;
  total_royalties_paid: number;
  status: "scheduled" | "sent";
}

export interface ClientDebt {
  id: string;
  client_id: string;
  client_name: string;
  client_email: string;
  amount: number;
  currency: string;
  due_date: string;
  days_overdue: number;
  reminder_count: number;
  last_reminder_at?: string;
  status: "pending" | "reminded" | "final_notice";
}

export interface DebtReminderConfig {
  min_amount_threshold: number;      // Seuil min (ex: 5000 FCFA)
  days_before_first_reminder: number; // Delai (ex: 7 jours)
  max_reminders_count: number;       // Nombre max (ex: 3)
  frequency_days: number;            // Frequence entre relances (ex: 5 jours)
}

export interface LegalKpis {
  totalContracts: number;
  pendingAiSuggestions: number;
  clientsInDebt: number;
  authorRemindersSent: number;
  activePreEditions: number;
}
