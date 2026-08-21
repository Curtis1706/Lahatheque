import { Book } from "../types/catalog";

export interface SearchFilters {
  q?: string;
  discipline?: string;
  institution?: string;
  language?: string;
  country?: string;
  format?: string;
}

export async function searchBooks(filters: SearchFilters): Promise<Book[]> {
  try {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.discipline) params.set("discipline", filters.discipline);
    if (filters.institution) params.set("institution", filters.institution);
    if (filters.language) params.set("language", filters.language);
    if (filters.country) params.set("country", filters.country);
    if (filters.format) params.set("format", filters.format);

    const queryStr = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`/api/bff/catalog/books/${queryStr}`, {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Erreur de recherche catalogue");
    const json = await res.json();
    return Array.isArray(json) ? json : (json.results || []);
  } catch (err) {
    console.error("searchBooks error:", err);
    return [];
  }
}

export async function getBookById(id: string): Promise<Book | null> {
  try {
    const res = await fetch(`/api/bff/catalog/books/${id}/`, {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("getBookById error:", err);
    return null;
  }
}
