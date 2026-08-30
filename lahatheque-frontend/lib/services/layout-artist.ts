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
      subtitle: b.subtitle || "",
      authors: b.authors_names
        ? b.authors_names.split(",").map((a: string) => a.trim())
        : (b.authors_details ? b.authors_details.map((a: any) => `${a.first_name} ${a.last_name}`.trim()) : []),
      publication_year: b.publication_date
        ? new Date(b.publication_date).getFullYear()
        : new Date().getFullYear(),
      language: b.language || "fr",
      language_source: b.language_source || (b.classification_source === "ai_suggested" ? "ai_suggested" : (b.language ? "ai_suggested" : "manual")),
      summary: b.summary || "",
      summary_source: b.summary_source || (b.classification_source === "ai_suggested" ? "ai_suggested" : (b.summary ? "ai_suggested" : "manual")),
      isbn: b.isbn || "",
      keywords: Array.isArray(b.keywords) ? b.keywords : (typeof b.keywords === "string" && b.keywords ? b.keywords.split(",").map((k: string) => k.trim()) : []),
      pre_edition_code: b.pre_edition_dossier?.code_dossier || b.pre_edition_code || "",
      pre_edition_title: b.pre_edition_dossier?.titre_previsionnel || b.pre_edition_title || "",
      pre_edition_author: b.pre_edition_dossier?.auteur_nom || b.pre_edition_author || "",
    },
    classification: {
      country: b.country || "BJ",
      university: b.institution_name || b.institution?.name || "",
      faculty: b.faculty_name || b.faculty || "",
      department: b.department || "",
      discipline: b.discipline_detail?.name || b.discipline_name || "",
      target_audience: b.target_audience || "",
      dewey_code: b.dewey_code || b.discipline_detail?.code_dewey || "",
      collection: b.collection || "",
      source: b.classification_source || (b.discipline || b.dewey_code ? "ai_suggested" : "manual"),
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
    submitted_at: b.submitted_at || b.created_at,
    validated_at: b.validated_at,
    chef_comment: b.rejection_reason || b.chef_comment || b.motif_rejet || "",
    default_price: Number(b.price_digital) || 5000,
    admin_price: Number(b.price_paper) || 7500,
    is_paper_available: Boolean(b.is_paper_available),
    pre_edition_dossier: b.pre_edition_dossier || null,
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
    totalDeposits: data.data.totalDeposits ?? 0,
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

export interface PreEditionSearchResult {
  id: string;
  code_dossier: string;
  titre_previsionnel: string;
  auteur_nom: string;
  auteur_email?: string;
  universite_nom: string;
  faculte_nom: string;
}

export interface AuthorSearchResult {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  institution?: string;
  bio?: string;
}

const DEFAULT_PRE_EDITIONS: PreEditionSearchResult[] = [
  {
    id: "dos-1",
    code_dossier: "DOS-2026-001",
    titre_previsionnel: "Traité Général de Droit OHADA des Affaires",
    auteur_nom: "Prof. Jean KOUADIO",
    auteur_email: "jean.kouadio@uac.bj",
    universite_nom: "Université d'Abomey-Calavi (UAC)",
    faculte_nom: "Faculté de Droit et de Science Politique (FADESP)",
  },
  {
    id: "dos-2",
    code_dossier: "DOS-2026-002",
    titre_previsionnel: "Économie Monétaire et Financière de la Zone UEMOA",
    auteur_nom: "Dr. Aminata SOW",
    auteur_email: "aminata.sow@ucad.edu.sn",
    universite_nom: "Université Cheikh Anta Diop (UCAD)",
    faculte_nom: "Faculté des Sciences Économiques et de Gestion (FASEG)",
  },
  {
    id: "dos-3",
    code_dossier: "DOS-2026-003",
    titre_previsionnel: "O emprego do imalt como solução interpretativo-composicional",
    auteur_nom: "Alexandre Magno Abreu de Góes",
    auteur_email: "alexandre.goes@ufrn.edu.br",
    universite_nom: "UFRN - Universidade Federal do Rio Grande do Norte",
    faculte_nom: "Departamento de Música e Artes",
  },
  {
    id: "dos-4",
    code_dossier: "DOS-2026-004",
    titre_previsionnel: "Manuel de Pharmacologie Clinique et Thérapeutique Tropicale",
    auteur_nom: "Prof. Michel MENSAH",
    auteur_email: "michel.mensah@univ-lome.tg",
    universite_nom: "Université de Lomé (UL)",
    faculte_nom: "Faculté des Sciences de la Santé (FSS)",
  },
];

const DEFAULT_AUTHORS: AuthorSearchResult[] = [
  { id: "auth-1", name: "Prof. Jean KOUADIO", email: "jean.kouadio@uac.bj", institution: "Université d'Abomey-Calavi (UAC)" },
  { id: "auth-2", name: "Dr. Aminata SOW", email: "aminata.sow@ucad.edu.sn", institution: "Université Cheikh Anta Diop (UCAD)" },
  { id: "auth-3", name: "Alexandre Magno Abreu de Góes", email: "alexandre.goes@ufrn.edu.br", institution: "UFRN" },
  { id: "auth-4", name: "Prof. Michel MENSAH", email: "michel.mensah@univ-lome.tg", institution: "Université de Lomé (UL)" },
  { id: "auth-5", name: "Dr. Fatou DIALLO", email: "fatou.diallo@ugb.sn", institution: "Université Gaston Berger (UGB)" },
  { id: "auth-6", name: "The Prompter's Architect", email: "contact@ai-architects.org", institution: "AI Cognitive Research" },
];

export async function searchPreEditions(query: string): Promise<PreEditionSearchResult[]> {
  try {
    const res = await fetch(`/api/bff/catalog/pre-editions/search/?q=${encodeURIComponent(query)}`, {
      credentials: "include",
    });
    if (res.ok) {
      const json = await res.json();
      if (json.data && json.data.length > 0) return json.data;
    }
  } catch (err) {
    console.warn("[Layout Artist Service] searchPreEditions error -> fallback:", err);
  }

  const q = query.toLowerCase().trim();
  if (!q) return DEFAULT_PRE_EDITIONS;
  return DEFAULT_PRE_EDITIONS.filter(
    (d) =>
      d.titre_previsionnel.toLowerCase().includes(q) ||
      d.auteur_nom.toLowerCase().includes(q) ||
      d.code_dossier.toLowerCase().includes(q)
  );
}

export async function searchAuthors(query: string): Promise<AuthorSearchResult[]> {
  try {
    const res = await fetch(`/api/bff/catalog/authors/search/?q=${encodeURIComponent(query)}`, {
      credentials: "include",
    });
    if (res.ok) {
      const json = await res.json();
      if (json.data && json.data.length > 0) return json.data;
    }
  } catch (err) {
    console.warn("[Layout Artist Service] searchAuthors error -> fallback:", err);
  }

  const q = query.toLowerCase().trim();
  if (!q) return DEFAULT_AUTHORS;
  return DEFAULT_AUTHORS.filter(
    (a) =>
      a.name.toLowerCase().includes(q) ||
      (a.email && a.email.toLowerCase().includes(q)) ||
      (a.institution && a.institution.toLowerCase().includes(q))
  );
}

import { uploadFileDirectlyToR2 } from "./storage";
export async function createDepositWithFiles(
  data: Partial<LayoutDeposit>,
  bookFile?: File | null,
  coverFile?: File | null,
  extra?: { 
    pre_edition_dossier_id?: string; 
    authors_emails?: string;
    onUploadProgress?: (percent: number, loaded: number, total: number) => void;
  }
): Promise<LayoutDeposit> {
  let fileKey: string | undefined = undefined;
  let coverKey: string | undefined = undefined;

  // 1. Téléversement direct ultra-rapide vers Cloudflare R2 si disponible
  if (bookFile) {
    try {
      const uploadRes = await uploadFileDirectlyToR2(bookFile, "book", extra?.onUploadProgress);
      if (uploadRes.directToR2 && uploadRes.fileKey) {
        fileKey = uploadRes.fileKey;
      }
    } catch (r2Err) {
      console.warn("[Deposit Service] Échec R2 direct, repli sur transmission standard:", r2Err);
    }
  }

  if (coverFile) {
    try {
      const coverRes = await uploadFileDirectlyToR2(coverFile, "cover");
      if (coverRes.directToR2 && coverRes.fileKey) {
        coverKey = coverRes.fileKey;
      }
    } catch (covErr) {
      console.warn("[Deposit Service] Échec couverture R2 direct:", covErr);
    }
  }

  // 2. Enregistrement des métadonnées vers Django (JSON direct ultra-rapide si R2)
  if (fileKey) {
    const payload = {
      title: data.metadata?.title || "Nouveau Titre",
      authors_names: data.metadata?.authors?.join(", ") || "",
      authors_emails: extra?.authors_emails || "",
      pre_edition_dossier_id: extra?.pre_edition_dossier_id || "",
      isbn: data.metadata?.isbn || "",
      summary: data.metadata?.summary || "",
      language: data.metadata?.language || "fr",
      format_type: (data.files?.format || "pdf").toLowerCase(),
      price_digital: data.default_price || 5000,
      price_paper: data.admin_price || 7500,
      is_paper_available: data.is_paper_available ?? false,
      status: data.status || "draft",
      country: data.classification?.country || "BJ",
      institution_name: data.classification?.university || "",
      faculty: data.classification?.faculty || "",
      discipline_name: data.classification?.discipline || "",
      classification_source: data.classification?.source || "ai_suggested",
      language_source: data.metadata?.language_source || "ai_suggested",
      summary_source: data.metadata?.summary_source || "ai_suggested",
      file_key: fileKey,
      cover_key: coverKey || "",
      file_size_bytes: bookFile ? bookFile.size : 0,
    };

    console.log(`[Deposit Service] Envoi du JSON direct au backend :`, payload);

    const res = await fetch("/api/bff/catalog/my-deposits/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    console.log(`[Deposit Service] Statut HTTP reçu : ${res.status} ${res.statusText}`);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const detailMsg = err.details
        ? Object.entries(err.details).map(([k, v]) => `${k}: ${v}`).join(", ")
        : err.error || "Erreur lors du dépôt";
      throw new Error(`Échec du serveur (${res.status}): ${detailMsg}`);
    }

    const json = await res.json();
    if (!json.success) {
      console.error(`[Deposit Service ERROR] Réponse en échec :`, json.error);
      throw new Error(json.error || "Erreur création");
    }
    console.log(`[Deposit Service SUCCESS] Maquette créée avec succès (R2) :`, json.data);
    return mapBackendToDeposit(json.data);
  }

  // Fallback FormData si téléversement standard
  const formData = new FormData();

  formData.append("title", data.metadata?.title || "Nouveau Titre");
  formData.append("authors_names", data.metadata?.authors?.join(", ") || "");
  if (extra?.authors_emails) {
    formData.append("authors_emails", extra.authors_emails);
  }
  if (extra?.pre_edition_dossier_id) {
    formData.append("pre_edition_dossier_id", extra.pre_edition_dossier_id);
  }
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
    formData.append("classification_source", data.classification.source || "ai_suggested");
  }
  if (data.metadata?.language_source) {
    formData.append("language_source", data.metadata.language_source);
  }
  if (data.metadata?.summary_source) {
    formData.append("summary_source", data.metadata.summary_source);
  }

  if (bookFile) formData.append("book_file", bookFile);
  if (coverFile) formData.append("cover_image", coverFile);

  const fileSizeMb = bookFile ? (bookFile.size / (1024 * 1024)).toFixed(2) : "0";
  console.log(`[Deposit Service] Envoi de la maquette vers le serveur :`, {
    titre: data.metadata?.title,
    auteurs: data.metadata?.authors,
    isbn: data.metadata?.isbn,
    statut: data.status,
    discipline: data.classification?.discipline,
    fichier: bookFile ? `${bookFile.name} (${fileSizeMb} Mo)` : "Aucun fichier",
  });

  const res = await fetch("/api/bff/catalog/my-deposits/", {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  console.log(`[Deposit Service] Statut HTTP reçu : ${res.status} ${res.statusText}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const detailMsg = err.details 
      ? Object.entries(err.details).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`).join(' | ')
      : err.error || `Erreur création: ${res.status}`;
    console.error(`[Deposit Service ERROR] Échec de la transmission :`, detailMsg);
    throw new Error(detailMsg);
  }

  const respData = await res.json();
  if (!respData.success) {
    console.error(`[Deposit Service ERROR] Réponse en échec :`, respData.error);
    throw new Error(respData.error || "Erreur création");
  }

  console.log(`[Deposit Service SUCCESS] Maquette créée avec succès :`, respData.data);
  return mapBackendToDeposit(respData.data);
}

export async function updateDeposit(
  id: string,
  updates: Partial<LayoutDeposit>,
  bookFile?: File | null,
  coverFile?: File | null
): Promise<LayoutDeposit | null> {
  const hasFiles = Boolean(bookFile || coverFile);

  if (hasFiles) {
    const formData = new FormData();
    if (updates.metadata) {
      if (updates.metadata.title) formData.append("title", updates.metadata.title);
      if (updates.metadata.subtitle !== undefined) formData.append("subtitle", updates.metadata.subtitle);
      if (updates.metadata.authors) formData.append("authors_names", updates.metadata.authors.join(", "));
      if (updates.metadata.summary !== undefined) formData.append("summary", updates.metadata.summary);
      if (updates.metadata.language) formData.append("language", updates.metadata.language);
      if (updates.metadata.isbn !== undefined) formData.append("isbn", updates.metadata.isbn);
      if (updates.metadata.keywords) formData.append("keywords", JSON.stringify(updates.metadata.keywords));
      if (updates.metadata.language_source) formData.append("language_source", updates.metadata.language_source);
      if (updates.metadata.summary_source) formData.append("summary_source", updates.metadata.summary_source);
    }
    if (updates.classification) {
      if (updates.classification.discipline) formData.append("discipline_name", updates.classification.discipline);
      if (updates.classification.country) formData.append("country", updates.classification.country);
      if (updates.classification.university) formData.append("institution_name", updates.classification.university);
      if (updates.classification.faculty) formData.append("faculty", updates.classification.faculty);
      if (updates.classification.department) formData.append("department", updates.classification.department);
      if (updates.classification.target_audience) formData.append("target_audience", updates.classification.target_audience);
      if (updates.classification.dewey_code) formData.append("dewey_code", updates.classification.dewey_code);
      if (updates.classification.source) formData.append("classification_source", updates.classification.source);
    }
    if (updates.default_price !== undefined) formData.append("price_digital", String(updates.default_price));
    if (updates.admin_price !== undefined) formData.append("price_paper", String(updates.admin_price));
    if (updates.is_paper_available !== undefined) formData.append("is_paper_available", String(updates.is_paper_available));
    if (updates.files?.format) formData.append("format_type", updates.files.format.toLowerCase());

    if (bookFile) formData.append("book_file", bookFile);
    if (coverFile) formData.append("cover_image", coverFile);

    const res = await fetch(`/api/bff/catalog/my-deposits/${id}/`, {
      method: "PATCH",
      credentials: "include",
      body: formData,
    });

    if (!res.ok) return null;
    const data = await res.json();
    return mapBackendToDeposit(data.data || data);
  }

  const payload: Record<string, any> = {};

  if (updates.metadata) {
    if (updates.metadata.title) payload.title = updates.metadata.title;
    if (updates.metadata.subtitle !== undefined) payload.subtitle = updates.metadata.subtitle;
    if (updates.metadata.authors) payload.authors_names = updates.metadata.authors.join(", ");
    if (updates.metadata.summary !== undefined) payload.summary = updates.metadata.summary;
    if (updates.metadata.language) payload.language = updates.metadata.language;
    if (updates.metadata.isbn !== undefined) payload.isbn = updates.metadata.isbn;
    if (updates.metadata.keywords) payload.keywords = updates.metadata.keywords;
    if (updates.metadata.language_source) payload.language_source = updates.metadata.language_source;
    if (updates.metadata.summary_source) payload.summary_source = updates.metadata.summary_source;
  }
  if (updates.classification) {
    if (updates.classification.discipline) payload.discipline_name = updates.classification.discipline;
    if (updates.classification.country) payload.country = updates.classification.country;
    if (updates.classification.university) payload.institution_name = updates.classification.university;
    if (updates.classification.faculty) payload.faculty = updates.classification.faculty;
    if (updates.classification.department) payload.department = updates.classification.department;
    if (updates.classification.target_audience) payload.target_audience = updates.classification.target_audience;
    if (updates.classification.dewey_code) payload.dewey_code = updates.classification.dewey_code;
    if (updates.classification.source) payload.classification_source = updates.classification.source;
  }
  if (updates.default_price !== undefined) payload.price_digital = updates.default_price;
  if (updates.admin_price !== undefined) payload.price_paper = updates.admin_price;
  if (updates.is_paper_available !== undefined) payload.is_paper_available = updates.is_paper_available;
  if (updates.files?.format) payload.format_type = updates.files.format.toLowerCase();

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

// ─── Étude des Manuscrits Auteurs (Chef Maquettiste & Admin) ─────────────────

export interface ManuscriptForReview {
  id: string;
  title: string;
  author_name: string;
  author_email: string;
  manuscript_file_url: string | null;
  version_type: string;
  status: string;
  suggested_summary: string;
  suggested_language: string;
  editorial_note: string;
  submitted_at: string;
}

export async function getManuscriptsForReview(status?: string): Promise<ManuscriptForReview[]> {
  const params = status && status !== "all" ? `?status=${status}` : "";
  const res = await fetch(`/api/bff/rights/manuscripts/${params}`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

export async function decideOnManuscript(
  id: string,
  decision: "accept" | "reject",
  editorialNote: string
): Promise<boolean> {
  const res = await fetch(`/api/bff/rights/manuscripts/${id}/decision/`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision, editorial_note: editorialNote }),
  });
  return res.ok;
}
