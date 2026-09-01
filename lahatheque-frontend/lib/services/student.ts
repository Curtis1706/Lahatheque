/**
 * Services Espace Client Lecteur / Étudiant
 * 100% connecté aux endpoints Django via le BFF Next.js
 * ZÉRO donnée mockée — toutes les données proviennent du backend réel
 */

const BFF = "/api/bff/student";

// ─── Helpers BFF ──────────────────────────────────────────────────────────────

async function bffGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BFF}${path}`, {
    credentials: "include",
    cache: "no-store",
  });
  if (res.status === 401) {
    throw new Error("SESSION_EXPIRED");
  }
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
  if (res.status === 401) throw new Error("SESSION_EXPIRED");
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Erreur serveur");
  return json.data as T;
}

async function bffPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BFF}${path}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.status === 401) throw new Error("SESSION_EXPIRED");
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Erreur serveur");
  return json.data as T;
}

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface BookAuthorAPI {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
}

export interface BookAPI {
  id: string;
  isbn: string;
  title: string;
  subtitle: string;
  authors: BookAuthorAPI[];
  discipline_name: string;
  publisher_name: string;
  institution_name: string;
  country: string;
  format_type: "pdf" | "epub" | "audio";
  page_count: number;
  sample_pages_count?: number;
  publication_date: string;
  language: string;
  summary: string;
  status: string;
  price_digital: number;
  price_paper: number;
  is_paper_available?: boolean;
  cover_url: string;
  is_owned?: boolean;
  has_digital_access?: boolean;
  author_discounted_digital_price?: number | null;
  author_discounted_paper_price?: number | null;
  // Champs enrichis par la bibliothèque
  progress_percent?: number;
  current_page?: number;
  last_read_chapter?: string;
  last_read_at?: string;
  is_completed?: boolean;
  is_favorite?: boolean;
  access_type?: string;
}

export interface StudentOverviewKPIs {
  totalBooksInLibrary: number;
  currentReading: {
    ouvrage: BookAPI;
    progress_percent: number;
    last_read_chapter: string;
    last_read_at: string;
  } | null;
  unlockedBouquetsCount: number;
  unpaidOrdersCount: number;
  hasUniversityAffiliation: boolean;
  institutionName: string | null;
  weeklyReadingHours: number;
  readingStreakDays: number;
  affiliation?: {
    institution_name: string;
    faculty_name: string;
    level: string;
  } | null;
  stats?: {
    weekly_hours: number;
    books_completed_count: number;
    current_streak_days: number;
    overall_progress: number;
    total_books_read?: number;
  };
}

export interface DeliveryAPI {
  id: string;
  shipping_address: string;
  city: string;
  country: string;
  tracking_number: string;
  carrier_name: string;
  statut: string;
  statut_display: string;
  updated_at: string;
}

export interface OrderLineAPI {
  id: string;
  ouvrage: string;
  ouvrage_title: string;
  ouvrage_cover_url?: string;
  discipline_name?: string;
  author_name?: string;
  format_type: "digital" | "paper";
  format_display: string;
  unit_price: number;
  quantity: number;
}

export interface OrderAPI {
  id: string;
  total_amount: number;
  currency: string;
  statut_paiement: string;
  statut_paiement_display: string;
  statut_commande: string;
  statut_commande_display: string;
  mode_paiement?: string;
  mode_paiement_display?: string;
  type_commande?: string;
  type_commande_display?: string;
  is_credit_purchase?: boolean;
  credit_due_date?: string;
  returned_at?: string;
  return_reason?: string;
  lignes: OrderLineAPI[];
  livraison: DeliveryAPI | null;
  created_at: string;
  updated_at: string;
}

export interface BouquetAPI {
  id: string;
  title: string;
  bouquet_type: string;
  faculty_code: string;
  discipline: string;
  books_count: number;
  status: string;
  start_date: string;
  end_date: string;
}

export interface InstitutionAPI {
  id: string;
  name: string;
  code: string;
  short_name: string;
  country: string;
  city: string;
}

export interface AffiliationAPI {
  id: string;
  institution: string;
  institution_detail: InstitutionAPI;
  student_card_number: string;
  level: string;
  status: "pending" | "approved" | "rejected" | "suspended" | "expired";
  status_display: string;
  motif_rejet: string;
  is_validated: boolean;
  created_at: string;
  bouquets: BouquetAPI[];
}

export interface HistoryStatsAPI {
  weekly_hours: number;
  daily_activity: { day: string; hours: number; date: string }[];
  overall_progress: number;
  discipline_breakdown: { name: string; percentage: number; color: string }[];
  current_streak_days: number;
  total_pages_read: number;
  books_completed_count: number;
  active_goals?: {
    id: string;
    title: string;
    progress_percent: number;
    is_completed: boolean;
  }[];
  recent_sessions_timeline: {
    id: string;
    ouvrage_id?: string;
    ouvrage_title: string;
    ouvrage_discipline: string;
    ouvrage_cover_url?: string;
    duration_minutes: number;
    pages_read: number;
    session_date: string;
  }[];
}

export interface StudentProfileAPI {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  country: string;
  university_affiliation: string;
  avatar: string | null;
  affiliation: AffiliationAPI | null;
}

export interface CatalogDataAPI {
  books: BookAPI[];
  disciplines: { id: string; name: string }[];
  total: number;
}

// ─── Vue d'ensemble KPIs ───────────────────────────────────────────────────────

export async function getStudentOverview(): Promise<StudentOverviewKPIs> {
  return bffGet<StudentOverviewKPIs>("/overview/");
}

// ─── Ma Bibliothèque ──────────────────────────────────────────────────────────

export async function getStudentBooks(
  format?: string,
  favoritesOnly?: boolean
): Promise<BookAPI[]> {
  const params = new URLSearchParams();
  if (format && format !== "all") params.set("format", format);
  if (favoritesOnly) params.set("favorites", "true");
  const query = params.toString();
  return bffGet<BookAPI[]>(`/books/${query ? `?${query}` : ""}`);
}

export async function getStudentBookDetail(bookId: string): Promise<{
  ouvrage: BookAPI;
  access: {
    access_granted: boolean;
    reason: string;
    stream_url?: string;
    error?: string;
  };
  reading_progress: {
    progress_percent: number;
    current_page: number;
    last_read_at: string;
    is_completed: boolean;
    is_favorite: boolean;
  } | null;
}> {
  return bffGet(`/books/${bookId}/`);
}

export async function toggleStudentFavorite(bookId: string): Promise<boolean> {
  const data = await bffPost<{ is_favorite: boolean }>(
    `/books/${bookId}/favorite/`,
    {}
  );
  return data.is_favorite;
}

// ─── Progression de Lecture ────────────────────────────────────────────────────

export async function updateReadingProgress(payload: {
  ouvrage_id: string;
  progress_percent: number;
  current_page?: number;
  total_pages?: number;
  last_read_chapter?: string;
  duration_seconds?: number;
  pages_read?: number;
}): Promise<void> {
  await bffPost("/reading/progress/", payload);
}

// ─── Historique & Statistiques ────────────────────────────────────────────────

export async function getStudentHistoryStats(): Promise<HistoryStatsAPI> {
  return bffGet<HistoryStatsAPI>("/history/stats/");
}

// ─── Achats & Commandes ────────────────────────────────────────────────────────

export async function getStudentOrders(): Promise<OrderAPI[]> {
  return bffGet<OrderAPI[]>("/orders/");
}

export async function createPaperOrder(payload: {
  ouvrage_id: string;
  quantity: number;
  shipping_address: string;
  city: string;
  country: string;
}): Promise<OrderAPI> {
  return bffPost<OrderAPI>("/orders/", payload);
}

// ─── Mon Université & Affiliation ─────────────────────────────────────────────

export async function getStudentUniversity(): Promise<{
  affiliation: AffiliationAPI | null;
  institutions: InstitutionAPI[];
}> {
  return bffGet("/university/");
}

export async function requestAffiliation(payload: {
  institution_id: string;
  student_card_number: string;
  level?: string;
  carte_etudiant_image?: string;
}): Promise<AffiliationAPI> {
  return bffPost<AffiliationAPI>("/university/", payload);
}

// ─── Catalogue ─────────────────────────────────────────────────────────────────

export async function getStudentCatalog(
  q?: string,
  discipline?: string,
  format?: string
): Promise<CatalogDataAPI> {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (discipline && discipline !== "all") params.set("discipline", discipline);
  if (format && format !== "all") params.set("format", format);
  const query = params.toString();
  return bffGet<CatalogDataAPI>(`/catalog/${query ? `?${query}` : ""}`);
}

// ─── Profil ────────────────────────────────────────────────────────────────────

export async function getStudentProfile(): Promise<StudentProfileAPI> {
  return bffGet<StudentProfileAPI>("/profile/");
}

export async function updateStudentProfile(payload: {
  first_name?: string;
  last_name?: string;
  phone?: string;
  country?: string;
}): Promise<StudentProfileAPI> {
  return bffPut<StudentProfileAPI>("/profile/", payload);
}

// ─── Rétrocompatibilité (anciens imports mock) ─────────────────────────────────

/** @deprecated Utilisez getStudentBooks() */
export const getClientLibraryBooks = getStudentBooks;
/** @deprecated Utilisez getStudentOrders() */
export const getClientOrders = getStudentOrders;
/** @deprecated Utilisez getStudentUniversity() */
export const getUniversityAffiliation = async () => {
  const data = await getStudentUniversity();
  return data.affiliation;
};
/** @deprecated Pas de souscriptions individuelles — accès via bouquets ou achats */
export const getClientSubscriptions = async () => [];
export const cancelClientSubscription = async (_id: string) => true;
