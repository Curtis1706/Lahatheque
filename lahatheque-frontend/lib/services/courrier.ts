/**
 * Service API Frontend — Gestion des Courriers Officiels LAHAThèque
 * Connecté au proxy BFF (/api/bff/rights/legal/courriers)
 * Conforme à la Constitution LAHAThèque (Zéro mock, Console Logs balisés [COURRIERS API], Devise FCFA)
 */

import type {
  CourrierOfficiel,
  CourrierListParams,
  PrepareCourrierPayload,
  PrepareBatchCourriersPayload,
  UpdateCourrierPayload,
} from "../types/courrier";

const API_BASE = "/api/bff/rights/legal/courriers";

export async function getCourriers(
  params?: CourrierListParams
): Promise<{ success: boolean; data?: CourrierOfficiel[]; error?: string }> {
  const startTime = Date.now();
  const searchParams = new URLSearchParams();

  if (params?.status && params.status !== "all") {
    searchParams.append("status", params.status);
  }
  if (params?.category && params.category !== "all") {
    searchParams.append("category", params.category);
  }
  if (params?.search) {
    searchParams.append("search", params.search);
  }
  if (params?.ordering) {
    searchParams.append("ordering", params.ordering);
  }

  const url = `${API_BASE}/${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  console.groupCollapsed(`[COURRIERS API] GET List — ${new Date().toISOString()}`);
  console.log("Params:", params);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    const elapsed = Date.now() - startTime;
    console.log(`HTTP ${res.status} (${elapsed}ms)`);

    const json = await res.json().catch(() => ({}));

    if (!res.ok || !json.success) {
      console.error("Erreur serveur:", json);
      console.groupEnd();
      return { success: false, error: json.error || `Erreur chargement courriers: ${res.status}` };
    }

    console.log("Données reçues:", json.data?.length || 0, "courrier(s)");
    console.groupEnd();
    return { success: true, data: json.data || [] };
  } catch (err: any) {
    console.error("Exception réseau:", err);
    console.groupEnd();
    return { success: false, error: err.message || "Erreur de connexion au serveur." };
  }
}

export async function getCourrierDetail(id: string): Promise<CourrierOfficiel> {
  const startTime = Date.now();
  console.groupCollapsed(`[COURRIERS API] GET Detail ${id} — ${new Date().toISOString()}`);

  try {
    const res = await fetch(`${API_BASE}/${id}/`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    const elapsed = Date.now() - startTime;
    console.log(`HTTP ${res.status} (${elapsed}ms)`);

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `Courrier introuvable (${res.status})`);
    }

    const json = await res.json();
    console.groupEnd();
    return json.data;
  } catch (err) {
    console.error("Exception:", err);
    console.groupEnd();
    throw err;
  }
}

export async function prepareCourrier(
  payload: PrepareCourrierPayload
): Promise<{ success: boolean; data?: CourrierOfficiel; error?: string }> {
  const startTime = Date.now();
  console.groupCollapsed(`[COURRIERS API] POST Prepare — ${new Date().toISOString()}`);
  console.log("Payload:", payload);

  try {
    const res = await fetch(`${API_BASE}/prepare/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    });

    const elapsed = Date.now() - startTime;
    console.log(`HTTP ${res.status} (${elapsed}ms)`);
    const json = await res.json().catch(() => ({}));

    if (!res.ok || !json.success) {
      console.error("Échec préparation:", json);
      console.groupEnd();
      return { success: false, error: json.error || "Impossible de préparer le courrier." };
    }

    console.log("Courrier initialisé:", json.data);
    console.groupEnd();
    return { success: true, data: json.data };
  } catch (err: any) {
    console.error("Exception réseau:", err);
    console.groupEnd();
    return { success: false, error: err.message || "Erreur de connexion." };
  }
}

