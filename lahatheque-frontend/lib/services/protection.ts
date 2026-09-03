/**
 * Service de gestion de la Protection DRM et Traçabilité d'Accès
 * Connecté au backend Django via le proxy BFF Next.js avec fallback mock résilient.
 */

import type { ProtectionConfig } from "../types/publisher";

export interface TraceRecord {
  id: string;
  user_email: string;
  user_name: string;
  partner_name?: string;
  book_title: string;
  book_id: string;
  cover_url?: string;
  access_type: "read_chunk" | "read_online" | "text_request" | "audio_stream";
  ip_address: string;
  country: string;
  device_fingerprint: string;
  current_page?: number;
  total_pages?: number;
  progress_percent?: number;
  reading_time_minutes?: number;
  page_number?: number;
  timestamp: string;
}

export interface DrmGlobalSettings {
  profil_default: string;
  watermark_template: string;
  watermark_laha_template: string;
  watermark_laha_subtext: string;
  watermark_opacity: number;
  watermark_position: string;
  invisible_watermark_enabled: boolean;
  allow_print: boolean;
  allow_copy: boolean;
  max_devices: number;
  session_duration_minutes: number;
  config_version: number;
}


const MOCK_TRACES: TraceRecord[] = [
  {
    id: "trc-001",
    user_email: "mensah.koffi@univ-abomey.bj",
    user_name: "Koffi Mensah",
    partner_name: "UNSTIM",
    book_title: "Droit des Affaires et Traité OHADA",
    book_id: "book-ohada-01",
    access_type: "read_chunk",
    ip_address: "197.234.221.14",
    country: "BJ",
    device_fingerprint: "Chrome/124.0.0.0 (Win64; x64) / fp_8a7d",
    current_page: 42,
    total_pages: 280,
    progress_percent: 15,
    reading_time_minutes: 12,
    page_number: 42,
    timestamp: "2026-08-18T19:42:15Z",
  },
];

const DEFAULT_GLOBAL_SETTINGS: DrmGlobalSettings = {
  profil_default: "standard",
  watermark_template: "Licence accordée à {nom} ({email}) - IP: {ip}",
  watermark_laha_template: "LAHAThèque • Document Certifié & Protégé",
  watermark_laha_subtext: "Licence accordée au Lecteur Authentifié • Reproduction interdite",
  watermark_opacity: 0.20,
  watermark_position: "diagonal",
  invisible_watermark_enabled: true,
  allow_print: false,
  allow_copy: false,
  max_devices: 3,
  session_duration_minutes: 15,
  config_version: 1,
};

/**
 * Récupère le journal d'audit légal TraceAccès depuis le backend Django.
 * Agrège en priorité les sessions de lecture réelles et exclut les pings internes.
 */
