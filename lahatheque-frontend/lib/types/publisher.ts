export interface PublisherStats {
  total_royalties: number;
  total_views: number;
  total_downloads: number;
  average_commission_rate: number; // Taux de commission de la plateforme, ex: 15%
}

export type BookSubmissionStatus = 'draft' | 'pending' | 'approved' | 'rejected';
export type SalesModel = 'purchase' | 'subscription' | 'free';

export interface BookSubmission {
  id: string;
  title: string;
  subtitle?: string;
  isbn_digital?: string;
  isbn_print?: string;
  authors: string[];
  price: number;
  currency: string;
  sales_model: SalesModel;
  status: BookSubmissionStatus;
  created_at: string;
  summary: string;
  reject_reason?: string; // Motif de rejet en cas de statut 'rejected'
}
