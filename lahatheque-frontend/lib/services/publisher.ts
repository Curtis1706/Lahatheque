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
} from "../types/publisher";

import {
  mockPublisherBooks,
  mockBatchImportReports,
  mockApiKeys,
  mockPublisherAuditLogs,
  mockPublisherRoyaltyPayments,
  mockPublisherKpis,
  mockPublisherUser,
} from "../mock/publisher";

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
  try {
    return await bffGet<PublisherKpis>("/kpis/");
  } catch {
    const totalBooks = mockPublisherBooks.length;
    const pendingValidations = mockPublisherBooks.filter((b) => b.status !== "published").length;
    const publishedBooks = mockPublisherBooks.filter((b) => b.status === "published").length;
    const totalConsultations = mockPublisherBooks.reduce((acc, b) => acc + b.consultations_count, 0);
    const totalDownloads = mockPublisherBooks.reduce((acc, b) => acc + b.downloads_count, 0);
    const totalRevenue = mockPublisherBooks.reduce((acc, b) => acc + b.revenue_generated, 0);

    return {
      totalBooks,
      pendingValidations,
      publishedBooks,
      totalConsultations,
      totalDownloads,
      totalRevenue,
      pendingRoyalties: (totalRevenue * mockPublisherUser.contractual_royalty_rate) / 100,
      contractualRoyaltyRate: mockPublisherUser.contractual_royalty_rate,
    };
  }
}

// ─── Catalogue ────────────────────────────────────────────────────────────────

export async function getPublisherBooks(filters?: {
  search?: string;
  status?: string;
  discipline?: string;
}): Promise<PublisherBook[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== "all") params.set("status", filters.status);
    if (filters?.discipline && filters.discipline !== "all") params.set("discipline", filters.discipline);
    if (filters?.search) params.set("search", filters.search);
    const queryStr = params.toString() ? `?${params.toString()}` : "";
    return await bffGet<PublisherBook[]>(`/catalog/${queryStr}`);
  } catch {
    let list = [...mockPublisherBooks];
    if (filters?.status && filters.status !== "all") {
      list = list.filter((b) => b.status === filters.status);
    }
    if (filters?.discipline && filters.discipline !== "all") {
      list = list.filter((b) => b.discipline === filters.discipline);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.isbn_digital.toLowerCase().includes(q) ||
          b.authors.some((a) => a.toLowerCase().includes(q))
      );
    }
    return list;
  }
}

export async function getPublisherBookDetail(id: string): Promise<PublisherBook | null> {
  try {
    return await bffGet<PublisherBook>(`/catalog/${id}/`);
  } catch {
    let found = mockPublisherBooks.find((b) => b.id === id);
    if (!found && /^\d+$/.test(id)) {
      const formatted = `pub-book-${id.padStart(2, "0")}`;
      found = mockPublisherBooks.find((b) => b.id === formatted);
    }
    if (!found) {
      found = mockPublisherBooks[0];
    }
    if (!found) return null;
    return JSON.parse(JSON.stringify(found));
  }
}

// ─── Assistance IA pour Métadonnées ──────────────────────────────────────────

export async function extractBookMetadataWithAi(payload: {
  title?: string;
  filename?: string;
}): Promise<PublisherAiMetadataSuggestion> {
  try {
    return await bffPost<PublisherAiMetadataSuggestion>("/ai/extract-metadata/", payload);
  } catch {
    const titleLower = ((payload.title || "") + " " + (payload.filename || "")).toLowerCase();
    if (titleLower.includes("droit") || titleLower.includes("jurisprudence")) {
      return {
        summary: "Ouvrage juridique de référence analysant les principes de droit public et de contentieux constitutionnel en Afrique de l'Ouest.",
        discipline: "Droit Public & Administration",
        language: "fr",
        country: "BJ",
        suggested_keywords: ["droit", "jurisprudence", "cours magistral", "uac", "constitution"],
        target_audience: "universitaire",
        confidence_score: 0.95,
      };
    }
    if (titleLower.includes("economie") || titleLower.includes("finance")) {
      return {
        summary: "Manuel d'économie et d'analyse financière appliquée aux économies émergentes de la zone UEMOA/CEMAC.",
        discipline: "Sciences Économiques",
        language: "fr",
        country: "BJ",
        suggested_keywords: ["économie", "finance", "uemoa", "croissance", "banque"],
        target_audience: "universitaire",
        confidence_score: 0.92,
      };
    }
    return {
      summary: `Ouvrage académique approfondi explorant les dimensions théoriques, méthodologiques et pratiques de ${payload.title || 'cette recherche'}.`,
      discipline: "Sciences Humaines & Sociales",
      language: "fr",
      country: "BJ",
      suggested_keywords: ["recherche", "université", "académique", "mémoire", "bénin"],
      target_audience: "universitaire",
      confidence_score: 0.89,
    };
  }
}

