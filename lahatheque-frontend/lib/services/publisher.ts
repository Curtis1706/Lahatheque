/**
 * Service Éditeur Tiers — Espace Partenaire Édition & Dépôt ONIX
 * 100% connecté aux endpoints Django BFF (/api/bff/publishers).
 */

import type {
  PublisherBook,
  BatchImportReport,
  ApiKey,
  PublisherAuditLog,
  PublisherRoyaltyPayment,
  PublisherKpis,
  PublisherProfileData,
  PublisherAiMetadataSuggestion,
  ProtectionConfig as PublisherBookProtection,
} from "../types/publisher";

const BFF = "/api/bff/publishers";

// ─── Helpers BFF ─────────────────────────────────────────────────────────────

async function bffGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BFF}${path}`, { credentials: "include", cache: "no-store" });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Erreur serveur");
  return json.data as T;
}

async function bffPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BFF}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Erreur serveur");
  return json.data as T;
}

async function bffPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BFF}${path}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Erreur serveur");
  return json.data as T;
}

async function bffDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${BFF}${path}`, {
    method: "DELETE",
    credentials: "include",
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Erreur serveur");
  return json.data as T;
}

// ─── KPIs ─────────────────────────────────────────────────────────────────────

export async function getPublisherKpis(): Promise<PublisherKpis> {
  return bffGet<PublisherKpis>("/kpis/");
}

// ─── Catalogue ────────────────────────────────────────────────────────────────

export async function getPublisherBooks(filters?: {
  search?: string;
  status?: string;
  discipline?: string;
}): Promise<PublisherBook[]> {
  const params = new URLSearchParams();
  if (filters?.status && filters.status !== "all") params.set("status", filters.status);
  if (filters?.discipline && filters.discipline !== "all") params.set("discipline", filters.discipline);
  if (filters?.search) params.set("search", filters.search);
  const queryStr = params.toString() ? `?${params.toString()}` : "";
  return bffGet<PublisherBook[]>(`/catalog/${queryStr}`);
}

export async function getPublisherBookDetail(id: string): Promise<PublisherBook | null> {
  try {
    return await bffGet<PublisherBook>(`/catalog/${id}/`);
  } catch {
    return null;
  }
}

// ─── Assistance IA pour Métadonnées ──────────────────────────────────────────

export async function extractBookMetadataWithAi(payload: {
  title?: string;
  filename?: string;
}): Promise<PublisherAiMetadataSuggestion> {
  return bffPost<PublisherAiMetadataSuggestion>("/ai/extract-metadata/", payload);
}

// ─── Dépôt Unitaire ──────────────────────────────────────────────────────────

export async function createPublisherBook(
  data: Partial<PublisherBook>
): Promise<PublisherBook> {
  return bffPost<PublisherBook>("/deposits/", data);
}

// ─── Import par Lots (ONIX 3.0 / CSV) ────────────────────────────────────────

export async function uploadBatchCatalogue(
  file: File,
  format: "onix_3" | "csv" | "json" | "zip"
): Promise<BatchImportReport> {
  const formData = new FormData();
  formData.append("file", file, file.name);
  formData.append("format", format);

  const res = await fetch(`${BFF}/deposits/batch/`, {
    method: "POST",
    credentials: "include",
    // Ne pas mettre Content-Type manuellement : le navigateur gère la boundary multipart
    body: formData,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Erreur lors de l'import du lot");
  return json.data as BatchImportReport;
}

export async function getBatchImportReports(): Promise<BatchImportReport[]> {
  return bffGet<BatchImportReport[]>("/deposits/batch/");
}

// ─── Clés API ─────────────────────────────────────────────────────────────────

export async function getApiKeys(): Promise<ApiKey[]> {
  return bffGet<ApiKey[]>("/api-keys/");
}

export async function createApiKey(name: string, permissions: string[]): Promise<ApiKey> {
  return bffPost<ApiKey>("/api-keys/", { name, permissions });
}

export async function revokeApiKey(keyId: string): Promise<boolean> {
  await bffDelete(`/api-keys/${keyId}/`);
  return true;
}

// ─── Logs d'Audit DRM ────────────────────────────────────────────────────────

export async function getPublisherAuditLogs(): Promise<PublisherAuditLog[]> {
  return bffGet<PublisherAuditLog[]>("/audit-logs/");
}

// ─── Redevances & Ventes ─────────────────────────────────────────────────────

export async function getPublisherRoyaltyPayments(): Promise<PublisherRoyaltyPayment[]> {
  return bffGet<PublisherRoyaltyPayment[]>("/royalties/");
}

export async function requestRoyaltyPayout(amount: number): Promise<boolean> {
  await bffPost("/royalties/withdraw/", { amount });
  return true;
}

// ─── Profil & Mandat Éditeur ─────────────────────────────────────────────────

export async function getPublisherProfile(): Promise<PublisherProfileData> {
  return bffGet<PublisherProfileData>("/profile/");
}

export async function updatePublisherProfile(
  updates: Partial<PublisherProfileData>
): Promise<PublisherProfileData> {
  return bffPatch<PublisherProfileData>("/profile/", updates);
}

export async function updatePublisherBookProtection(
  bookId: string,
  protection: PublisherBookProtection
): Promise<boolean> {
  // TODO: Endpoint backend /catalog/{id}/protection/ à créer dans publisher_views.py
  await bffPatch(`/catalog/${bookId}/protection/`, { protection_config: protection });
  return true;
}

// ─── File d'examen des dépôts éditeurs tiers (Admin / Chef Maquettiste / Juriste) ──

export interface PublisherDepositForReview {
  id: string;
  title: string;
  publisher_name: string;
  isbn_digital: string;
  discipline: string;
  price: number;
  status: string;
  editorial_status: string;
  editorial_comment: string;
  rights_status: string;
  rights_comment: string;
  file_url: string | null;
  created_at: string;
}

export async function getPublisherDepositsForReview(
  statusFilter?: string
): Promise<PublisherDepositForReview[]> {
  const params = statusFilter && statusFilter !== "all" ? `?status=${statusFilter}` : "";
  const res = await fetch(`${BFF}/admin/deposits/${params}`, {
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Erreur chargement dépôts éditeurs");
  return (json.data as PublisherDepositForReview[]) ?? [];
}

export async function submitEditorialDecision(
  depositId: string,
  decision: "approved" | "revision_requested",
  comment: string
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${BFF}/admin/deposits/${depositId}/editorial-decision/`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision, comment }),
  });
  return await res.json();
}

export async function submitRightsDecision(
  depositId: string,
  decision: "approved" | "revision_requested",
  comment: string
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${BFF}/admin/deposits/${depositId}/rights-decision/`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision, comment }),
  });
  return await res.json();
}

export async function publishPublisherDeposit(
  depositId: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const res = await fetch(`${BFF}/admin/deposits/${depositId}/publish/`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  return await res.json();
}

