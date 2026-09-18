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
  file_size?: number;
  total_pages: number;
  has_audio: boolean;
  audio_url?: string | null;
  language?: string;
  available_languages?: string[];
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
  access_code?: string;
  session_token?: string;
  device_binding_token?: string;
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
  total_pages?: number;
  reading_time_seconds?: number;
}

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const API_BASE_URL = RAW_API_URL.endsWith("/v1") ? RAW_API_URL : `${RAW_API_URL.replace(/\/+$/, "")}/v1`;

const lastHostedProgressTimestamps: Record<string, number> = {};

export const hostedReaderApi = {
  /**
   * Récupère le jeton secret de terminal lié stocké pour cette session.
   */
  getDeviceBindingToken(token: string): string | null {
    if (typeof window === "undefined" || !token) return null;
    const storageKey = `laha_reader_device_${token.slice(0, 32)}`;
    return sessionStorage.getItem(storageKey);
  },

  /**
   * Récupère le jeton JWT actif pour les appels sécurisés (stream, progress, quiz).
   * Si la session a été ouverte par un code d'accès court (S-04), le JWT retourné
   * lors de la validation est conservé en sessionStorage.
   */
  getActiveToken(token: string): string {
    if (typeof window === "undefined" || !token) return token;
    const tokenStorageKey = `laha_reader_token_${token.slice(0, 32)}`;
    return sessionStorage.getItem(tokenStorageKey) || token;
  },

  /**
   * Valide un token de session et récupère les données de configuration complètes.
   * Gère le verrouillage anti-partage de navigateur via le secret de liaison.
   */
  async validateSessionToken(token: string): Promise<HostedReaderSessionData> {
    const endpoint = "/api/bff/reader/sessions/validate-token/";
    const storageKey = `laha_reader_device_${token.slice(0, 32)}`;
    const storedDeviceToken = typeof window !== "undefined" ? sessionStorage.getItem(storageKey) : null;

    const reqHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (storedDeviceToken) {
      reqHeaders["X-Reader-Device-Token"] = storedDeviceToken;
    }

    const payload: { token: string; device_binding_token?: string } = { token };
    if (storedDeviceToken) {
      payload.device_binding_token = storedDeviceToken;
    }

    let response = await fetch(endpoint, {
      method: "POST",
      headers: reqHeaders,
      credentials: "include",
      body: JSON.stringify(payload),
    }).catch(() => null);

    if (!response) {
      response = await fetch(`${API_BASE_URL}/reader/sessions/validate-token/`, {
        method: "POST",
        headers: reqHeaders,
        credentials: "include",
        body: JSON.stringify(payload),
      }).catch(() => null);
    }

    if (response) {
      const resJson = await response.json().catch(() => ({}));
      if (response.ok && resJson.data && resJson.data.book) {
        if (typeof window !== "undefined") {
          if (resJson.data.device_binding_token) {
            sessionStorage.setItem(storageKey, resJson.data.device_binding_token);
          }
          if (resJson.data.session_token) {
            const tokenStorageKey = `laha_reader_token_${token.slice(0, 32)}`;
            sessionStorage.setItem(tokenStorageKey, resJson.data.session_token);
          }
        }
        return resJson.data as HostedReaderSessionData;
      }
      // Rejet immédiat si révoqué, expiré ou verrouillé sur un autre navigateur
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
   * Débouncé à 30 secondes pour ne pas surcharger le serveur lors des changements rapides de page.
   */
  async syncProgress(payload: ProgressSyncPayload, force: boolean = false): Promise<void> {
    try {
      const now = Date.now();
      const tokenKey = payload.token ? payload.token.slice(0, 32) : "default";
      const lastSync = lastHostedProgressTimestamps[tokenKey] || 0;
      if (!force && (now - lastSync < 30000)) {
        return;
      }
      lastHostedProgressTimestamps[tokenKey] = now;

      const activeToken = this.getActiveToken(payload.token);
      const deviceToken = this.getDeviceBindingToken(payload.token);
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Reader-Token": activeToken,
        "Authorization": `Bearer ${activeToken}`,
      };
      if (deviceToken) {
        headers["X-Reader-Device-Token"] = deviceToken;
      }

      await fetch("/api/bff/reader/sessions/progress/", {
        method: "POST",
        headers,
        credentials: "include",
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
    const activeToken = this.getActiveToken(payload.token);
    const deviceToken = this.getDeviceBindingToken(payload.token);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Reader-Token": activeToken,
      "Authorization": `Bearer ${activeToken}`,
    };
    if (deviceToken) {
      headers["X-Reader-Device-Token"] = deviceToken;
    }

    const response = await fetch("/api/bff/reader/sessions/quiz-submit/", {
      method: "POST",
      headers,
      credentials: "include",
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
