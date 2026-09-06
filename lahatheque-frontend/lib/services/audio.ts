/**
 * Service Livre Audio LAHAThèque
 * Gestion du téléversement, streaming HLS signé et progression d'écoute.
 * Zéro emoji, typé TypeScript.
 */

export interface AudioTrackUploadResponse {
  success: boolean;
  data?: {
    track_id: string;
    stream_id: string;
    title: string;
    duration_seconds: number;
    stream_playback_url: string;
    stream_status: string;
    hls_manifest_url?: string;
  };
  error?: string;
}

export interface AudioStreamSessionResponse {
  success: boolean;
  data?: {
    ouvrage_id: string;
    title: string;
    audio_enabled: boolean;
    stream_id: string;
    hls_manifest_url: string;
    signed_token: string;
    expires_in_seconds: number;
    duration_seconds: number;
    current_progress_seconds: number;
  };
  error?: string;
}

export interface AudioProgressResponse {
  success: boolean;
  data?: {
    track_id: string;
    duration_listened_seconds: number;
    completion_percent: number;
    completed: boolean;
  };
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
 * Téléversement d'un fichier audio (MP3 / M4B) vers Cloudflare Stream sécurisé.
 */
export async function uploadAudioTrack(
  ouvrageId: string,
  file: File,
  title?: string,
  durationSeconds?: number
): Promise<AudioTrackUploadResponse> {
  const formData = new FormData();
  formData.append("ouvrage_id", ouvrageId);
  formData.append("file", file);
  formData.append("title", title || file.name);
  if (durationSeconds) {
    formData.append("duration_seconds", String(Math.round(durationSeconds)));
  }

  const res = await fetch("/api/bff/audio/tracks/upload/", {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  return res.json();
}

/**
 * Récupère la session de streaming audio HLS signée pour un ouvrage acheté ou accessible.
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
  positionSeconds: number
): Promise<AudioProgressResponse> {
  const res = await fetch(`/api/bff/audio/tracks/${trackId}/progress/`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ position_seconds: Math.round(positionSeconds) }),
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