export async function prepareBatchCourriers(
  payload: PrepareBatchCourriersPayload
): Promise<{ success: boolean; data?: { prepared_count: number; message: string }; error?: string }> {
  const startTime = Date.now();
  console.groupCollapsed(`[COURRIERS API] POST Prepare-Batch — ${new Date().toISOString()}`);
  console.log("Payload:", payload);

  try {
    const res = await fetch(`${API_BASE}/prepare-batch/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    });

    const elapsed = Date.now() - startTime;
    console.log(`HTTP ${res.status} (${elapsed}ms)`);
    const json = await res.json().catch(() => ({}));

    if (!res.ok || !json.success) {
      console.error("Échec préparation par lot:", json);
      console.groupEnd();
      return { success: false, error: json.error || "Impossible de préparer les courriers de la période." };
    }

    console.log("Lot préparé:", json.data);
    console.groupEnd();
    return { success: true, data: json.data };
  } catch (err: any) {
    console.error("Exception réseau:", err);
    console.groupEnd();
    return { success: false, error: err.message || "Erreur de connexion." };
  }
}

export async function updateCourrier(
  id: string,
  payload: UpdateCourrierPayload
): Promise<{ success: boolean; data?: CourrierOfficiel; error?: string }> {
  const startTime = Date.now();
  console.groupCollapsed(`[COURRIERS API] PATCH Update ${id} — ${new Date().toISOString()}`);
  console.log("Payload:", payload);

  try {
    const res = await fetch(`${API_BASE}/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    });

    const elapsed = Date.now() - startTime;
    console.log(`HTTP ${res.status} (${elapsed}ms)`);
    const json = await res.json().catch(() => ({}));

    if (!res.ok || !json.success) {
      console.error("Échec mise à jour:", json);
      console.groupEnd();
      return { success: false, error: json.error || "Impossible de mettre à jour le courrier." };
    }

    console.log("Courrier mis à jour:", json.data);
    console.groupEnd();
    return { success: true, data: json.data };
  } catch (err: any) {
    console.error("Exception réseau:", err);
    console.groupEnd();
    return { success: false, error: err.message || "Erreur de connexion." };
  }
}

export async function validateCourrier(
  id: string
): Promise<{ success: boolean; data?: CourrierOfficiel; error?: string }> {
  const startTime = Date.now();
  console.groupCollapsed(`[COURRIERS API] POST Validate ${id} — ${new Date().toISOString()}`);

  try {
    const res = await fetch(`${API_BASE}/${id}/validate/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    const elapsed = Date.now() - startTime;
    console.log(`HTTP ${res.status} (${elapsed}ms)`);
    const json = await res.json().catch(() => ({}));

    if (!res.ok || !json.success) {
      console.error("Échec validation:", json);
      console.groupEnd();
      return { success: false, error: json.error || "Impossible de valider le courrier." };
    }

    console.log("Courrier validé et scellé:", json.data);
    console.groupEnd();
    return { success: true, data: json.data };
  } catch (err: any) {
    console.error("Exception réseau:", err);
    console.groupEnd();
    return { success: false, error: err.message || "Erreur de connexion." };
  }
}

export async function cancelCourrier(
  id: string
): Promise<{ success: boolean; data?: CourrierOfficiel; error?: string }> {
  const startTime = Date.now();
  console.groupCollapsed(`[COURRIERS API] POST Cancel ${id} — ${new Date().toISOString()}`);

  try {
    const res = await fetch(`${API_BASE}/${id}/cancel/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    const elapsed = Date.now() - startTime;
    console.log(`HTTP ${res.status} (${elapsed}ms)`);
    const json = await res.json().catch(() => ({}));

    if (!res.ok || !json.success) {
      console.error("Échec annulation:", json);
      console.groupEnd();
      return { success: false, error: json.error || "Impossible d'annuler le courrier." };
    }

    console.log("Courrier annulé:", json.data);
    console.groupEnd();
    return { success: true, data: json.data };
  } catch (err: any) {
    console.error("Exception réseau:", err);
    console.groupEnd();
    return { success: false, error: err.message || "Erreur de connexion." };
  }
}

export async function sendCourrierEmail(
  id: string
): Promise<{ success: boolean; data?: CourrierOfficiel; error?: string }> {
  const startTime = Date.now();
  console.groupCollapsed(`[COURRIERS API] POST Send-Email ${id} — ${new Date().toISOString()}`);

  try {
    const res = await fetch(`${API_BASE}/${id}/send-email/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    const elapsed = Date.now() - startTime;
    console.log(`HTTP ${res.status} (${elapsed}ms)`);
    const json = await res.json().catch(() => ({}));

    if (!res.ok || !json.success) {
      console.error("Échec expédition email:", json);
      console.groupEnd();
      return { success: false, error: json.error || "Impossible d'expédier le courrier par e-mail." };
    }

    console.log("Courrier expédié:", json.data);
    console.groupEnd();
    return { success: true, data: json.data };
  } catch (err: any) {
    console.error("Exception réseau:", err);
    console.groupEnd();
    return { success: false, error: err.message || "Erreur de connexion." };
  }
}

export function getCourrierPdfPreviewUrl(id: string): string {
  return `/api/bff/rights/legal/courriers/${id}/preview-pdf/`;
}
