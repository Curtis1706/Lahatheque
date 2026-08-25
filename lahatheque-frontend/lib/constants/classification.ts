/**
 * Référentiel et Utilitaires Universels de Classification LAHAThèque.
 * Aligné sur la classification décimale Dewey, les nomenclatures universitaires et ONIX 3.0.
 */

export interface GenreCategory {
  label: string;
  dewey: string;
  faculty: string | null;
  aliases?: string[];
}

export const GENRE_CATEGORIES: GenreCategory[] = [
  {
    label: "Romans, Nouvelles & Récits",
    dewey: "840",
    faculty: null,
    aliases: ["roman", "fiction", "nouvelles", "recits", "littérature française", "romans"],
  },
  {
    label: "Mangas, Bandes Dessinées & Comics",
    dewey: "741.5",
    faculty: null,
    aliases: ["manga", "bande dessinée", "bd", "comics", "illustration", "mangas"],
  },
  {
    label: "Littérature Africaine & Conte",
    dewey: "800",
    faculty: "Faculté des Lettres, Langues, Arts et Communication (FLLAC)",
    aliases: ["litterature africaine", "conte", "poesie africaine", "theatre africain", "oralite", "contes"],
  },
  {
    label: "Jeunesse & Éveil",
    dewey: "808",
    faculty: null,
    aliases: ["jeunesse", "eveil", "enfants", "album jeunesse", "conte pour enfants"],
  },
  {
    label: "Manuels Scolaires (Primaire / Collège / Lycée)",
    dewey: "370",
    faculty: null,
    aliases: ["scolaire", "manuel scolaire", "education", "pedagogie", "primaire", "college", "lycee"],
  },
  {
    label: "Droit Privé, Droit des Affaires OHADA & Sciences Politiques",
    dewey: "340",
    faculty: "Faculté de Droit et de Science Politique (FADESP)",
    aliases: ["droit", "ohada", "sciences politiques", "juridique", "droit commercial", "droit penal", "droit civil", "droit des affaires", "fadesp"],
  },
  {
    label: "Sciences Économiques, Gestion & Finances UEMOA",
    dewey: "330",
    faculty: "Faculté des Sciences Économiques et de Gestion (FASEG)",
    aliases: ["economie", "gestion", "finances", "uemoa", "banque", "comptabilite", "management", "marketing", "faseg"],
  },
  {
    label: "Médecine, Pharmacopée & Santé Publique Tropicale",
    dewey: "610",
    faculty: "Faculté des Sciences de la Santé (FSS)",
    aliases: ["medecine", "sante", "sante publique", "pharmacopee", "clinique", "infirmerie", "sciences medicales", "fss", "hopital", "service social", "soins"],
  },
  {
    label: "Sciences Exactes, Informatique & Technologies",
    dewey: "500",
    faculty: "Faculté des Sciences et Techniques (FAST)",
    aliases: ["informatique", "mathematiques", "physique", "chimie", "technologie", "ingenierie", "fast", "sciences exactes"],
  },
  {
    label: "Agronomie Tropicale & Développement Rural",
    dewey: "630",
    faculty: "Faculté des Sciences Agronomiques (FSA)",
    aliases: ["agronomie", "agriculture", "elevage", "developpement rural", "environnement", "fsa"],
  },
  {
    label: "Histoire, Civilisations & Patrimoine Africain",
    dewey: "960",
    faculty: "Faculté des Lettres, Langues, Arts et Communication (FLLAC)",
    aliases: ["histoire", "civilisation", "patrimoine", "anthropologie", "archeologie", "histoire africaine"],
  },
  {
    label: "Philosophie, Psychologie & Sciences Humaines",
    dewey: "100",
    faculty: "Faculté des Sciences Humaines et Sociales (FASHS)",
    aliases: ["philosophie", "psychologie", "sociologie", "sciences humaines", "fashs", "ethique"],
  },
  {
    label: "Développement Personnel, Essais & Société",
    dewey: "150",
    faculty: null,
    aliases: ["developpement personnel", "essais", "societe", "motivation", "leadership", "bien-etre"],
  },
  {
    label: "Arts, Culture, Cuisine & Musique",
    dewey: "700",
    faculty: null,
    aliases: ["arts", "culture", "musique", "cuisine", "gastronomie", "cinema", "theatre"],
  },
];

export const AFRICAN_UNIVERSITIES: string[] = [
  "Non affilié (Grand Public / Fiction / Scolaire)",
  "Université d'Abomey-Calavi (UAC - Bénin)",
  "Université de Parakou (UP - Bénin)",
  "Université Nationale d'Agriculture (UNA - Bénin)",
  "Université Nationale des Sciences, Technologies, Ingénierie et Mathématiques (UNSTIM - Bénin)",
  "Université Cheikh Anta Diop (UCAD - Sénégal)",
  "Université Félix Houphouët-Boigny (UFHB - Côte d'Ivoire)",
  "Université de Lomé (UL - Togo)",
  "Université Abdou Moumouni (UAM - Niger)",
  "Université de Yaoundé I (Cameroun)",
  "Université Joseph Ki-Zerbo (Burkina Faso)",
  "Université de Kinshasa (UNIKIN - RDC)",
  "Université Gaston Berger (UGB - Sénégal)",
  "Université d'Alassane Ouattara (UAO - Côte d'Ivoire)",
];

