// ─── Modèles TypeScript pour le Espace Université (librarian / university) ──

export interface UniversityBook {
  id: string;
  title: string;
  authors: string[];
  cover_url: string;
  discipline: string;
  faculty: string;
  department: string;
  format_types: ("epub" | "pdf" | "audio" | "journal" | "thesis")[];
  isbn_digital: string;
  isbn_print?: string;
  consultations_count: number;
  downloads_count: number;
  audio_listens_count: number;
  revenue_generated: number; // Revenus générés par les ventes (XOF)
  royalty_15_percent: number; // Part de redevance fixe 15% pour l'université (XOF)
}

export interface UniversityBundle {
  id: string;
  title: string;
  description: string;
  book_count: number;
  target_audience: "etudiants" | "enseignants" | "recherche" | "general";
  faculty_scope?: string;
  subscription_price: number;
  status: "active" | "renewable" | "expired";
  start_date: string;
  end_date: string;
  university_usage_share_percentage: number; // Part d'utilisation réelle de cette université
  university_royalty_amount: number; // Part financière propre à l'université (confidentialité inter-établissements)
}

export interface UniversityPaperPurchase {
  id: string;
  reference: string;
  date: string;
  bundle_name?: string;
  title: string;
  copies_count: number;
  unit_price: number;
  total_price: number;
  status: "pending" | "shipped" | "delivered";
  tracking_number?: string;
}

export interface UniversityRoyaltyPayment {
  id: string;
  period: string;
  total_sales_generated: number; // Revenus totaux bruts
  royalty_rate_percentage: 15; // Taux fixe à 15% (Cahier v3.2 section 10.2)
  royalty_amount_due: number;
  paid_amount: number;
  remaining_balance: number;
  payment_date: string;
  receipt_url: string;
}

export interface UniversityKpis {
  totalBooksCount: number;
  totalConsultations: number;
  totalDownloads: number;
  totalAudioListens: number;
  totalRevenue: number;
  pendingRoyalties: number;
  paidRoyalties: number;
  remainingBalance: number;
  activeBundlesCount: number;
  institutionName: string;
}