export async function getAccessTraces(): Promise<TraceRecord[]> {
  const traces: TraceRecord[] = [];

  // 1. Récupération prioritaire des sessions de lecture réelles hébergées
  try {
    const res = await fetch("/api/bff/partners/sessions", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (res.ok) {
      const json = await res.json();
      const list = Array.isArray(json) ? json : (json.data || json.results || []);
      for (const s of list) {
        const uName = s.studentName || s.userName || "Lecteur Authentifié";
        const pName = s.partnerName || "LAHAThèque";
        const emailFallback = uName && uName !== "Lecteur Authentifié"
          ? `${uName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@univ.bj`
          : "etudiant@univ.bj";

        const bookId = String(s.bookId || s.book_id || s.ouvrage || s.id || "");
        const coverUrl = s.coverUrl || s.cover_url || (bookId && !bookId.startsWith("byod") ? `/api/bff/catalog/books/${bookId}/cover/` : "");

        traces.push({
          id: String(s.id),
          user_name: uName,
          user_email: s.studentEmail || s.userEmail || emailFallback,
          partner_name: pName,
          book_title: s.bookTitle || s.documentTitle || "Ouvrage Académique",
          book_id: bookId,
          cover_url: coverUrl,
          access_type: "read_chunk",
          ip_address: s.studentIp || s.userIp || "127.0.0.1",
          country: "BJ",
          device_fingerprint: `Web • ${pName}`,
          current_page: s.currentPage || 1,
          total_pages: s.totalPages || 1,
          progress_percent: s.progressPercent || 0,
          reading_time_minutes: s.durationMinutes ?? s.readingTimeMinutes ?? 1,
          page_number: s.currentPage || 1,
          timestamp: s.startedAt || s.createdAt || new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    console.error("[Traces] Erreur chargement sessions partenaires:", err);
  }

  // 2. Récupération des traces audit directes si disponibles
  try {
    const res = await fetch("/api/bff/protection/audit-traces/", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (res.ok) {
      const json = await res.json();
      const rawList = Array.isArray(json)
        ? json
        : (Array.isArray(json.data)
            ? json.data
            : (json.results || (json.data?.results || [])));

      if (Array.isArray(rawList)) {
        for (const item of rawList) {
          const tId = String(item.id);
          // Éviter les doublons
          if (traces.some((t) => t.id === tId)) continue;

          // Ignorer les pings internes 10.0.1.1 ou "Lecteur Client" générique si nous avons des sessions réelles
          if ((item.ip_address === "10.0.1.1" || item.user_name === "Lecteur Client") && traces.length > 0) {
            continue;
          }

          traces.push({
            id: tId,
            user_email: item.user_email || "lecteur@lahatheque.com",
            user_name: item.user_name || "Lecteur Authentifié",
            partner_name: item.partner_name || "Accès Direct",
            book_title: item.book_title || item.document_title || "Ouvrage LAHA",
            book_id: String(item.book_id || item.ouvrage || ""),
            access_type: item.access_type || "read_chunk",
            ip_address: item.ip_address || "127.0.0.1",
            country: item.country || "BJ",
            device_fingerprint: item.device_fingerprint || "Client Web (Navigateur)",
            current_page: item.current_page || item.page_number || 1,
            total_pages: item.total_pages || 1,
            progress_percent: item.progress_percent || 0,
            reading_time_minutes: item.reading_time_minutes || 0,
            page_number: item.current_page || item.page_number || 1,
            timestamp: item.timestamp || item.created_at || new Date().toISOString(),
          });
        }
      }
    }
  } catch {
    // Mode déconnecté
  }

  // Tri chronologique décroissant
  traces.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return traces;
}


/**
 * Récupère la configuration DRM globale depuis le backend Django.
 * Endpoint : GET /api/v1/protection/global-config/
 */
export async function getDrmGlobalSettings(): Promise<DrmGlobalSettings> {
  try {
    const res = await fetch("/api/bff/protection/global-config/", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (res.ok) {
      const json = await res.json();
      const cfg = json.success ? json.data : json;
      if (cfg && typeof cfg === "object") {
        return {
          profil_default: cfg.profil_default || "standard",
          watermark_template: cfg.watermark_template || DEFAULT_GLOBAL_SETTINGS.watermark_template,
          watermark_laha_template: cfg.watermark_laha_template || DEFAULT_GLOBAL_SETTINGS.watermark_laha_template,
          watermark_laha_subtext: cfg.watermark_laha_subtext || DEFAULT_GLOBAL_SETTINGS.watermark_laha_subtext,
          watermark_opacity: (cfg.watermark_opacity != null && !isNaN(parseFloat(String(cfg.watermark_opacity))))
            ? parseFloat(String(cfg.watermark_opacity))
            : 0.20,
          watermark_position: cfg.watermark_position || "diagonal",


          invisible_watermark_enabled: cfg.invisible_watermark_enabled ?? true,
          allow_print: cfg.allow_print ?? false,
          allow_copy: cfg.allow_copy ?? false,
          max_devices: cfg.max_devices ?? 3,
          session_duration_minutes: cfg.session_duration_minutes ?? 15,
          config_version: cfg.config_version ?? 1,
        };
      }
    }
  } catch {
    // Mode déconnecté — fallback sur les valeurs par défaut
  }

  return DEFAULT_GLOBAL_SETTINGS;
}

/**
 * Enregistre la configuration DRM globale vers le backend Django.
 * Endpoint : PATCH /api/v1/protection/global-config/
 */
export async function saveDrmGlobalSettings(settings: DrmGlobalSettings): Promise<boolean> {
  try {
    const res = await fetch("/api/bff/protection/global-config/", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profil_default: settings.profil_default,
        watermark_template: settings.watermark_template,
        watermark_laha_template: settings.watermark_laha_template,
        watermark_laha_subtext: settings.watermark_laha_subtext,
        watermark_opacity: settings.watermark_opacity,
        watermark_position: settings.watermark_position,
        invisible_watermark_enabled: settings.invisible_watermark_enabled,
        allow_print: settings.allow_print,
        allow_copy: settings.allow_copy,
        max_devices: settings.max_devices,
        session_duration_minutes: settings.session_duration_minutes,
      }),
    });


    if (res.ok) {
      return true;
    }

    // Log l'erreur backend pour diagnostic
    const errBody = await res.text().catch(() => "");
    console.error("[DRM] saveDrmGlobalSettings error:", res.status, errBody);
  } catch (err) {
    console.error("[DRM] saveDrmGlobalSettings network error:", err);
  }

  return false;
}

/**
 * Configuration de protection par défaut pour un ouvrage
 */
export const DEFAULT_BOOK_PROTECTION: ProtectionConfig = {
  watermark_enabled: true,
  watermark_position: "bottom-right",
  watermark_opacity: 30,
  user_watermarking: true,
  lcp_drm_enabled: true,
  max_allowed_devices: 3,
  max_loan_days: 30,
  disable_copy_paste: true,
  disable_print: true,
  audio_encryption_auto: true,
  access_tracing_auto: true,
};

/**
 * Récupère la configuration DRM/protection spécifique à un ouvrage du catalogue.
 * Endpoint : GET /api/v1/protection/configs/by-book/{bookId}/
 */
export async function getBookProtectionConfig(bookId: string): Promise<ProtectionConfig> {
  try {
    const res = await fetch(`/api/bff/protection/configs/by-book/${bookId}/`, {
      method: "GET",
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      const d = json.data || json;
      return {
        watermark_enabled: d.watermark_enabled ?? d.watermark_visible ?? true,
        watermark_position: d.watermark_position || "bottom-right",
        watermark_opacity: d.watermark_opacity ?? 30,
        user_watermarking: d.user_watermarking ?? d.invisible_watermark_enabled ?? true,
        lcp_drm_enabled: d.lcp_drm_enabled ?? true,
        max_allowed_devices: d.max_allowed_devices ?? d.max_devices_per_user ?? 3,
        max_loan_days: d.max_loan_days ?? d.loan_duration_days ?? 30,
        disable_copy_paste: d.disable_copy_paste != null ? Boolean(d.disable_copy_paste) : (d.allow_copy != null ? !d.allow_copy : true),
        disable_print: d.disable_print != null ? Boolean(d.disable_print) : (d.allow_print != null ? !d.allow_print : true),
        audio_encryption_auto: true,
        access_tracing_auto: true,
      };
    }
  } catch (err) {
    console.error("[Protection] Erreur chargement config ouvrage:", err);
  }
  return DEFAULT_BOOK_PROTECTION;
}

/**
 * Enregistre la configuration DRM/protection spécifique à un ouvrage du catalogue.
 * Endpoint : PATCH /api/v1/protection/configs/by-book/{bookId}/
 */
export async function saveBookProtectionConfig(bookId: string, config: ProtectionConfig): Promise<boolean> {
  try {
    const res = await fetch(`/api/bff/protection/configs/by-book/${bookId}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    if (res.ok) return true;
  } catch (err) {
    console.error("[Protection] Erreur sauvegarde config ouvrage:", err);
  }
  return false;
}
