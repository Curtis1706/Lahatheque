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
  isbn: string;
  title: string;
  subtitle?: string;
  authors_details: AuthorDetail[];
  discipline_detail: DisciplineDetail;
  publisher_name: string;
  institution_name: string;
  format_type: "pdf" | "epub" | "audio";
  language: string;
  country: string;
  summary: string;
  publication_year?: number;
  price?: number;
  price_paper?: number;
  price_audio?: number;
  has_audio_version?: boolean;
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
}
