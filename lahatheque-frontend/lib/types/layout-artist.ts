export interface BookCatalogItem {
  id: string;
  title: string;
  isbn: string;
  authors: string;
  year: string;
  discipline: string;
  language: string;
  country: string;
  faculty: string;
  university: string;
  format: "PDF" | "EPUB" | "AUDIO" | "PAPIER";
  has_audio: boolean;
  status: "draft" | "pending" | "approved" | "rejected";
  created_at: string;
  suggested_summary?: string;
}
