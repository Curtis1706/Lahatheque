export type SubmissionStatus = 
  | "draft" 
  | "pending" 
  | "under_review" 
  | "changes_requested" 
  | "approved" 
  | "published";

export interface AuthorSubmission {
  id: string;
  title: string;
  summary?: string;
  language: string;
  version_type: "preview" | "brouillon" | "version_finale";
  status: SubmissionStatus;
  submitted_at: string;
  file_name: string;
  feedback_history?: {
    date: string;
    author_role: "Laha Éditions" | "Chef Maquettiste";
    message: string;
  }[];
  cover_bg?: string;
  cover_color?: string;
}

export interface AuthorBook {
  id: string;
  title: string;
  author: string;
  discipline: string;
  institution: string;
  format: "PDF" | "EPUB" | "Audio";
  cover_bg: string;
  cover_color: string;
  isbn: string;
  edition_year: number;
  sales_count: number;
  downloads_count: number;
  total_revenue: number;
  currency: string;
  publication_date: string;
  sales_by_format: { format: string; percentage: number }[];
  sales_by_country: { country: string; sales: number }[];
}

export interface RoyaltyStatement {
  id: string;
  book_title: string;
  sales_count: number;
  downloads_count: number;
  gross_revenue: number;
  royalty_rate_percent: number;
  amount: number;
  currency: string;
  statement_period: string;
  status: "paid" | "pending";
  payout_date?: string;
  pdf_url?: string;
}

export interface AuthorPurchase {
  id: string;
  order_number: string;
  book_title: string;
  author: string;
  price: number;
  currency: string;
  purchase_date: string;
  format: "PDF" | "EPUB" | "Papier";
  cover_bg: string;
  cover_color: string;
}

export interface AuthorStats {
  total_sales: number;
  total_revenue: number;
  total_downloads: number;
  pending_payout: number;
  next_payout_date: string;
  monthly_sales: { month: string; sales: number }[];
}
