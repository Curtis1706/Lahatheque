// ─── Services Maquettiste & Chef Maquettiste ──────────────────────────────────
// Connecté au backend Django via BFF Proxy

import type {
  LayoutDeposit,
  MaquettisteKpi,
  ChefMaquettisteKpi,
  DepositFilterStatus,
} from "../types/layout-artist";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapBackendToDeposit(b: any, fallbackUserId?: string): LayoutDeposit {
  return {
    id: String(b.id),
    maquettiste_id: b.created_by?.id || fallbackUserId || "",
    maquettiste_name: b.created_by
      ? `${b.created_by.first_name || ""} ${b.created_by.last_name || ""}`.trim()
      : b.authors_names || "Maquettiste",
    metadata: {
      title: b.title || "Sans titre",
      authors: b.authors_names
        ? b.authors_names.split(",").map((a: string) => a.trim())
        : [],
      publication_year: b.publication_date
        ? new Date(b.publication_date).getFullYear()
        : new Date().getFullYear(),
      language: b.language || "fr",
      language_source: "manual_override",
      summary: b.summary || "",
      summary_source: "manual_override",
      isbn: b.isbn || "",
    },
    classification: {
      country: b.country || "BJ",
      university: b.institution_name || "",
      faculty: b.faculty_name || b.faculty || "",
      discipline: b.discipline_detail?.name || b.discipline_name || "",
      source: "manual_override",
    },
    files: {
      format: (b.format_type || "pdf").toUpperCase() as "PDF" | "EPUB" | "AUDIO" | "PAPIER",
      book_file_url: typeof b.file === "string" ? b.file : b.file?.url || b.file_url || b.book_file_url || undefined,
      book_file_name: typeof b.file === "string" ? b.file.split("/").pop() : b.book_file_name || b.title,
      book_file_size: b.file_size_bytes || b.file_size || b.book_file_size || undefined,
      cover_url: b.cover_image || b.cover_url || undefined,
    },
    status:
      b.status === "published"
        ? "published"
        : b.status === "rejected"
          ? "revision_requested"
          : b.status === "draft"
            ? "draft"
            : "pending_validation",
    created_at: b.created_at || new Date().toISOString(),
    default_price: Number(b.price_digital) || 5000,
    admin_price: Number(b.price_paper) || 7500,
    is_paper_available: Boolean(b.is_paper_available),
  };
}

// ─── Service Maquettiste ──────────────────────────────────────────────────────

