// ─── Services Bibliothèque & Lecteur (LahaAcademia Reader) ────────────────────
import type { Annotation } from "@/components/library/flipbook/types";

export const SERVER_ROOT_URL = typeof window !== 'undefined' ? window.location.origin : '';

export interface BookDetail {
  id: string;
  title: string;
  author: string;
  cover?: string;
  thumbnail_url?: string;
  file: string;
  audio_file?: string;
  total_pages: number;
  category?: string;
  subject?: string;
  description?: string;
  progress?: { last_page: number };
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
}

export interface QuizData {
  id: string;
  title: string;
  questions: QuizQuestion[];
}

export const libraryApi = {
  async getBook(id: string): Promise<BookDetail> {
    try {
      const res = await fetch(`/api/bff/student/books/${id}/`, {
        credentials: "include",
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const { ouvrage, access, reading_progress } = json.data;
          return {
            id: ouvrage.id,
            title: ouvrage.title,
            author: ouvrage.authors?.map((a: any) => a.full_name || `${a.first_name || ""} ${a.last_name || ""}`).join(", ") || "Auteur académique",
            file: access?.stream_url || `/api/bff/catalog/books/${id}/stream/`,
            total_pages: ouvrage.page_count || 100,
            category: ouvrage.discipline_name || "Ouvrage Académique",
            subject: ouvrage.collection_name || ouvrage.discipline_name || "Général",
            description: ouvrage.summary || "Ouvrage certifié LAHAThèque.",
            progress: reading_progress ? { last_page: reading_progress.current_page || 0 } : { last_page: 0 },
          };
        }
      }
    } catch {
      // Fallback vers endpoint catalogue si student/books non accessible
    }

    try {
      const catRes = await fetch(`/api/bff/catalog/books/${id}/`, {
        credentials: "include",
        cache: "no-store",
      });
      if (catRes.ok) {
        const catJson = await catRes.json();
        if (catJson.success && catJson.data) {
          const book = catJson.data;
          return {
            id: book.id,
            title: book.title,
            author: book.authors?.map((a: any) => a.full_name || `${a.first_name || ""} ${a.last_name || ""}`).join(", ") || "Auteur académique",
            file: `/api/bff/catalog/books/${id}/stream/`,
            total_pages: book.page_count || 100,
            category: book.discipline_name || "Ouvrage Académique",
            subject: book.collection_name || book.discipline_name || "Général",
            description: book.summary || "Ouvrage certifié LAHAThèque.",
            progress: { last_page: 0 },
          };
        }
      }
    } catch {
      // Fallback
    }

    return {
      id,
      title: "Document Numérique LAHAThèque",
      author: "Éditions LAHAThèque",
      file: `/api/bff/catalog/books/${id}/stream/`,
      total_pages: 50,
      category: "Académique",
      description: "Ouvrage et document numérique certifié LAHAThèque.",
      progress: { last_page: 0 },
    };
  },

  async syncProgress(bookId: string, currentPage?: number, totalPages?: number): Promise<boolean> {
    try {
      const res = await fetch("/api/bff/student/reading-progress/", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          book_id: bookId,
          current_page: currentPage || 0,
          total_pages: totalPages || 0,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async getAnnotations(bookId: string): Promise<Annotation[]> {
    // TODO: Endpoint backend /api/v1/reader/annotations/ à créer
    return [];
  },

  async saveAnnotation(payload: { book: string; content: string; data: any }): Promise<{ id: string }> {
    // TODO: Endpoint backend /api/v1/reader/annotations/ à créer
    return { id: `ann-${Date.now()}` };
  },

  async deleteAnnotation(id: string): Promise<boolean> {
    // TODO: Endpoint backend /api/v1/reader/annotations/ à créer
    return true;
  },

  async getQuizzes(bookId: string): Promise<QuizData | null> {
    // TODO: Endpoint backend /api/v1/reader/quizzes/ à créer
    return null;
  },

  async submitQuiz(quizId: string, answers: Record<string, number>): Promise<{ score: number; total: number; passed: boolean }> {
    // TODO: Endpoint backend /api/v1/reader/quizzes/submit/ à créer
    return { score: 0, total: 0, passed: true };
  },
};