export interface LanguageOption {
  code: string;
  label: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "fr", label: "Français" },
  { code: "en", label: "Anglais" },
  { code: "pt", label: "Portugais" },
  { code: "es", label: "Espagnol" },
  { code: "ar", label: "Arabe" },
  { code: "fon", label: "Fon" },
  { code: "yo", label: "Yoruba" },
  { code: "wo", label: "Wolof" },
  { code: "sw", label: "Swahili" },
  { code: "ha", label: "Haoussa" },
  { code: "ln", label: "Lingala" },
  { code: "bm", label: "Bambara" },
  { code: "de", label: "Allemand" },
  { code: "it", label: "Italien" },
  { code: "other", label: "Autre langue" },
];

export interface CountryOption {
  code: string;
  label: string;
}

export const SUPPORTED_COUNTRIES: CountryOption[] = [
  { code: "BJ", label: "Bénin (BJ)" },
  { code: "SN", label: "Sénégal (SN)" },
  { code: "CI", label: "Côte d'Ivoire (CI)" },
  { code: "TG", label: "Togo (TG)" },
  { code: "NE", label: "Niger (NE)" },
  { code: "CD", label: "RDC (CD)" },
  { code: "CM", label: "Cameroun (CM)" },
  { code: "BF", label: "Burkina Faso (BF)" },
  { code: "ML", label: "Mali (ML)" },
  { code: "GN", label: "Guinée (GN)" },
  { code: "GA", label: "Gabon (GA)" },
  { code: "CG", label: "Congo (CG)" },
  { code: "NG", label: "Nigéria (NG)" },
  { code: "GH", label: "Ghana (GH)" },
  { code: "RW", label: "Rwanda (RW)" },
  { code: "MA", label: "Maroc (MA)" },
  { code: "DZ", label: "Algérie (DZ)" },
  { code: "TN", label: "Tunisie (TN)" },
  { code: "BR", label: "Brésil (BR)" },
  { code: "FR", label: "France (FR)" },
  { code: "PT", label: "Portugal (PT)" },
  { code: "US", label: "États-Unis (US)" },
  { code: "CA", label: "Canada (CA)" },
  { code: "GLOBAL", label: "International / Global" },
];

// ─── Helpers de Normalisation Intelligente ─────────────────────────────────────

