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

const mockBookDetails: Record<string, BookDetail> = {
  "book-001": {
    id: "book-001",
    title: "PromptBreeder: Self-Referential Self-Improvement via Prompt Evolution",
    author: "DeepMind / LAHAThèque Research",
    file: "/api/pdf?file=PromptBreeder_Original_Paper-2309.16797v1.pdf",
    audio_file: "/mock/audio/narration-sample.mp3",
    total_pages: 28,
    category: "Recherche & Technologie",
    subject: "Intelligence Artificielle",
    description: "Document de référence scientifique sur la génération et l'évolution autonome d'instructions IA.",
    progress: { last_page: 0 },
  },
  "ctr-2026-001": {
    id: "ctr-2026-001",
    title: "Convention Cadre d'Édition et Diffusion Universitaire — UAC",
    author: "Université d'Abomey-Calavi (UAC)",
    file: "/api/pdf?file=PromptBreeder_Original_Paper-2309.16797v1.pdf",
    total_pages: 28,
    category: "Convention Légale",
    subject: "Droit des Contrats",
    description: "Convention institutionnelle régissant la publication des travaux de recherche à l'UAC.",
    progress: { last_page: 0 },
  },
};

export const libraryApi = {
  async getBook(id: string): Promise<BookDetail> {
    await new Promise((r) => setTimeout(r, 300));
    if (mockBookDetails[id]) {
      return mockBookDetails[id];
    }
    return {
      id,
      title: `PromptBreeder: Self-Referential Self-Improvement via Prompt Evolution`,
      author: "Éditions LAHAThèque",
      file: "/api/pdf?file=PromptBreeder_Original_Paper-2309.16797v1.pdf",
      total_pages: 28,
      category: "Recherche",
      description: "Ouvrage et document numérique certifié LAHAThèque.",
      progress: { last_page: 0 },
    };

  },

  async syncProgress(arg1: any, arg2?: number, arg3?: number): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 100));
    return true;
  },

  async getAnnotations(bookId: string): Promise<Annotation[]> {
    await new Promise((r) => setTimeout(r, 200));
    return [];
  },

  async saveAnnotation(payload: { book: string; content: string; data: any }): Promise<{ id: string }> {
    await new Promise((r) => setTimeout(r, 200));
    return { id: `ann-${Date.now()}` };
  },

  async deleteAnnotation(id: string): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 100));
    return true;
  },

  async getQuizzes(bookId: string): Promise<QuizData | null> {
    await new Promise((r) => setTimeout(r, 200));
    return {
      id: `quiz-${bookId}`,
      title: "Évaluation de fin de lecture — PromptBreeder",
      questions: [
        {
          id: "q1",
          question: "Quel est l'objectif principal de PromptBreeder ?",
          options: [
            "Générer des images 3D",
            "Faire évoluer de manière autonome des prompts pour optimiser les performances des LLM",
            "Traduire des textes en latin",
            "Compresser les fichiers PDF"
          ],
          correct_index: 1,
        },
        {
          id: "q2",
          question: "Quel mécanisme d'évolution est utilisé par PromptBreeder ?",
          options: [
            "Des algorithmes génétiques auto-référentiels",
            "Une recherche linéaire manuelle",
            "Le hasard simple",
            "La suppression de texte"
          ],
          correct_index: 0,
        },
      ],
    };
  },

  async submitQuiz(quizId: string, answers: Record<string, number>): Promise<{ score: number; total: number; passed: boolean }> {
    await new Promise((r) => setTimeout(r, 300));
    return { score: 2, total: 2, passed: true };
  },
};
