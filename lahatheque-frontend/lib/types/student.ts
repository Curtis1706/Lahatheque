// ─── Modèles TypeScript pour le Dashboard Client (Lecteur / Étudiant) ────────
// 100% aligné sur le plan technique Django et le cahier des charges LAHAThèque v3.2

export interface BookAuthorAPI {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
}

export interface ClientBookAccess {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  authors?: BookAuthorAPI[];
  discipline: string;
  discipline_name?: string;
  format: "EPUB" | "PDF" | "EPUB+TTS" | "PDF+TTS" | "audio" | "epub" | "pdf";
  format_type?: "pdf" | "epub" | "audio";
  cover_url?: string;
  access_type?: string;
  progress_percent: number;
  current_page?: number;
  last_read_chapter?: string;
  last_read_at?: string;
  isbn_digital?: string;
  isbn_print?: string;
  price_digital?: number;
  has_paper_version?: boolean;
  paper_price?: number;
  price_paper?: number;
  description?: string;
  summary?: string;
  sample_pages_count?: number;
  tts_available?: boolean;
  is_favorite: boolean;
  is_completed?: boolean;
  institution_name?: string;
  publisher_name?: string;
  page_count?: number;
  publication_date?: string;
  edition_year?: number;
  language?: string;
  status?: string;
  audio_url?: string;
  narrator?: string;
  
  // Champs de compatibilité
  institution?: string;
  isbn?: string;
  cover_bg?: string;
  cover_color?: string;
  cover_pattern?: string;
  cover_image?: string;
  is_recommended?: boolean;
  course_code?: string;
  course_name?: string;
  expiresInDays?: number;
}

// Alias
export type StudentBookAccess = ClientBookAccess;

export interface StudentStudyStats {
  weekly_hours: number;
  daily_activity: { day: string; hours: number; date?: string }[];
  overall_progress: number;
  discipline_breakdown: { name: string; percentage: number; color: string }[];
  current_streak_days: number;
  total_pages_read: number;
  books_completed_count: number;
  recent_sessions_timeline?: {
    id: string;
    ouvrage_id?: string;
    ouvrage_title: string;
    ouvrage_discipline: string;
    ouvrage_cover_url?: string;
    duration_minutes: number;
    pages_read: number;
    session_date: string;
  }[];
}

export interface ClientOrder {
  id: string;
  reference: string;
  date: string;
  book_title: string;
  format: "digital" | "paper" | "DIGITAL" | "PAPER";
  copies_count: number;
  unit_price: number;
  total_price: number;
  status: "completed" | "pending" | "shipped" | "delivered" | "paid" | "processing" | "cancelled";
  invoice_url?: string;
  shipping_address?: string;
  tracking_number?: string;
  carrier_name?: string;
  estimated_delivery?: string;
  lignes?: Array<{
    id: string;
    ouvrage: string;
    ouvrage_title: string;
    ouvrage_cover_url?: string;
    format_type: "digital" | "paper";
    format_display: string;
    unit_price: number;
    quantity: number;
  }>;
}

export interface ClientUniversityAffiliation {
  university_id?: string;
  university_name?: string;
  faculty_name?: string;
  student_card_number?: string;
  level?: string;
  proof_document_url?: string;
  status: "none" | "pending" | "approved" | "rejected" | "suspended" | "expired";
  status_display?: string;
  motif_rejet?: string;
  requested_at?: string;
  approved_at?: string;
  rejection_reason?: string;
  unlocked_bouquets?: {
    id: string;
    name: string;
    faculty: string;
    books_count: number;
    description: string;
  }[];
}

export interface ClientOverviewKpis {
  totalBooksInLibrary: number;
  currentReadingBook?: ClientBookAccess;
  unlockedBouquetsCount: number;
  unpaidOrdersCount: number;
  hasUniversityAffiliation: boolean;
  institutionName?: string;
  weeklyReadingHours: number;
  readingStreakDays: number;
}
