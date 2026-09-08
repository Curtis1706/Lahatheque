export interface AuthorDetail {
  first_name: string;
  last_name: string;
}

export interface DisciplineDetail {
  id: number;
  name: string;
}

export interface Book {
  id: string;
  slug?: string;
  isbn: string;
  title: string;
  subtitle?: string;
  authors_details: AuthorDetail[];
  discipline_detail: DisciplineDetail;
  publisher_name: string;
  institution_name: string;
  format_type: "pdf" | "epub" | "audio" | "papier";
  language: string;
  country: string;
  summary: string;
  publication_year?: number;
  price?: number;
  price_paper?: number;
  price_audio?: number;
  price_audio_eur?: number;
  has_audio_version?: boolean;
  has_audio?: boolean;
  audio_status?: string;
  stock_disponible?: number;
  is_paper_available?: boolean;
  is_digital_available?: boolean;
  level?: string;
  total_pages?: number;
  rating?: number;
  currency?: string;
  cover_color?: string;
  cover_text_color?: string;
  cover_image?: string;
  cover_url?: string;
  available_languages?: string[];
  languages?: LanguageVersionItem[];
}

export interface LanguageVersionItem {
  id: string;
  language: string;
  is_original: boolean;
  title: string;
  summary?: string;
  r2_key_pdf?: string;
  r2_key_epub?: string;
  r2_key_audio?: string;
  cover_url?: string;
  page_count: number;
  is_paper_available: boolean;
  paper_stock: number;
  translation_status: "ready" | "in_progress" | "draft";
  created_at?: string;
}

export interface OuvrageLanguageVersion extends LanguageVersionItem {
  ouvrage_id?: string;
}

