export interface AuthorSubmission {
  id: string;
  title: string;
  discipline: string;
  status: "draft" | "pending" | "under_review" | "approved" | "rejected";
  submitted_at: string;
  file_name: string;
  feedback?: string;
}

export interface RoyaltyStatement {
  id: string;
  book_title: string;
  sales_count: number;
  downloads_count: number;
  amount: number;
  currency: string;
  statement_period: string;
  status: "paid" | "pending";
  payout_date?: string;
}

export interface AuthorContract {
  id: string;
  reference: string;
  book_title: string;
  royalty_rate: number; // en pourcentage (ex: 10 pour 10%)
  signed_at: string;
  contract_file: string;
}
