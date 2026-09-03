import { Book } from "../types/catalog";

export interface SearchFilters {
  q?: string;
  author?: string;
  discipline?: string;
  institution?: string;
  language?: string;
  country?: string;
  format?: string;
  year?: string | number;
}

export interface InstitutionOption {
  id: string;
  code: string;
  name: string;
  short_name: string;
  city: string;
  country: string;
}

function getBaseApiUrl(): string {
  if (typeof window === "undefined") {
    const internalUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
    return internalUrl.replace(/\/+$/, "");
  }
  return "/api/bff";
}

/**
 * Récupère les universités et établissements partenaires actifs en base de données
 */
export async function getInstitutions(): Promise<InstitutionOption[]> {
  try {
    const isServer = typeof window === "undefined";
    const url = isServer
      ? `${getBaseApiUrl()}/v1/catalog/institutions/`
      : `/api/bff/catalog/institutions/`;

    const res = await fetch(url, {
      credentials: "include",
      cache: "no-store",
    });

    if (res.ok) {
      const json = await res.json();
      if (json && Array.isArray(json.data)) {
        return json.data;
      }
      if (Array.isArray(json)) {
        return json;
      }
    }
  } catch (err) {
    console.error("Erreur lors de la récupération des institutions:", err);
  }
  return [];
}

/**
 * Recherche réelle des ouvrages du catalogue depuis la base de données (zéro mock)
 */
export async function searchBooks(filters: SearchFilters): Promise<Book[]> {
  try {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q.trim());
    if (filters.author) params.set("author", filters.author.trim());
    if (filters.discipline) params.set("discipline", filters.discipline.trim());
    if (filters.institution) params.set("institution", filters.institution.trim());
    if (filters.language) params.set("language", filters.language.trim());
    if (filters.country) params.set("country", filters.country.trim());
    if (filters.format) params.set("format", filters.format.trim());
    if (filters.year) params.set("year", filters.year.toString().trim());

    const queryStr = params.toString() ? `?${params.toString()}` : "";
    const isServer = typeof window === "undefined";
    const url = isServer
      ? `${getBaseApiUrl()}/v1/catalog/books/${queryStr}`
      : `/api/bff/catalog/books/${queryStr}`;

    const res = await fetch(url, {
      credentials: "include",
      cache: "no-store",
    });

    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json)) {
        return json;
      }
      if (json && Array.isArray(json.data)) {
        return json.data;
      }
      if (json && Array.isArray(json.results)) {
        return json.results;
      }
    }
    return [];
  } catch (err) {
    console.error("Erreur API catalogue:", err);
    return [];
  }
}

/**
 * Récupère le détail d'un ouvrage depuis la base de données par ID ou ISBN (zéro mock)
 */
export async function getBookById(id: string): Promise<Book | null> {
  try {
    const isServer = typeof window === "undefined";
    const url = isServer
      ? `${getBaseApiUrl()}/v1/catalog/books/${id}/`
      : `/api/bff/catalog/books/${id}/`;

    const res = await fetch(url, {
      credentials: "include",
      cache: "no-store",
    });

    if (res.ok) {
      const json = await res.json();
      if (json && typeof json === "object") {
        if ("data" in json && json.data) {
          return json.data as Book;
        }
        return json as Book;
      }
    }
  } catch (err) {
    console.error("Erreur récupération ouvrage:", err);
  }
  return null;
}
