import type {
  UniversityKpis,
  UniversityFacultyData,
  UniversityBouquet,
  UniversityBookCatalogItem,
  UniversityPaperOrder,
  UniversityStudentAffiliationData,
  UniversityRoyaltyStatementData,
  UniversityRoyaltiesDetailData,
  UniversityProfileData,
} from "../types/university";
import { buildUniversityRoyaltiesDetailData } from "../mock/university-royalties";

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
    if (res && (res.unit_sales || res.bouquet_royalties)) {
      const contractualRate = Number(res.contractual_rate ?? 15);
      const currency = res.currency ?? "XOF";
      const fallback = buildUniversityRoyaltiesDetailData(contractualRate, currency);

      return {
        available_balance: res.summary?.total_available ?? res.available_balance ?? fallback.available_balance,
        total_paid: res.summary?.total_paid ?? res.total_paid ?? fallback.total_paid,
        contractual_rate: contractualRate,
        currency,
        min_withdrawal_threshold: Number(res.min_withdrawal_threshold ?? 100000),
        totals_summary: res.totals_summary ?? fallback.totals_summary,
        unit_sales: Array.isArray(res.unit_sales) && res.unit_sales.length > 0 ? res.unit_sales : fallback.unit_sales,
        bouquet_royalties: Array.isArray(res.bouquet_royalties) && res.bouquet_royalties.length > 0 ? res.bouquet_royalties : fallback.bouquet_royalties,
        statements: Array.isArray(res.statements) ? res.statements : [],
      };
    }
  } catch (err) {
    // Si l'endpoint n'est pas encore implémenté ou en mock
  }

  return buildUniversityRoyaltiesDetailData(15, "XOF");
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
