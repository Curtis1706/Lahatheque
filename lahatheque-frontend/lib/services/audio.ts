/**
 * Service Livre Audio LAHAThèque
 * Gestion du téléversement, streaming HLS signé et progression d'écoute.
 * Zéro emoji, typé TypeScript.
 */

import {
  AudioStreamSession,
  AudioTrackItem,
  AudioListeningProgress,
  AudioTrackUploadResult,
} from "@/lib/types/audio";

export interface AudioTrackUploadResponse {
  success: boolean;
  data?: AudioTrackUploadResult;
  error?: string;
}

export interface AudioStreamSessionResponse {
  success: boolean;
  data?: AudioStreamSession;
  error?: string;
}

export interface AudioProgressResponse {
  success: boolean;
  data?: AudioListeningProgress;
  error?: string;
}

export interface AudioLockVerificationResponse {
  success: boolean;
  data?: {
    ouvrage_id: string;
    title: string;
    tracks_count: number;
    tracks: Array<{
      track_id: string;
      stream_id: string;
      title: string;
      signed_urls_locked: boolean;
      status: string;
      is_ready: boolean;
    }>;
    all_locked: boolean;
  };
  error?: string;
}

/**
 * Téléversement ou remplacement d'un fichier audio (MP3 / M4B / AAC) vers Cloudflare Stream sécurisé.
 */
export async function uploadAudioTrack(
  ouvrageId: string,
  file: File,
  title?: string,
  durationSeconds?: number,
  replace: boolean = false,
  priceAudio?: number
): Promise<AudioTrackUploadResponse> {
  const formData = new FormData();
  formData.append("ouvrage_id", ouvrageId);
  formData.append("file", file);
  formData.append("title", title || file.name);
  if (durationSeconds) {
    formData.append("duration_seconds", String(Math.round(durationSeconds)));
  }
  if (replace) {
    formData.append("replace", "true");
  }
  if (priceAudio !== undefined && priceAudio !== null) {
    formData.append("price_audio", String(priceAudio));
  }

  const res = await fetch("/api/bff/audio/tracks/upload/", {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  return res.json();
}

/**
 * Récupère la session de streaming audio HLS signée pour un ouvrage (accès complet ou extrait 180s).
 */
export async function getAudioStreamSession(
  ouvrageId: string
): Promise<AudioStreamSessionResponse> {
  const res = await fetch(`/api/bff/audio/ouvrages/${ouvrageId}/session/`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  return res.json();
}

/**
 * Enregistre la progression d'écoute audio.
 */
export async function saveAudioListeningProgress(
  trackId: string,
  durationListenedSeconds: number,
  completionPercent: number = 0
): Promise<AudioProgressResponse> {
  const res = await fetch(`/api/bff/audio/tracks/${trackId}/progress/`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      duration_listened_seconds: Math.round(durationListenedSeconds),
      completion_percent: Math.min(100, Math.max(0, completionPercent)),
    }),
  });

  return res.json();
}

/**
 * Récupère la progression d'écoute sauvegardée.
 */
export async function getAudioListeningProgress(
  trackId: string
): Promise<AudioProgressResponse> {
  const res = await fetch(`/api/bff/audio/tracks/${trackId}/progress/`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  return res.json();
}

/**
 * Vérifie le verrouillage des flux audio DRM (URLs signées HLS obligatoires).
 */
export async function verifyAudioSecurityLock(
  depositOrOuvrageId: string,
  isDeposit: boolean = true
): Promise<AudioLockVerificationResponse> {
  const path = isDeposit
    ? `/api/bff/audio/deposits/${depositOrOuvrageId}/verify-lock/`
    : `/api/bff/audio/ouvrages/${depositOrOuvrageId}/verify-lock/`;

  const res = await fetch(path, {
    method: "POST",
    credentials: "include",
  });

  return res.json();
}
