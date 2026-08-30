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
    const res = await fetch(`/api/bff/catalog/books/${queryStr}`, {
      credentials: "include",
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      const results = Array.isArray(json) ? json : (json.results || []);
      if (results.length > 0) return results;
    }
  } catch (err) {
    console.warn("BFF catalog non joignable, utilisation des données mockées :", err);
  }

  // Filtrage local robuste sur mockBooks
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
      if (book.discipline_detail.id.toString() !== filters.discipline.toString()) return false;
    }
    if (filters.institution) {
      if (!book.institution_name.toLowerCase().includes(filters.institution.toLowerCase())) return false;
    }
    if (filters.country) {
      if (book.country.toLowerCase() !== filters.country.toLowerCase()) return false;
    }
    if (filters.format) {
      if (book.format_type.toLowerCase() !== filters.format.toLowerCase()) return false;
    }
    if (filters.year) {
      if (book.publication_year?.toString() !== filters.year.toString()) return false;
    }
    return true;
  });
}

export async function getBookById(id: string): Promise<Book | null> {
  try {
    const res = await fetch(`/api/bff/catalog/books/${id}/`, {
      credentials: "include",
      cache: "no-store",
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("BFF book detail fallback:", err);
  }

  return mockBooks.find((b) => b.id === id) || null;
}

