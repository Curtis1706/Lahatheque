// ─── Modèles TypeScript pour le Dashboard Client (Lecteur / Étudiant) ────────

export interface ClientBookAccess {
  id: string;
  title: string;
  author: string;
  discipline: string;
  format: "EPUB" | "PDF" | "Audio";
  cover_url?: string;
  access_type?: "purchased" | "subscription" | "institution_bundle" | "free_access";
  progress_percent: number;
  last_read_chapter?: string;
  last_read_at?: string;
  isbn_digital?: string;
  isbn_print?: string;
  price_digital?: number;
  has_paper_version?: boolean;
  paper_price?: number;
  description?: string;
  sample_pages_count?: number;
  audio_duration_minutes?: number;
  is_favorite: boolean;
  institution_name?: string;
  
  // Champs de compatibilité rétroactive pour les rôles Enseignant / Auteur
  institution?: string;
  isbn?: string;
  edition_year?: number;
  page_count?: number;
  cover_bg?: string;
  cover_color?: string;
  cover_pattern?: string;
  cover_image?: string;
  is_recommended?: boolean;
  course_code?: string;
  course_name?: string;
  expiresInDays?: number;
}

// Alias de rétrocompatibilité pour les rôles Auteur/Enseignant/Composants hérités
export type StudentBookAccess = ClientBookAccess;

export interface StudentStudyStats {
  weekly_hours: number;
  daily_activity: { day: string; hours: number }[];
  overall_progress: number;
  discipline_breakdown: { name: string; percentage: number; color: string }[];
  current_streak_days: number;
}

export interface ClientSubscription {
  id: string;
  type: "individual_monthly" | "individual_yearly" | "institution_bundle";
  name: string;
  status: "active" | "canceled" | "expired";
  start_date: string;
  next_billing_date: string;
  price: number;
  auto_renew: boolean;
  institution_name?: string;
}

export interface ClientOrder {
  id: string;
  reference: string;
  date: string;
  book_title: string;
  format: "digital" | "paper";
  copies_count: number;
  unit_price: number;
  total_price: number;
  status: "completed" | "pending" | "shipped" | "delivered";
  invoice_url: string;
  shipping_address?: string;
  tracking_number?: string;
}

export interface ClientUniversityAffiliation {
  university_id?: string;
  university_name?: string;
  faculty_name?: string;
  student_card_number?: string;
  proof_document_url?: string;
  status: "none" | "pending" | "approved" | "rejected";
  requested_at?: string;
  rejection_reason?: string;
}

export interface ClientOverviewKpis {
  totalBooksInLibrary: number;
  currentReadingBook?: ClientBookAccess;
  activeSubscriptionStatus: string;
  unpaidOrdersCount: number;
  hasUniversityAffiliation: boolean;
  institutionName?: string;
}