function normalizeStr(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Associe une suggestion de discipline/genre IA (ou Dewey) au référentiel officiel.
 */
export function matchGenreCategory(
  aiGenre?: string | null,
  deweyCode?: string | null
): GenreCategory {
  if (!aiGenre && !deweyCode) {
    return GENRE_CATEGORIES[0];
  }

  // 1. Correspondance exacte par label
  if (aiGenre) {
    const exact = GENRE_CATEGORIES.find((g) => g.label.toLowerCase() === aiGenre.toLowerCase());
    if (exact) return exact;
  }

  // 2. Correspondance par code Dewey
  if (deweyCode) {
    const cleanDewey = deweyCode.trim();
    const deweyMatch = GENRE_CATEGORIES.find(
      (g) => g.dewey === cleanDewey || cleanDewey.startsWith(g.dewey.slice(0, 2))
    );
    if (deweyMatch) return deweyMatch;
  }

  // 3. Correspondance floue par alias et mots-clés
  if (aiGenre) {
    const norm = normalizeStr(aiGenre);
    for (const cat of GENRE_CATEGORIES) {
      if (normalizeStr(cat.label).includes(norm) || norm.includes(normalizeStr(cat.label))) {
        return cat;
      }
      if (cat.aliases?.some((alias) => norm.includes(normalizeStr(alias)) || normalizeStr(alias).includes(norm))) {
        return cat;
      }
    }
  }

  // 4. Si c'est un genre totalement spécifique, créer une structure compatible
  return {
    label: aiGenre || "Romans, Nouvelles & Récits",
    dewey: deweyCode || "840",
    faculty: null,
  };
}

/**
 * Normalise la langue suggérée par l'IA (nom ou code ISO) en libellé standard.
 */
export function matchLanguage(aiLang?: string | null): string {
  if (!aiLang) return "Français";

  const norm = normalizeStr(aiLang);

  if (norm.includes("portug") || norm === "pt" || norm === "por") return "Portugais";
  if (norm.includes("franc") || norm === "fr" || norm === "fre" || norm === "fra") return "Français";
  if (norm.includes("angl") || norm.includes("english") || norm === "en" || norm === "eng") return "Anglais";
  if (norm.includes("espagn") || norm.includes("spanish") || norm === "es" || norm === "spa") return "Espagnol";
  if (norm.includes("arab") || norm === "ar" || norm === "ara") return "Arabe";
  if (norm.includes("fon")) return "Fon";
  if (norm.includes("yoruba") || norm === "yo") return "Yoruba";
  if (norm.includes("wolof") || norm === "wo") return "Wolof";
  if (norm.includes("swahili") || norm === "sw") return "Swahili";
  if (norm.includes("haoussa") || norm.includes("hausa") || norm === "ha") return "Haoussa";
  if (norm.includes("lingala") || norm === "ln") return "Lingala";
  if (norm.includes("bambara") || norm === "bm") return "Bambara";
  if (norm.includes("allemand") || norm.includes("german") || norm === "de") return "Allemand";
  if (norm.includes("italien") || norm.includes("italian") || norm === "it") return "Italien";

  // Retrouver parmi les options connues
  const found = SUPPORTED_LANGUAGES.find((l) => normalizeStr(l.label) === norm);
  if (found) return found.label;

  // Si langue personnalisée, capitaliser
  return aiLang.charAt(0).toUpperCase() + aiLang.slice(1);
}

/**
 * Normalise le code pays suggéré par l'IA en code standard du référentiel.
 */
export function matchCountry(aiCountry?: string | null): string {
  if (!aiCountry) return "BJ";

  const norm = normalizeStr(aiCountry).toUpperCase();

  const direct = SUPPORTED_COUNTRIES.find((c) => c.code === norm);
  if (direct) return direct.code;

  if (norm.includes("BRESIL") || norm.includes("BRAZIL") || norm.includes("BRASIL")) return "BR";
  if (norm.includes("BENIN")) return "BJ";
  if (norm.includes("SENEGAL")) return "SN";
  if (norm.includes("COTE D'IVOIRE") || norm.includes("IVORY")) return "CI";
  if (norm.includes("TOGO")) return "TG";
  if (norm.includes("NIGER")) return "NE";
  if (norm.includes("CONGO") || norm.includes("RDC")) return "CD";
  if (norm.includes("CAMEROUN") || norm.includes("CAMEROON")) return "CM";
  if (norm.includes("BURKINA")) return "BF";
  if (norm.includes("FRANCE")) return "FR";
  if (norm.includes("PORTUGAL")) return "PT";
  if (norm.includes("ETATS-UNIS") || norm.includes("USA") || norm.includes("UNITED STATES")) return "US";
  if (norm.includes("CANADA")) return "CA";
  if (norm.includes("GLOBAL") || norm.includes("INTERNATIONAL")) return "GLOBAL";

  return "BJ";
}

// ─── Générateurs Dynamiques d'Options pour Dropdowns (<select>) ────────────────

export function getUniversityOptions(
  aiSuggestion?: string | null,
  currentSelection?: string | null
): string[] {
  const list = [...AFRICAN_UNIVERSITIES];

  if (aiSuggestion && aiSuggestion.trim() && !list.includes(aiSuggestion.trim())) {
    list.splice(1, 0, aiSuggestion.trim());
  }

  if (currentSelection && currentSelection.trim() && !list.includes(currentSelection.trim())) {
    list.push(currentSelection.trim());
  }

  return list;
}

export function getLanguageOptions(
  aiSuggestion?: string | null,
  currentSelection?: string | null
): string[] {
  const labels = SUPPORTED_LANGUAGES.map((l) => l.label);

  if (aiSuggestion && aiSuggestion.trim() && !labels.includes(aiSuggestion.trim())) {
    labels.push(aiSuggestion.trim());
  }

  if (currentSelection && currentSelection.trim() && !labels.includes(currentSelection.trim())) {
    labels.push(currentSelection.trim());
  }

  return labels;
}

export function getCountryOptions(
  aiSuggestion?: string | null,
  currentSelection?: string | null
): CountryOption[] {
  const list = [...SUPPORTED_COUNTRIES];

  if (aiSuggestion && aiSuggestion.trim()) {
    const code = matchCountry(aiSuggestion);
    if (!list.some((c) => c.code === code)) {
      list.push({ code, label: `${aiSuggestion} (${code})` });
    }
  }

  if (currentSelection && currentSelection.trim()) {
    if (!list.some((c) => c.code === currentSelection)) {
      list.push({ code: currentSelection, label: `${currentSelection} (${currentSelection})` });
    }
  }

  return list;
}

export function getGenreOptions(
  aiSuggestion?: string | null,
  currentSelection?: string | null
): GenreCategory[] {
  const list = [...GENRE_CATEGORIES];

  if (aiSuggestion && aiSuggestion.trim() && !list.some((g) => g.label === aiSuggestion.trim())) {
    const matched = matchGenreCategory(aiSuggestion);
    if (matched.label === aiSuggestion.trim()) {
      list.push(matched);
    }
  }

  if (currentSelection && currentSelection.trim() && !list.some((g) => g.label === currentSelection.trim())) {
    list.push({ label: currentSelection.trim(), dewey: "000", faculty: null });
  }

  return list;
}
