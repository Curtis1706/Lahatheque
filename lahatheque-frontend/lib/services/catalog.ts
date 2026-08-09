import { Book } from "../types/catalog";
import { mockBooks } from "../mock/catalog";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface SearchFilters {
  q?: string;
  discipline?: string;
  institution?: string;
  language?: string;
  country?: string;
  format?: string;
}

export async function searchBooks(filters: SearchFilters): Promise<Book[]> {
  await delay(800); // simulation de délai réseau
  
  let results = [...mockBooks];

  if (filters.q) {
    const query = filters.q.toLowerCase();
    results = results.filter(book => 
      book.title.toLowerCase().includes(query) ||
      book.subtitle?.toLowerCase().includes(query) ||
      book.authors_details.some(author => 
        (author.first_name + " " + author.last_name).toLowerCase().includes(query)
      ) ||
      book.summary.toLowerCase().includes(query)
    );
  }

  if (filters.discipline) {
    results = results.filter(book => book.discipline_detail.name === filters.discipline);
  }

  if (filters.institution) {
    const inst = filters.institution;
    results = results.filter(book => book.institution_name.includes(inst));
  }

  if (filters.language) {
    results = results.filter(book => book.language === filters.language);
  }

  if (filters.country) {
    results = results.filter(book => book.country === filters.country);
  }

  if (filters.format) {
    results = results.filter(book => book.format_type === filters.format);
  }

  return results;
}

export async function getBookById(id: string): Promise<Book | null> {
  await delay(600);
  const book = mockBooks.find(b => b.id === id);
  return book ? { ...book } : null;
}