export async function getMaquettisteKpis(): Promise<MaquettisteKpi> {
  const res = await fetch("/api/bff/catalog/my-deposits/kpis/", {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) throw new Error(`KPIs error: ${res.status}`);

  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Erreur KPIs");

  return {
    draftCount: data.data.draftCount ?? 0,
    pendingValidationCount: data.data.pendingValidationCount ?? 0,
    revisionRequestedCount: data.data.revisionRequestedCount ?? 0,
    publishedCount: data.data.validatedCount ?? 0,
    timelines: data.data.timelines,
  };
}

export async function getMyDeposits(
  _maquettisteId?: string,
  filters?: { status?: DepositFilterStatus; search?: string; discipline?: string }
): Promise<LayoutDeposit[]> {
  const params = new URLSearchParams();
  if (filters?.status && filters.status !== "all") {
    params.append("status", filters.status);
  }
  if (filters?.discipline) {
    params.append("discipline", filters.discipline);
  }

  const res = await fetch(`/api/bff/catalog/my-deposits/?${params.toString()}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Deposits list error: ${res.status}`);

  const data = await res.json();
  const results = Array.isArray(data) ? data : data.results || data.data || [];

  if (filters?.search && results.length > 0) {
    const q = filters.search.toLowerCase();
    return results
      .map((b: any) => mapBackendToDeposit(b))
      .filter(
        (d: LayoutDeposit) =>
          d.metadata.title.toLowerCase().includes(q) ||
          d.metadata.authors.some((a: string) => a.toLowerCase().includes(q))
      );
  }

  return results.map((b: any) => mapBackendToDeposit(b));
}

export async function getDepositDetail(id: string): Promise<LayoutDeposit | null> {
  const res = await fetch(`/api/bff/catalog/my-deposits/${id}/`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) return null;

  const data = await res.json();
  const b = data.data || data;
  if (!b || !b.id) return null;

  return mapBackendToDeposit(b);
}

export async function createDeposit(data: Partial<LayoutDeposit>): Promise<LayoutDeposit> {
  const formData = new FormData();

  // Métadonnées texte
  formData.append("title", data.metadata?.title || "Nouveau Titre");
  formData.append("subtitle", data.metadata?.title ? "" : "");
  formData.append("authors_names", data.metadata?.authors?.join(", ") || "");
  formData.append("isbn", data.metadata?.isbn || "");
  formData.append("summary", data.metadata?.summary || "");
  formData.append("language", data.metadata?.language || "fr");
  formData.append("format_type", (data.files?.format || "pdf").toLowerCase());
  formData.append("price_digital", String(data.default_price || 5000));
  formData.append("status", data.status || "draft");

  // Classification
  if (data.classification) {
    formData.append("country", data.classification.country || "BJ");
    formData.append("institution_name", data.classification.university || "");
    formData.append("faculty", data.classification.faculty || "");
    formData.append("discipline_name", data.classification.discipline || "");
    formData.append("department", data.classification.department || "");
    if (data.classification.source) {
      formData.append("classification_source", data.classification.source);
    }
  }

  const res = await fetch("/api/bff/catalog/my-deposits/", {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Erreur création: ${res.status}`);
  }

  const respData = await res.json();
  if (!respData.success) throw new Error(respData.error || "Erreur création");

  return mapBackendToDeposit(respData.data);
}

export async function createDepositWithFiles(
  data: Partial<LayoutDeposit>,
  bookFile?: File | null,
  coverFile?: File | null
): Promise<LayoutDeposit> {
  const formData = new FormData();

  formData.append("title", data.metadata?.title || "Nouveau Titre");
  formData.append("authors_names", data.metadata?.authors?.join(", ") || "");
  formData.append("isbn", data.metadata?.isbn || "");
  formData.append("summary", data.metadata?.summary || "");
  formData.append("language", data.metadata?.language || "fr");
  formData.append("format_type", (data.files?.format || "pdf").toLowerCase());
  formData.append("price_digital", String(data.default_price || 5000));
  formData.append("price_paper", String(data.admin_price || 7500));
  if (data.is_paper_available !== undefined) {
    formData.append("is_paper_available", String(data.is_paper_available));
  }
  formData.append("status", data.status || "draft");

  if (data.classification) {
    formData.append("country", data.classification.country || "BJ");
    formData.append("institution_name", data.classification.university || "");
    formData.append("faculty", data.classification.faculty || "");
    formData.append("discipline_name", data.classification.discipline || "");
  }

  if (bookFile) formData.append("book_file", bookFile);
  if (coverFile) formData.append("cover_image", coverFile);

  const res = await fetch("/api/bff/catalog/my-deposits/", {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Erreur création: ${res.status}`);
  }

  const respData = await res.json();
  if (!respData.success) throw new Error(respData.error || "Erreur création");

  return mapBackendToDeposit(respData.data);
}

export async function updateDeposit(id: string, updates: Partial<LayoutDeposit>): Promise<LayoutDeposit | null> {
  const payload: Record<string, any> = {};

  if (updates.metadata) {
    if (updates.metadata.title) payload.title = updates.metadata.title;
    if (updates.metadata.authors) payload.authors_names = updates.metadata.authors.join(", ");
    if (updates.metadata.summary !== undefined) payload.summary = updates.metadata.summary;
    if (updates.metadata.language) payload.language = updates.metadata.language;
    if (updates.metadata.isbn !== undefined) payload.isbn = updates.metadata.isbn;
  }
  if (updates.classification) {
    if (updates.classification.discipline) payload.discipline_name = updates.classification.discipline;
    if (updates.classification.country) payload.country = updates.classification.country;
    if (updates.classification.faculty) payload.faculty = updates.classification.faculty;
  }

  const res = await fetch(`/api/bff/catalog/my-deposits/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return mapBackendToDeposit(data.data || data);
}

export async function submitDepositForValidation(id: string): Promise<boolean> {
  const res = await fetch(`/api/bff/catalog/my-deposits/${id}/submit/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  return res.ok;
}

// ─── Service Chef Maquettiste ─────────────────────────────────────────────────

export async function getChefKpis(): Promise<ChefMaquettisteKpi> {
  const res = await fetch("/api/bff/catalog/deposits/chef-kpis/", {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Chef KPIs error: ${res.status}`);

  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Erreur Chef KPIs");

  return {
    pendingValidationCount: data.data.pendingValidationCount ?? 0,
    validatedThisMonth: data.data.totalPublished ?? 0,
    revisionRequestedThisMonth: data.data.rejectedCount ?? 0,
    averageProcessingTimeHours: Number(data.data.averageValidationHours) || 4.5,
    timelines: data.data.timelines,
  };
}

export async function getPendingDeposits(
  filters?: { search?: string; discipline?: string }
): Promise<LayoutDeposit[]> {
  const res = await fetch("/api/bff/catalog/deposits/?status=submitted", {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Pending deposits error: ${res.status}`);

  const data = await res.json();
  const results = Array.isArray(data) ? data : data.results || data.data || [];
  let deposits = results.map((b: any) => mapBackendToDeposit(b));

  if (filters?.discipline) {
    deposits = deposits.filter((d: LayoutDeposit) => d.classification.discipline === filters.discipline);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    deposits = deposits.filter(
      (d: LayoutDeposit) =>
        d.metadata.title.toLowerCase().includes(q) ||
        d.maquettiste_name.toLowerCase().includes(q)
    );
  }
  return deposits;
}

export async function getValidationHistory(): Promise<LayoutDeposit[]> {
  const res = await fetch("/api/bff/catalog/deposits/", {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) return [];

  const data = await res.json();
  const results = Array.isArray(data) ? data : data.results || data.data || [];
  return results
    .filter((b: any) => b.status === "published" || b.status === "rejected")
    .map((b: any) => mapBackendToDeposit(b));
}

export async function validateDeposit(
  id: string,
  comment?: string,
  price_digital?: number,
  price_paper?: number,
  is_paper_available?: boolean
): Promise<boolean> {
  const res = await fetch(`/api/bff/catalog/deposits/${id}/validate/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ comment, price_digital, price_paper, is_paper_available }),
  });
  return res.ok;
}

export async function requestRevision(id: string, comment: string): Promise<boolean> {
  const res = await fetch(`/api/bff/catalog/deposits/${id}/reject/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ motif_rejet: comment }),
  });
  return res.ok;
}

export async function getCatalogBooks(filters?: {
  search?: string;
  discipline?: string;
  status?: string;
}): Promise<LayoutDeposit[]> {
  const params = new URLSearchParams();
  params.append("all", "true");
  if (filters?.status && filters.status !== "all") {
    params.append("status", filters.status);
  }
  if (filters?.discipline && filters.discipline !== "all") {
    params.append("discipline", filters.discipline);
  }

  const res = await fetch(`/api/bff/catalog/my-deposits/?${params.toString()}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) {
    const fallbackRes = await fetch("/api/bff/catalog/books/", {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!fallbackRes.ok) return [];
    const fallbackData = await fallbackRes.json();
    const items = Array.isArray(fallbackData) ? fallbackData : fallbackData.results || fallbackData.data || [];
    return items.map((b: any) => mapBackendToDeposit(b));
  }

  const data = await res.json();
  const results = Array.isArray(data) ? data : data.results || data.data || [];
  let deposits = results.map((b: any) => mapBackendToDeposit(b));

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    deposits = deposits.filter(
      (d: LayoutDeposit) =>
        d.metadata.title.toLowerCase().includes(q) ||
        d.metadata.authors.some((a) => a.toLowerCase().includes(q)) ||
        d.classification.discipline.toLowerCase().includes(q)
    );
  }
  return deposits;
}

export async function updateCatalogBookWithFiles(
  id: string,
  data: Partial<LayoutDeposit>,
  coverFile?: File | null,
  bookFile?: File | null
): Promise<LayoutDeposit> {
  const formData = new FormData();

  if (data.metadata?.title) formData.append("title", data.metadata.title);
  if (data.metadata?.subtitle !== undefined) formData.append("subtitle", data.metadata.subtitle);
  if (data.metadata?.authors) formData.append("authors_names", data.metadata.authors.join(", "));
  if (data.metadata?.isbn !== undefined) formData.append("isbn", data.metadata.isbn);
  if (data.metadata?.summary !== undefined) formData.append("summary", data.metadata.summary);
  if (data.metadata?.language) formData.append("language", data.metadata.language);
  if (data.files?.format) formData.append("format_type", data.files.format.toLowerCase());
  if (data.default_price !== undefined) formData.append("price_digital", String(data.default_price));
  if (data.admin_price !== undefined) formData.append("price_paper", String(data.admin_price));
  if (data.is_paper_available !== undefined) formData.append("is_paper_available", String(data.is_paper_available));
  if (data.status) formData.append("status", data.status);

  if (data.classification) {
    if (data.classification.country) formData.append("country", data.classification.country);
    if (data.classification.university) formData.append("institution_name", data.classification.university);
    if (data.classification.faculty) formData.append("faculty", data.classification.faculty);
    if (data.classification.discipline) formData.append("discipline_name", data.classification.discipline);
    if (data.classification.department) formData.append("department", data.classification.department);
  }

  if (bookFile) formData.append("book_file", bookFile);
  if (coverFile) formData.append("cover_image", coverFile);

  const res = await fetch(`/api/bff/catalog/my-deposits/${id}/`, {
    method: "PUT",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Erreur modification: ${res.status}`);
  }

  const respData = await res.json();
  if (!respData.success && respData.error) throw new Error(respData.error);

  return mapBackendToDeposit(respData.data || respData);
}
