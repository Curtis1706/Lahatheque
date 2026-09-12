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

/**
 * Récupère les ouvrages du catalogue éligibles pour un rattachement de livre audio avec pagination.
 */
export async function getEligibleBooksForAttachment(
  searchQuery?: string,
  page: number = 1,
  pageSize: number = 50
): Promise<{ books: any[]; total: number; hasNext: boolean }> {
  try {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    params.set("page", String(page));
    params.set("page_size", String(pageSize));

    const res = await fetch(`/api/bff/audio/eligible-books/?${params.toString()}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      const list = json.data || json.results || (Array.isArray(json) ? json : []);
      const total = json.pagination?.total ?? list.length;
      const hasNext = Boolean(json.pagination?.has_next);
      return { books: list, total, hasNext };
    }
  } catch (err) {
    console.error("Erreur récupération livres éligibles:", err);
  }
  return { books: [], total: 0, hasNext: false };
}

/**
 * Téléverse un fichier directement vers Cloudflare R2 via URL pré-signée S3.
 */
export async function uploadFileDirectToR2(
  file: File,
  fileType: "audio" | "cover",
  onProgress?: (percent: number) => void
): Promise<{ r2_key: string }> {
  const presignRes = await fetch("/api/bff/catalog/my-deposits/presigned-upload-url/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      filename: file.name,
      content_type: file.type || (fileType === "cover" ? "image/jpeg" : "audio/mpeg"),
      file_type: fileType,
    }),
  });
  const presignData = await presignRes.json();
  if (!presignData.success && !presignData.upload_url && !presignData.data?.upload_url) {
    throw new Error(presignData.error || presignData.data?.message || "Impossible d'obtenir une URL de téléversement.");
  }
  const { upload_url, file_key, key } = presignData.data || presignData;
  const targetUploadUrl = upload_url;
  const targetKey = file_key || key;

  if (!targetUploadUrl || !targetKey) {
    throw new Error("URL ou clé de stockage manquante dans la réponse du serveur.");
  }

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", targetUploadUrl, true);
    xhr.setRequestHeader("Content-Type", file.type || (fileType === "cover" ? "image/jpeg" : "audio/mpeg"));
    if (xhr.upload) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
    }
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Échec upload R2 (${xhr.status})`)));
    xhr.onerror = () => reject(new Error("Erreur réseau pendant le téléversement direct vers le stockage."));
    xhr.send(file);
  });

  return { r2_key: targetKey };
}

/**
 * Soumission complète du formulaire Studio Audio (métadonnées + clés R2 déjà téléversées).
 */
export async function submitAudioStudioForm(
  payload: Record<string, any>
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch("/api/bff/audio/studio/submit/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: "Erreur de connexion au serveur" };
  }
}

/**
 * Récupère la liste des livres audio selon le rôle (Maquettiste, Chef Maquettiste, Juriste, Admin).
 */
export async function getAudioBooksList(role: string, status?: string): Promise<any[]> {
  try {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    const res = await fetch(`/api/bff/audio/management/${role}/?${params.toString()}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      return json.data || json.results || json || [];
    }
  } catch (err) {
    console.error(`Erreur chargement livres audio rôle ${role}:`, err);
  }
  return [];
}

/**
 * Met à jour le statut dans le workflow éditorial (validation technique, juridique, publication).
 */
export async function updateAudioWorkflowStatus(
  bookId: string,
  action: "submit_layout" | "approve_layout" | "reject_layout" | "approve_legal" | "publish_admin" | "unpublish_admin",
  comment?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch(`/api/bff/audio/management/${bookId}/transition/`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, comment }),
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: "Erreur réseau lors de la mise à jour du statut" };
  }
}

/**
 * Récupère les sessions d'écoute audio récentes de l'utilisateur pour le widget Dashboard.
 */
export async function getRecentAudioListenings(): Promise<any[]> {
  try {
    const res = await fetch("/api/bff/audio/recent-listenings/", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      return json.data || [];
    }
  } catch (err) {
    console.error("Erreur récupération écoutes audio récentes:", err);
  }
  return [];
}

/**
 * Récupère les détails complets d'un livre audio pour consultation/édition admin.
 */
export async function getAudioBookDetail(bookId: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch(`/api/bff/audio/management/books/${bookId}/`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || "Erreur réseau lors du chargement des détails." };
  }
}

/**
 * Met à jour les métadonnées et tarifs d'un livre audio.
 */
export async function updateAudioBook(
  bookId: string,
  data: Record<string, any>
): Promise<{ success: boolean; data?: any; message?: string; error?: string }> {
  try {
    const res = await fetch(`/api/bff/audio/management/books/${bookId}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || "Erreur réseau lors de la mise à jour." };
  }
}

/**
 * Supprime un livre audio autonome ou détache proprement la version audio d'un livre.
 */
export async function deleteAudioBook(
  bookId: string
): Promise<{ success: boolean; data?: any; message?: string; error?: string }> {
  try {
    const res = await fetch(`/api/bff/audio/management/books/${bookId}/`, {
      method: "DELETE",
      credentials: "include",
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || "Erreur réseau lors de la suppression." };
  }
}

/**
 * Supprime une piste audio individuelle par son identifiant unique.
 */
export async function deleteAudioTrack(
  trackId: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`/api/bff/audio/tracks-crud/${trackId}/`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.status === 204 || res.ok) {
      return { success: true, message: "Piste audio supprimée avec succès." };
    }
    const json = await res.json().catch(() => ({}));
    return { success: false, error: json.error || `Erreur HTTP ${res.status}` };
  } catch (err: any) {
    return { success: false, error: err.message || "Erreur réseau lors de la suppression de la piste." };
  }
}

