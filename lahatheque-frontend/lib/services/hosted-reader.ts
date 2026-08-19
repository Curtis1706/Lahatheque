// ─── Service Client pour l'API Lecteur Hébergé (/read/[token]) ─────────────────

export interface HostedReaderTheme {
  brand_name?: string;
  brand_logo_url?: string;
  primary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
  border_color?: string;
  font_family?: string;
  watermark_text?: string;
  watermark_opacity?: number;
  watermark_position?: "diagonal" | "header" | "footer";
  reader_mode?: string;
}

export interface HostedReaderQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer_index?: number;
  correct_answer_indices?: number[];
  explanation?: string;
}

export interface HostedReaderQuizConfig {
  enabled?: boolean;
  title?: string;
  passing_score_percent?: number;
  show_on_last_page?: boolean;
  questions?: HostedReaderQuizQuestion[];
}

export interface HostedReaderTTSConfig {
  enabled?: boolean;
  voice?: string;
  default_rate?: number;
  allowed_languages?: string[];
}

export interface HostedReaderPermissions {
  allow_tts?: boolean;
  allow_annotations?: boolean;
  allow_quiz?: boolean;
}

export interface HostedReaderBookInfo {
  id: string;
  title: string;
  author: string;
  cover_url?: string | null;
  file_url?: string | null;
  total_pages: number;
  has_audio: boolean;
  audio_url?: string | null;
}

export interface HostedReaderEndUser {
  name: string;
  ref: string;
  email: string;
  ip: string;
}

export interface HostedReaderSessionData {
  session_id: string;
  partner_name: string;
  source_type: string;
  book: HostedReaderBookInfo;
  theme: HostedReaderTheme;
  quiz: HostedReaderQuizConfig;
  tts_config: HostedReaderTTSConfig;
  permissions: HostedReaderPermissions;
  return_url: string;
  last_page: number;
  reading_time_seconds: number;
  quiz_completed: boolean;
  quiz_score?: number | null;
  user: HostedReaderEndUser;
}

export interface QuizSubmitPayload {
  token: string;
  answers: Array<{
    question_id: string;
    selected_option_index: number;
  }>;
}

export interface QuizSubmitResponse {
  score_percent: number;
  passing_score_percent: number;
  is_passed: boolean;
  answers_detail: Array<{
    question_id: string;
    question: string;
    selected_option_index: number;
    correct_answer_index: number;
    is_correct: boolean;
    explanation: string;
  }>;
}

export interface ProgressSyncPayload {
  token: string;
  current_page: number;
  reading_time_seconds?: number;
}

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const API_BASE_URL = RAW_API_URL.endsWith("/v1") ? RAW_API_URL : `${RAW_API_URL.replace(/\/+$/, "")}/v1`;

export const hostedReaderApi = {
  /**
   * Valide un token de session et récupère les données de configuration complètes.
   */
  async validateSessionToken(token: string): Promise<HostedReaderSessionData> {
    const endpoint = "/api/bff/reader/sessions/validate-token/";
    let response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).catch(() => null);

    if (!response) {
      response = await fetch(`${API_BASE_URL}/reader/sessions/validate-token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      }).catch(() => null);
    }

    if (response) {
      const resJson = await response.json().catch(() => ({}));
      if (response.ok && resJson.data && resJson.data.book) {
        return resJson.data as HostedReaderSessionData;
      }
      // Rejet immédiat si révoqué, expiré ou invalide
      if (response.status === 403 || response.status === 401 || !response.ok) {
        throw new Error(
          resJson.error || "Cette session de lecture a été révoquée par l'administrateur ou a expiré."
        );
      }
    }

    throw new Error("Impossible de valider la session de lecture auprès du serveur.");
  },

  /**
   * Synchronise la page courante et le temps de lecture passé.
   */
  async syncProgress(payload: ProgressSyncPayload): Promise<void> {
    try {
      await fetch("/api/bff/reader/sessions/progress/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Reader-Token": payload.token,
          "Authorization": `Bearer ${payload.token}`,
        },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.warn("Échec synchronisation progression:", e);
    }
  },

  /**
   * Soumet les réponses d'un quiz interactif validé par l'apprenant.
   */
  async submitQuiz(payload: QuizSubmitPayload): Promise<QuizSubmitResponse> {
    const response = await fetch("/api/bff/reader/sessions/quiz-submit/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Reader-Token": payload.token,
        "Authorization": `Bearer ${payload.token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Erreur de soumission du quiz (${response.status})`);
    }

    const resJson = await response.json();
    return resJson.data as QuizSubmitResponse;
  },
};