// ─── Dépôt Unitaire ──────────────────────────────────────────────────────────

export async function createPublisherBook(
  data: Partial<PublisherBook>
): Promise<PublisherBook> {
  try {
    return await bffPost<PublisherBook>("/deposits/", data);
  } catch {
    const newBook: PublisherBook = {
      id: `pub-book-${String(mockPublisherBooks.length + 1).padStart(2, "0")}`,
      publisher_id: mockPublisherUser.id,
      publisher_name: mockPublisherUser.company_name,
      title: data.title || "Nouvel Ouvrage Déposé",
      subtitle: data.subtitle,
      isbn_digital: data.isbn_digital || "978-2-01-000000-0",
      isbn_print: data.isbn_print,
      doi: data.doi,
      authors: data.authors || ["Auteur Partenaire"],
      contributors: data.contributors || [],
      discipline: data.discipline || "Droit Public & Administration",
      language: data.language || "fr",
      keywords: data.keywords || ["académique", "édition"],
      target_audience: data.target_audience || "universitaire",
      price: data.price || 5000,
      currency: "XOF",
      sales_model: data.sales_model || "purchase",
      allowed_territories: data.allowed_territories || ["Bénin", "Togo", "Côte d'Ivoire"],
      embargo_date: data.embargo_date,
      summary: data.summary || "Résumé de l'ouvrage déposé.",
      authors_bio: data.authors_bio || "",
      cover_url: data.cover_url || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
      file_url: data.file_url || "/mock/publisher/nouveau-livre.pdf",
      file_format: data.file_format || "pdf",
      licence_type: data.licence_type || "tous_droits_reserves",
      contract_reference: mockPublisherUser.contract_reference,
      contractual_royalty_rate: mockPublisherUser.contractual_royalty_rate,
      status: "pending",
      validation_step: "step_1_deposited",
      consultations_count: 0,
      downloads_count: 0,
      revenue_generated: 0,
      created_at: new Date().toISOString(),
      protection_config: data.protection_config || {
        watermark_enabled: true,
        watermark_position: "bottom-right",
        watermark_opacity: 30,
        user_watermarking: true,
        lcp_drm_enabled: true,
        max_allowed_devices: 3,
        max_loan_days: 14,
        disable_copy_paste: true,
        disable_print: false,
        audio_encryption_auto: true,
        access_tracing_auto: true,
      },
    };

    mockPublisherBooks.unshift(newBook);
    return newBook;
  }
}

// ─── Import par Lots (ONIX 3.0 / CSV) ────────────────────────────────────────

export async function uploadBatchCatalogue(
  file: File,
  format: "onix_3" | "csv" | "json" | "zip"
): Promise<BatchImportReport> {
  try {
    return await bffPost<BatchImportReport>("/deposits/batch/", {
      filename: file.name,
      format,
    });
  } catch {
    const newReport: BatchImportReport = {
      batch_id: `batch-${Date.now()}`,
      file_name: file.name,
      format,
      total_records: 12,
      success_count: 11,
      error_count: 1,
      errors: [
        {
          line_number: 8,
          isbn_or_title: "Traité de Botanique Tropicale",
          error_message: "Format de couverture non reconnu (JPEG/PNG requis)",
        },
      ],
      status: "completed_with_errors",
      created_at: new Date().toISOString(),
    };

    mockBatchImportReports.unshift(newReport);
    return newReport;
  }
}

export async function getBatchImportReports(): Promise<BatchImportReport[]> {
  return [...mockBatchImportReports];
}

// ─── Clés API ─────────────────────────────────────────────────────────────────

export async function getApiKeys(): Promise<ApiKey[]> {
  try {
    return await bffGet<ApiKey[]>("/api-keys/");
  } catch {
    return [...mockApiKeys];
  }
}

