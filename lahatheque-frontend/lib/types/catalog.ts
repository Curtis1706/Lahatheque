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
  price?: number;
  currency?: string;
  cover_color?: string;
  cover_text_color?: string;
  cover_image?: string;
}
