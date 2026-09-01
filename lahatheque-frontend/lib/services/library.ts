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

/**
 * Normalise une stream_url renvoyée par Django (/api/v1/...) vers le proxy BFF Next.js (/api/bff/...).
 * Le backend renvoie des chemins internes Django que le navigateur ne peut pas atteindre directement.
 */
function normalizeBffStreamUrl(streamUrl: string | undefined, bookId: string): string {
  const fallback = `/api/bff/catalog/books/${bookId}/stream/`;
  if (!streamUrl) return fallback;
  // Réécrire /api/v1/catalog/books/{id}/stream/ → /api/bff/catalog/books/{id}/stream/
  if (streamUrl.startsWith('/api/v1/')) {
    return streamUrl.replace('/api/v1/', '/api/bff/');
  }
  return streamUrl;
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
            file: normalizeBffStreamUrl(access?.stream_url, id),
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

  async syncProgress(
    bookId: string,
    currentPage?: number,
    totalPages?: number,
    durationSeconds?: number,
    pagesRead?: number
  ): Promise<boolean> {
    try {
      const page = Math.max(1, currentPage != null ? Number(currentPage) : 1);
      const total = totalPages && Number(totalPages) > 0 ? Number(totalPages) : Math.max(1, page);
      const progressPercent = Math.min(100, Math.max(1, Math.round((page / total) * 100)));

      console.log(`[LIBRARY API] [SYNC PROGRESS] Livre ID=${bookId}, Page=${page}/${total}, Progression=${progressPercent}%, Durée=${durationSeconds || 15}s, Pages=${pagesRead || page}`);

      const res = await fetch("/api/bff/student/reading/progress/", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ouvrage_id: bookId,
          progress_percent: progressPercent,
          current_page: page,
          total_pages: total,
          duration_seconds: Math.max(15, durationSeconds || 15),
          pages_read: Math.max(1, pagesRead || page),
        }),
      });
      return res.ok;
    } catch (err) {
      console.error("[LIBRARY API] [SYNC PROGRESS ERROR]:", err);
      return false;
    }
  },

  async getAnnotations(bookId: string): Promise<Annotation[]> {
    try {
      const res = await fetch(`/api/bff/protection/annotations/?ouvrage=${bookId}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) return [];
      const json = await res.json();
      const results = Array.isArray(json) ? json : json.results || json.data || [];
      return results.map((a: any) => ({
        id: a.id,
        page: a.position_data?.page ?? 0,
        type: a.type || "highlight",
        rect: a.position_data?.rect || { x: 0, y: 0, w: 0, h: 0 },
        color: a.color || "rgba(212,175,55,0.45)",
        content: a.note_content || a.selected_text || "",
        created_at: a.created_at,
      }));
    } catch {
      return [];
    }
  },

  async saveAnnotation(payload: {
    book: string;
    content: string;
    data: any;
  }): Promise<{ id: string }> {
    const body = {
      ouvrage: payload.book,
      type: payload.data?.type || "highlight",
      position_data: {
        page: payload.data?.page ?? 0,
        rect: payload.data?.rect || { x: 0, y: 0, w: 0, h: 0 },
      },
      selected_text: payload.data?.selectedText || "",
      note_content: payload.content || "",
      color: payload.data?.color || "rgba(212,175,55,0.45)",
    };

    const res = await fetch("/api/bff/protection/annotations/", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Erreur lors de la sauvegarde de l'annotation.");
    const json = await res.json();
    return { id: json.id || json.data?.id || `ann-${Date.now()}` };
  },

  async deleteAnnotation(id: string): Promise<boolean> {
    const res = await fetch(`/api/bff/protection/annotations/${id}/`, {
      method: "DELETE",
      credentials: "include",
    });
    return res.ok || res.status === 204;
  },

  async getQuizzes(bookId: string): Promise<QuizData | null> {
    if (!bookId || bookId.startsWith("sample-") || bookId === "preview" || bookId === "demo" || bookId === "lesson_pdf") {
      return null;
    }
    try {
      const res = await fetch(`/api/bff/reader/quizzes/?book_id=${bookId}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) return null;
      const json = await res.json();
      if (!json.success || !json.data) return null;
      return {
        id: json.data.id,
        title: json.data.title,
        questions: (json.data.questions || []).map((q: any) => ({
          id: q.id,
          question: q.question,
          options: q.options,
          correct_index: q.correct_index,
        })),
      };
    } catch {
      return null;
    }
  },

  async submitQuiz(
    quizId: string,
    answers: Record<string, number>
  ): Promise<{ score: number; total: number; passed: boolean }> {
    const res = await fetch(`/api/bff/reader/quizzes/${quizId}/submit/`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    if (!res.ok) throw new Error("Erreur lors de la soumission du quiz.");
    const json = await res.json();
    return {
      score: json.data?.score ?? 0,
      total: json.data?.total ?? 0,
      passed: json.data?.passed ?? false,
    };
  },
};
