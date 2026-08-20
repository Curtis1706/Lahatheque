// ─── Modèles TypeScript pour le Dashboard Auteur (author) ───────────────────

export interface AuthorPublishedBook {
  id: string;
  title: string;
  cover_url: string;
  published_at: string;
  sales_count: number;
  downloads_count: number;
  total_revenue_generated: number; // Revenus totaux générés par l'ouvrage (XOF)
  author_royalty_share_amount: number; // Part propre rétribuée à cet auteur (XOF)
  author_percentage_rate: number; // % du contrat de cet auteur
  format_breakdown: { digital: number; paper: number; audio: number };
  country_breakdown: { country: string; sales: number }[];
  isbn_digital: string;
  isbn_print?: string;
  discipline: string;
}

export interface AuthorSubmission {
  id: string;
  title: string;
  manuscript_file_url: string;
  submitted_at: string;
  version_type: "preview" | "brouillon" | "finale";
  // Étape 1 Étude (Auteur) vs Étape 2 Préparation Catalogue (Maquettiste)
  status:
    | "study_pending"
    | "correction_requested"
    | "rejected"
    | "accepted"
    | "catalog_preparation"
    | "validation_pending"
    | "published";
  review_notes?: string;
  suggested_summary?: string;
  suggested_language?: string;
}

export interface AuthorRoyaltyPayment {
  id: string;
  period: string;
  total_sales_count: number;
  gross_revenue: number;
  author_percentage_rate: number;
  author_earned_amount: number; // Part propre à cet auteur
  status: "paid" | "pending";
  payment_date: string;
  receipt_url: string;
}

// Interfaces de rétrocompatibilité pour composants hérités
export interface AuthorStats {
  total_sales: number;
  total_downloads: number;
  total_revenue: number;
  pending_payout: number;
  next_payout_date: string;
  monthly_sales: { month: string; sales: number }[];
}

export interface RoyaltyStatement {
  id: string;
  statement_period: string;
  book_title: string;
  sales_count: number;
  gross_revenue: number;
  currency: string;
  royalty_rate_percent: number;
  amount: number;
  status: "paid" | "pending";
  payout_date?: string;
}

export interface AuthorDelegateAccess {
  id: string;
  name: string;
  email: string;
  role: "co_author" | "assistant";
  status: "active" | "invited";
  added_at: string;
}

export interface AuthorKpis {
  totalSales: number;
  totalDownloads: number;
  totalRevenueGenerated: number;
  authorPendingRoyalties: number;
  authorPaidRoyalties: number;
  nextPaymentDate: string;
  nextPaymentAmount: number;
  activeSubmissionsCount: number;
  publishedBooksCount: number;
  authorName: string;
  timelines?: {
    sales: { date: string; value: number }[];
    royalties: { date: string; value: number }[];
  };
}