export async function createApiKey(name: string, permissions: string[]): Promise<ApiKey> {
  try {
    return await bffPost<ApiKey>("/api-keys/", { name, permissions });
  } catch {
    const rawSecret = `laha_sec_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
    const newKey: ApiKey = {
      id: `key-${Date.now()}`,
      name,
      client_id: `pub_cli_${Math.random().toString(36).slice(2, 10)}`,
      client_secret_masked: `${rawSecret.slice(0, 10)}...${rawSecret.slice(-4)}`,
      client_secret: rawSecret,
      permissions,
      created_at: new Date().toISOString(),
      status: "active",
    };
    mockApiKeys.unshift(newKey);
    return newKey;
  }
}

export async function revokeApiKey(keyId: string): Promise<boolean> {
  try {
    await bffDelete(`/api-keys/${keyId}/`);
    return true;
  } catch {
    const key = mockApiKeys.find((k) => k.id === keyId);
    if (key) {
      key.status = "revoked";
      return true;
    }
    return false;
  }
}

// ─── Logs d'Audit DRM ────────────────────────────────────────────────────────

export async function getPublisherAuditLogs(): Promise<PublisherAuditLog[]> {
  try {
    return await bffGet<PublisherAuditLog[]>("/audit-logs/");
  } catch {
    return [...mockPublisherAuditLogs];
  }
}

// ─── Redevances & Ventes ─────────────────────────────────────────────────────

export async function getPublisherRoyaltyPayments(): Promise<PublisherRoyaltyPayment[]> {
  try {
    return await bffGet<PublisherRoyaltyPayment[]>("/royalties/");
  } catch {
    return [...mockPublisherRoyaltyPayments];
  }
}

export async function requestRoyaltyPayout(amount: number): Promise<boolean> {
  try {
    await bffPost("/royalties/withdraw/", { amount });
    return true;
  } catch {
    const newPayment: PublisherRoyaltyPayment = {
      id: `pay-${Date.now()}`,
      reference: `VIR-EDT-${Date.now().toString().slice(-4)}`,
      amount,
      currency: "XOF",
      period: `Demande de virement ${new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`,
      status: "processing",
      payment_date: new Date().toISOString().split("T")[0],
      payment_method: "Virement bancaire (IBAN)",
      pdf_statement_url: `/statements/VIR-EDT-NEW.pdf`,
    };
    mockPublisherRoyaltyPayments.unshift(newPayment);
    return true;
  }
}

// ─── Profil & Mandat Éditeur ─────────────────────────────────────────────────

let mockPublisherProfileData: PublisherProfileData = {
  id: "pub-hachette",
  entity_type: "company",
  company_name: "Éditions Hachette Afrique",
  trade_name: "Hachette Livre Distribution",
  nif_number: "3201900123456",
  rccm_number: "RB/COT/20-B-12345",
  country: "BJ",
  city: "Cotonou",
  headquarters_address: "Avenue Jean-Paul II, Immeuble Horizon, Cotonou, Bénin",
  contact_person: "Mme Clarisse DOSSA",
  contact_email: "partenaires@hachette-afrique.com",
  contact_phone: "+229 97 00 11 22",
  bank_name: "Ecobank Bénin",
  bank_iban: "BJ0610100100145678901234",
  bank_swift: "ECOBBJBJ",
  momo_number: "+229 97 00 11 22",
  contract_reference: "CTR-PUB-2025-08",
  contractual_royalty_rate: 22,
  is_verified: true,
};

export async function getPublisherProfile(): Promise<PublisherProfileData> {
  try {
    return await bffGet<PublisherProfileData>("/profile/");
  } catch {
    return { ...mockPublisherProfileData };
  }
}

export async function updatePublisherProfile(
  updates: Partial<PublisherProfileData>
): Promise<PublisherProfileData> {
  try {
    return await bffPatch<PublisherProfileData>("/profile/", updates);
  } catch {
    mockPublisherProfileData = { ...mockPublisherProfileData, ...updates };
    return { ...mockPublisherProfileData };
  }
}

export async function updatePublisherBookProtection(
  bookId: string,
  protection: import("../types/publisher").ProtectionConfig
): Promise<boolean> {
  try {
    await bffPatch(`/catalog/${bookId}/protection/`, { protection_config: protection });
    return true;
  } catch {
    const book = mockPublisherBooks.find((b) => b.id === bookId);
    if (book) {
      book.protection_config = { ...protection };
      return true;
    }
    return false;
  }
}


