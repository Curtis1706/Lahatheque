/**
 * Options et utilitaires standardisés pour le filtre de langue du catalogue LAHAThèque.
 */

export interface LanguageFilterOption {
  value: string;
  label: string;
}

export const CATALOG_LANGUAGE_OPTIONS: LanguageFilterOption[] = [
  { value: "all", label: "Toutes les langues" },
  { value: "fr", label: "Français" },
  { value: "en", label: "Anglais" },
  { value: "bilingual", label: "Bilingue (FR & EN)" },
];

/**
 * Prédicat standardisé pour filtrer un ouvrage en mémoire selon la langue sélectionnée.
 * Compatible avec tous les types de livres (Book, AdminCatalogBook, WholesalerBook, etc.)
 */
export function matchesLanguageFilter(
  book: {
    language?: string;
    original_language?: string;
    available_languages?: string[];
  },
  filterValue: string
): boolean {
  if (!filterValue || filterValue === "all") return true;

  const rawLangs = book.available_languages && book.available_languages.length > 0
    ? book.available_languages
    : [book.original_language || book.language || "fr"];

  const normalizedLangs = rawLangs.map((l) => (l ? l.toLowerCase().trim() : ""));

  if (filterValue === "bilingual") {
    // Ouvrage disposant d'au moins deux langues ou spécifiquement fr + en
    return normalizedLangs.length > 1;
  }

  if (filterValue === "fr") {
    // Contient le français soit en langue principale, soit en déclinaison linguistique
    return normalizedLangs.some((l) => l.startsWith("fr") || l === "français" || l === "francais");
  }

  if (filterValue === "en") {
    // Contient l'anglais soit en langue originale, soit en déclinaison linguistique
    return normalizedLangs.some((l) => l.startsWith("en") || l === "anglais" || l === "english");
  }

  return normalizedLangs.includes(filterValue.toLowerCase());
}
