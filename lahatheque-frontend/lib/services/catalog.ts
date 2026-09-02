import { Book } from "../types/catalog";
import { mockBooks } from "../mock/catalog";

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

function getBaseApiUrl(): string {
  if (typeof window === "undefined") {
    const internalUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
    return internalUrl.replace(/\/+$/, "");
  }
  return "/api/bff";
}

export async function searchBooks(filters: SearchFilters): Promise<Book[]> {
  try {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.author) params.set("author", filters.author);
    if (filters.discipline) params.set("discipline", filters.discipline);
    if (filters.institution) params.set("institution", filters.institution);
    if (filters.language) params.set("language", filters.language);
    if (filters.country) params.set("country", filters.country);
    if (filters.format) params.set("format", filters.format);
    if (filters.year) params.set("year", filters.year.toString());

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
      let results: Book[] = [];
      if (Array.isArray(json)) {
        results = json;
      } else if (json && Array.isArray(json.data)) {
        results = json.data;
      } else if (json && Array.isArray(json.results)) {
        results = json.results;
      }
      if (results.length > 0) return results;
    }
  } catch (err) {
    console.warn("BFF catalog non joignable, utilisation des données mockées :", err);
  }

  // Filtrage local robuste sur mockBooks en fallback
  return mockBooks.filter((book) => {
    if (filters.q) {
      const query = filters.q.toLowerCase();
      const matchTitle = book.title.toLowerCase().includes(query);
      const matchSubtitle = book.subtitle?.toLowerCase().includes(query);
      const matchAuthor = book.authors_details?.some(
        (a) => `${a.first_name} ${a.last_name}`.toLowerCase().includes(query)
      );
      if (!matchTitle && !matchSubtitle && !matchAuthor) return false;
    }
    if (filters.author) {
      const query = filters.author.toLowerCase();
      const matchAuthor = book.authors_details?.some(
        (a) => `${a.first_name} ${a.last_name}`.toLowerCase().includes(query)
      );
      if (!matchAuthor) return false;
    }
    if (filters.discipline) {
      const discQuery = filters.discipline.toLowerCase();
      const matchId = book.discipline_detail?.id?.toString() === filters.discipline.toString();
      const matchName = book.discipline_detail?.name?.toLowerCase().includes(discQuery);
      if (!matchId && !matchName) return false;
    }
    if (filters.institution) {
      if (!book.institution_name.toLowerCase().includes(filters.institution.toLowerCase())) return false;
    }
    if (filters.country) {
      if (book.country.toLowerCase() !== filters.country.toLowerCase()) return false;
    }
    if (filters.format) {
      const f = filters.format.toLowerCase();
      const formatType = (book.format_type as string).toLowerCase();
      if (f === "digital" || f === "numerique") {
        if (formatType !== "pdf" && formatType !== "epub" && formatType !== "digital") return false;
      } else if (f === "paper" || f === "papier") {
        const isPaper = Boolean((book as unknown as Record<string, unknown>).is_paper_available || formatType === "papier" || formatType === "paper");
        if (!isPaper) return false;
      } else {
        if (formatType !== f) return false;
      }
    }
    if (filters.year) {
      if (book.publication_year?.toString() !== filters.year.toString()) return false;
    }
    return true;
  });
}

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
    console.warn("BFF book detail fallback:", err);
  }

  return mockBooks.find((b) => b.id === id) || null;
}
