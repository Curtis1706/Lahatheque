// ─── Services Espace Éditeur Tiers (publisher) ──────────────────────────────
// Fonctions async avec délai simulé — jamais de fetch en dur

import type {
  PublisherBook,
  BatchImportReport,
  ApiKey,
  PublisherAuditLog,
  PublisherRoyaltyPayment,
  PublisherKpis,
  ProtectionConfig,
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

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── KPIs ─────────────────────────────────────────────────────────────────────

export async function getPublisherKpis(): Promise<PublisherKpis> {
  await delay(500);
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

// ─── Catalogue ────────────────────────────────────────────────────────────────

export async function getPublisherBooks(filters?: {
  search?: string;
  status?: string;
  discipline?: string;
}): Promise<PublisherBook[]> {
  await delay(600);
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

export async function getPublisherBookDetail(id: string): Promise<PublisherBook | null> {
  await delay(200);
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


export async function createPublisherBook(
  data: Partial<PublisherBook>
): Promise<PublisherBook> {
  await delay(900);
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
    discipline: data.discipline || "Droit Public",
    keywords: data.keywords || ["édition"],
    target_audience: data.target_audience || "universitaire",
    price: data.price || 10000,
    currency: "XOF",
    sales_model: data.sales_model || "purchase",
    allowed_territories: data.allowed_territories || ["Monde"],
    summary: data.summary || "Résumé d'ouvrage partenaire.",
    authors_bio: data.authors_bio,
    cover_url: data.cover_url || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
    licence_type: data.licence_type || "tous_droits_reserves",
    contract_reference: mockPublisherUser.contract_reference,
    contractual_royalty_rate: mockPublisherUser.contractual_royalty_rate,
    status: "pending",
    validation_step: "step_2_auto_check",
    consultations_count: 0,
    downloads_count: 0,
    revenue_generated: 0,
    created_at: new Date().toISOString(),
    protection_config: {
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

export async function updatePublisherBookProtection(
  id: string,
  config: Partial<ProtectionConfig>
): Promise<boolean> {
  await delay(600);
  const book = mockPublisherBooks.find((b) => b.id === id);
  if (book) {
    Object.assign(book.protection_config, config);
    return true;
  }
  return false;
}

// ─── Import en Lot (ONIX 3.0 / ZIP / CSV) ────────────────────────────────────

export async function getBatchImportReports(): Promise<BatchImportReport[]> {
  await delay(600);
  return [...mockBatchImportReports];
}

export async function startBatchImport(
  fileName: string,
  format: "onix_3" | "csv" | "json" | "zip"
): Promise<BatchImportReport> {
  await delay(1200);
  const newReport: BatchImportReport = {
    batch_id: `batch-${Date.now().toString().slice(-6)}`,
    file_name: fileName,
    format,
    total_records: 15,
    success_count: 14,
    error_count: 1,
    status: "completed_with_errors",
    created_at: new Date().toISOString(),
    errors: [
      {
        line_number: 8,
        isbn_or_title: "Notice N°8 (Manuscrit Incomplet)",
        error_message: "Format d'image de couverture non conforme (JPEG/PNG requis).",
      },
    ],
  };

  mockBatchImportReports.unshift(newReport);
  return newReport;
}

// ─── Clés API & Intégration System ───────────────────────────────────────────

export async function getApiKeys(): Promise<ApiKey[]> {
  await delay(600);
  return [...mockApiKeys];
}

export async function generateApiKey(name: string): Promise<{ apiKey: ApiKey; fullSecret: string }> {
  await delay(800);
  const randomSecret = `sk_live_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
  const newKey: ApiKey = {
    id: `key-${Date.now().toString().slice(-4)}`,
    name,
    client_id: `lahath_client_${mockPublisherUser.id}_${Math.random().toString(36).substring(2, 6)}`,
    client_secret_masked: `${randomSecret.slice(0, 8)}...${randomSecret.slice(-4)}`,
    permissions: ["catalog:write", "catalog:read", "sales:read"],
    created_at: new Date().toISOString(),
    status: "active",
  };

  mockApiKeys.unshift(newKey);
  return { apiKey: newKey, fullSecret: randomSecret };
}

export async function revokeApiKey(keyId: string): Promise<boolean> {
  await delay(600);
  const key = mockApiKeys.find((k) => k.id === keyId);
  if (key) {
    key.status = "revoked";
    return true;
  }
  return false;
}

// ─── Traçabilité & Journaux ──────────────────────────────────────────────────

export async function getPublisherAuditLogs(): Promise<PublisherAuditLog[]> {
  await delay(600);
  return [...mockPublisherAuditLogs];
}

// ─── Redevances & Paiements ──────────────────────────────────────────────────

export async function getPublisherRoyaltyPayments(): Promise<PublisherRoyaltyPayment[]> {
  await delay(600);
  return [...mockPublisherRoyaltyPayments];
}
