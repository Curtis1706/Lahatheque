import type {
  UniversityKpis,
  UniversityRevenueSplit,
  UniversityFacultyData,
  UniversityBouquet,
  UniversityBookCatalogItem,
  UniversityPaperOrder,
  UniversityStudentAffiliationData,
  UniversityRoyaltyStatementData,
  UniversityRoyaltiesDetailData,
  UniversityProfileData,
} from "../types/university";

export type { UniversityRevenueSplit };

const BFF = "/api/bff/partners/university";

async function bffGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BFF}${path}`, {
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Erreur ${res.status} sur ${path}`);
  const json = await res.json();
  if (json.success === false) throw new Error(json.error || "Erreur serveur");
  return (json.data ?? json) as T;
}

async function bffPost<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${BFF}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status} sur ${path}`);
  const json = await res.json();
  if (json.success === false) throw new Error(json.error || "Erreur serveur");
  return (json.data ?? json) as T;
}

async function bffPatch<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${BFF}${path}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status} sur ${path}`);
  const json = await res.json();
  if (json.success === false) throw new Error(json.error || "Erreur serveur");
  return (json.data ?? json) as T;
}

async function bffDelete(path: string): Promise<void> {
  const res = await fetch(`${BFF}${path}`, {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Erreur ${res.status} sur ${path}`);
}

// ─── KPIs ────────────────────────────────────────────────────────────────────

export async function getUniversityKpis(): Promise<UniversityKpis> {
  return bffGet<UniversityKpis>("/kpis/");
}

// ─── Facultés ────────────────────────────────────────────────────────────────

export async function getUniversityFaculties(): Promise<UniversityFacultyData[]> {
  return bffGet<UniversityFacultyData[]>("/faculties/");
}

export async function addUniversityFaculty(
  faculty: Omit<UniversityFacultyData, "id">
): Promise<UniversityFacultyData> {
  return bffPost<UniversityFacultyData>("/faculties/", faculty);
}

export async function deleteUniversityFaculty(id: string): Promise<boolean> {
  await bffDelete(`/faculties/${id}/`);
  return true;
}

// ─── Bouquets ────────────────────────────────────────────────────────────────

export async function getUniversityBouquets(): Promise<UniversityBouquet[]> {
  return bffGet<UniversityBouquet[]>("/bouquets/");
}

export async function subscribeUniversityBouquet(bouquetId: string): Promise<boolean> {
  await bffPost(`/bouquets/${bouquetId}/subscribe/`, {});
  return true;
}

export interface BouquetRelevanceReport {
  bouquet_id: string;
  bouquet_title?: string;
  total_books: number;
  matching_books: number;
  relevance_percent: number;
  matched_disciplines: string[];
}

export async function getBouquetRelevanceReport(bouquetId: string): Promise<BouquetRelevanceReport | null> {
  try {
    const res = await fetch(`/api/bff/university/bouquets/${bouquetId}/relevance/`, {
      credentials: "include",
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      return json.success ? json.data : null;
    }
  } catch (err) {
    console.error("Erreur récupération rapport de pertinence bouquet:", err);
  }
  return null;
}


// ─── Catalogue ───────────────────────────────────────────────────────────────

export async function getUniversityCatalog(): Promise<UniversityBookCatalogItem[]> {
  // Le catalogue universitaire est le catalogue global filtré par institution
  const res = await fetch("/api/bff/catalog/books/", {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Erreur chargement catalogue");
  const json = await res.json();
  const results = Array.isArray(json) ? json : json.results || [];
  return results.map((b: any) => {
    let authorsList: string[] = [];
    if (Array.isArray(b.authors_details) && b.authors_details.length > 0) {
      authorsList = b.authors_details.map((a: any) =>
        typeof a === "string" ? a : `${a.first_name || ""} ${a.last_name || ""}`.trim()
      ).filter(Boolean);
    } else if (Array.isArray(b.authors) && b.authors.length > 0) {
      authorsList = b.authors.map((a: any) =>
        typeof a === "string" ? a : `${a.first_name || ""} ${a.last_name || ""}`.trim()
      ).filter(Boolean);
    } else if (typeof b.authors_names === "string" && b.authors_names.trim()) {
      authorsList = b.authors_names.split(",").map((s: string) => s.trim()).filter(Boolean);
    } else if (typeof b.authors === "string" && b.authors.trim()) {
      authorsList = b.authors.split(",").map((s: string) => s.trim()).filter(Boolean);
    }

    if (authorsList.length === 0) {
      authorsList = ["Auteur LAHA"];
    }

    return {
      id: String(b.id),
      title: b.title || b.titre || "Sans titre",
      isbn_digital: b.isbn || b.isbn_digital || "N/A",
      isbn_print: b.isbn_paper || b.isbn_print || b.isbn || "N/A",
      authors: authorsList,
      faculty_code: b.faculty_code || b.faculty || b.faculty_name || "Campus",
      faculty_name: b.faculty_name || b.faculty || "Faculté Partenaire",
      discipline: b.discipline_detail?.name || b.discipline_name || b.discipline || "Général",
      price_digital: Number(b.price_digital) || 0,
      price_paper: Number(b.price_paper) || 0,
      currency: b.currency || "XOF",
      cover_url: b.cover_image || b.cover_url || "",
      consultations_count: Number(b.consultations_count || b.total_reads || b.views_count || 0),
      stock_paper_available: Number(b.stock_paper_available || 100),
      has_audio: Boolean(b.has_audio_version || b.has_audio || b.price_audio || b.format_type === "audio"),
      has_audio_version: Boolean(b.has_audio_version),
      format_type: b.format_type || "pdf",
      is_paper_available: b.is_paper_available !== false,
      price_audio: Number(b.price_audio) || null,
    };
  });
}

// ─── Affiliations étudiants ──────────────────────────────────────────────────

export async function getUniversityAffiliations(): Promise<UniversityStudentAffiliationData[]> {
  return bffGet<UniversityStudentAffiliationData[]>("/affiliations/");
}

export async function updateUniversityAffiliation(
  affiliationId: string,
  action: "approve" | "reject" | "suspend"
): Promise<boolean> {
  await bffPatch(`/affiliations/${affiliationId}/`, { action });
  return true;
}

// ─── Commandes papier ────────────────────────────────────────────────────────

export async function getUniversityPaperOrders(): Promise<UniversityPaperOrder[]> {
  return bffGet<UniversityPaperOrder[]>("/paper-orders/");
}

export async function createUniversityPaperOrder(order: {
  items: { ouvrage_id?: string; book_id?: string; quantity: number; title?: string; unit_price?: number }[];
  delivery_address?: string;
  delivery_campus?: string;
  contact_name?: string;
  contact_person?: string;
  contact_phone: string;
  total_amount?: number;
  notes?: string;
}): Promise<UniversityPaperOrder> {
  return bffPost<UniversityPaperOrder>("/paper-orders/", order);
}

// ─── Redevances (Ventes Unitaires & Prorata Bouquets) ───────────────────────

export async function getUniversityRoyalties(): Promise<UniversityRoyaltiesDetailData> {
  try {
    const res = await bffGet<any>("/royalties/");
    if (res) {
      const contractualRate = Number(res.contractual_rate ?? 15);
      const currency = res.currency ?? "XOF";
      const totalsSummary = res.totals_summary ?? {
        paper_sales_count: 0,
        paper_royalties_total: 0,
        paper_gross_total: 0,
        digital_sales_count: 0,
        digital_royalties_total: 0,
        digital_gross_total: 0,
        bouquet_consultations_count: 0,
        bouquet_royalties_total: 0,
        bouquet_gross_allocated: 0,
      };

      return {
        available_balance: Number(res.available_balance ?? res.summary?.total_available ?? 0),
        total_paid: Number(res.total_paid ?? res.summary?.total_paid ?? 0),
        contractual_rate: contractualRate,
        institution: res.institution ?? {
          id: "",
          name: "Établissement Universitaire Partenaire",
          royalty_rate: contractualRate,
        },
        currency,
        min_withdrawal_threshold: Number(res.min_withdrawal_threshold ?? 100000),
        totals_summary: totalsSummary,
        unit_sales: Array.isArray(res.unit_sales) ? res.unit_sales : [],
        bouquet_royalties: Array.isArray(res.bouquet_royalties) ? res.bouquet_royalties : [],
        statements: Array.isArray(res.statements) ? res.statements : [],
      };
    }
  } catch (err) {
    console.error("[getUniversityRoyalties Error]", err);
  }

  return {
    available_balance: 0,
    total_paid: 0,
    contractual_rate: 15,
    institution: {
      id: "",
      name: "Établissement Universitaire Partenaire",
      royalty_rate: 15,
    },
    currency: "XOF",
    min_withdrawal_threshold: 100000,
    totals_summary: {
      paper_sales_count: 0,
      paper_royalties_total: 0,
      paper_gross_total: 0,
      digital_sales_count: 0,
      digital_royalties_total: 0,
      digital_gross_total: 0,
      bouquet_consultations_count: 0,
      bouquet_royalties_total: 0,
      bouquet_gross_allocated: 0,
    },
    unit_sales: [],
    bouquet_royalties: [],
    statements: [],
  };
}

export async function requestUniversityRoyaltyWithdrawal(amount: number): Promise<boolean> {
  await bffPost("/royalties/withdraw/", { amount });
  return true;
}

// ─── Profil ──────────────────────────────────────────────────────────────────

export async function getUniversityProfile(): Promise<UniversityProfileData> {
  return bffGet<UniversityProfileData>("/profile/");
}

export async function updateUniversityProfile(
  updates: Partial<UniversityProfileData>
): Promise<UniversityProfileData> {
  return bffPatch<UniversityProfileData>("/profile/", updates);
}

export async function exportBouquetCatalogWord(bouquet: UniversityBouquet): Promise<void> {
  try {
    const res = await fetch(`${BFF}/bouquets/${bouquet.id}/export-word/`, {
      credentials: "include",
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Bouquet_${bouquet.title.replace(/\s+/g, "_").slice(0, 50)}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      return;
    }
  } catch {
    // Fallback direct sur le générateur Word officiel client
  }

  // Fallback client haute fidélité
  let items = (bouquet.sample_books || []).map((b) => ({
    title: b.title,
    author: b.author || "Auteur Universitaire",
    discipline: bouquet.discipline || "Général",
    isbn: (b as any).isbn || (b as any).isbn_digital || "—",
    year: (b as any).year || new Date().getFullYear().toString(),
  }));

  // Si sample_books est vide, charger les ouvrages réels du catalogue correspondant au bouquet
  if (items.length === 0) {
    try {
      const catalog = await getUniversityCatalog();
      const matchingBooks = catalog.filter((book) => {
        if (bouquet.discipline && book.discipline?.toLowerCase().includes(bouquet.discipline.toLowerCase())) return true;
        if (bouquet.faculty_code && (book.faculty_code === bouquet.faculty_code || book.faculty_name?.toLowerCase().includes(bouquet.faculty_code.toLowerCase()))) return true;
        return false;
      });

      const selectedBooks = matchingBooks.length > 0 ? matchingBooks : catalog.slice(0, Math.max(bouquet.books_count || 3, 2));

      items = selectedBooks.map((b) => ({
        title: b.title,
        author: Array.isArray(b.authors) ? b.authors.join(", ") : (b.authors || "Auteur Universitaire"),
        discipline: b.discipline || bouquet.discipline || "Général",
        isbn: b.isbn_digital || b.isbn_print || "—",
        year: new Date().getFullYear().toString(),
      }));
    } catch (e) {
      console.error("Erreur enrichissement export bouquet Word:", e);
    }
  }

  const { generateWordDocument } = await import("@/lib/services/export-service");
  generateWordDocument({
    title: bouquet.title,
    subtitle: bouquet.description || "Catalogue officiel et bibliographie des manuels universitaires",
    institutionName: "Université Partenaire LAHAThèque",
    facultyName: bouquet.faculty_code || bouquet.discipline,
    items,
    filename: `Bouquet_${bouquet.title.replace(/\s+/g, "_").slice(0, 50)}.doc`,
  });
}
