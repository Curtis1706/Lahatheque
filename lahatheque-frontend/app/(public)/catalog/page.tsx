"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Search, 
  BookOpen, 
  Building2, 
  GraduationCap, 
  Filter, 
  X,
  Sparkles,
  UserCheck,
  ArrowRight,
  Calendar
} from "lucide-react";
import { Book } from "@/lib/types/catalog";
import { searchBooks, getInstitutions, type InstitutionOption } from "@/lib/services/catalog";
import { ActionSearchBar } from "@/components/ui/action-search-bar";
import { Book as Book3D } from "@/components/ui/book";
import { DisciplineCombobox } from "@/components/features/catalog/discipline-combobox";
import { useDisciplines } from "@/lib/hooks/use-disciplines";

// Liste dynamique des années de publication : de l'année en cours jusqu'à 1950
const CURRENT_YEAR = new Date().getFullYear();
const PUBLICATION_YEARS = Array.from(
  { length: CURRENT_YEAR - 1950 + 1 },
  (_, i) => CURRENT_YEAR - i
);

function CatalogSearchInner() {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") || "";

  const { disciplineNames } = useDisciplines();
  const [books, setBooks] = useState<Book[]>([]);
  const [institutions, setInstitutions] = useState<InstitutionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [authorQuery, setAuthorQuery] = useState("");
  const [selectedDiscipline, setSelectedDiscipline] = useState("");
  const [selectedInstitution, setSelectedInstitution] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Chargement dynamique des universités de la base de données
  useEffect(() => {
    getInstitutions().then((data) => {
      if (data && data.length > 0) {
        setInstitutions(data);
      }
    });
  }, []);

  // Sync searchQuery when URL query parameter changes
  useEffect(() => {
    if (urlQuery) {
      setSearchQuery(urlQuery);
    }
  }, [urlQuery]);

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const data = await searchBooks({
          q: searchQuery || undefined,
          author: authorQuery || undefined,
          discipline: selectedDiscipline || undefined,
          institution: selectedInstitution || undefined,
          language: selectedLanguage || undefined,
          format: selectedFormat || undefined,
          year: selectedYear || undefined
        });
        setBooks(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [searchQuery, authorQuery, selectedDiscipline, selectedInstitution, selectedLanguage, selectedFormat, selectedYear]);

  const clearFilters = () => {
    setSearchQuery("");
    setAuthorQuery("");
    setSelectedDiscipline("");
    setSelectedInstitution("");
    setSelectedLanguage("");
    setSelectedFormat("");
    setSelectedYear("");
  };

  const hasActiveFilters = Boolean(
    searchQuery || authorQuery || selectedDiscipline || selectedInstitution || selectedLanguage || selectedFormat || selectedYear
  );

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-12 max-w-[1920px] mx-auto">
      <div className="space-y-8">
        
        {/* En-tête de section */}
        <div className="space-y-3 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 text-navy border border-gold/20 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            Bibliothèque Universitaire &amp; Partenaires
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-navy tracking-tight">
            Catalogue des Ouvrages
          </h1>
          <p className="text-sm sm:text-base text-foreground-muted max-w-3xl leading-relaxed">
            Explorez les manuels académiques, traités juridiques, thèses et revues scientifiques classés par auteurs, institutions partenaires et disciplines.
          </p>
        </div>

        {/* Barre de Recherche Principale Dynamique */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="w-full sm:max-w-2xl">
            <ActionSearchBar 
              initialValue={searchQuery}
              onSearch={(val) => setSearchQuery(val)}
              onSelectAction={(category, value) => {
                if (category === "discipline") {
                  setSelectedDiscipline(value);
                } else if (category === "institution") {
                  setSelectedInstitution(value);
                }
              }}
            />
          </div>

          {/* Filtre Mobile Toggle */}
          <div className="md:hidden w-full">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background-secondary text-navy font-bold text-sm w-full justify-center shadow-xs"
            >
              <Filter className="w-4 h-4 text-gold" />
              {showMobileFilters ? "Masquer les filtres" : "Afficher les filtres & Auteurs"}
            </button>
          </div>
        </div>

        {/* Grille principale Layout (Filtres + Résultats) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Panneau de Filtres (Sidebar) */}
          <aside className={`md:col-span-4 lg:col-span-3 space-y-6 bg-background-secondary p-6 rounded-2xl border border-border sticky top-24 ${showMobileFilters ? "block" : "hidden md:block"}`}>
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="font-serif font-bold text-navy text-base flex items-center gap-2">
                <Filter className="w-4 h-4 text-gold" />
                Filtres &amp; Recherche
              </h2>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-gold hover:text-gold-dark font-medium underline cursor-pointer"
                >
                  Réinitialiser
                </button>
              )}
            </div>

            {/* Filtre par Auteur */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-gold" />
                Recherche par Auteur
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ex: Kouassi, Yao, Traoré..."
                  value={authorQuery}
                  onChange={(e) => setAuthorQuery(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-xs sm:text-sm focus:ring-2 focus:ring-navy focus:outline-none placeholder:text-foreground-muted/60"
                />
                {authorQuery && (
                  <button 
                    onClick={() => setAuthorQuery("")} 
                    className="absolute right-2.5 top-2.5 text-foreground-muted hover:text-navy"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Filtre Université / Établissement Partenaire */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-gold" />
                Université / Établissement
              </label>
              <select
                value={selectedInstitution}
                onChange={(e) => setSelectedInstitution(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-xs sm:text-sm focus:ring-2 focus:ring-navy focus:outline-none cursor-pointer"
              >
                <option value="">Toutes les universités</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.code}>
                    {inst.name} ({inst.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre Année de Publication */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gold" />
                Année de Publication
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-xs sm:text-sm focus:ring-2 focus:ring-navy focus:outline-none cursor-pointer"
              >
                <option value="">Toutes les années</option>
                {PUBLICATION_YEARS.map((year) => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre Discipline Académique & Matières avec Recherche */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-gold" />
                Discipline Universitaire
              </label>
              <DisciplineCombobox
                value={selectedDiscipline}
                onChange={setSelectedDiscipline}
                includeAllOption={true}
                placeholder="Toutes les disciplines..."
                searchPlaceholder="Rechercher parmi les disciplines..."
              />
            </div>

            {/* Filtre Format */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-gold" />
                Format de Diffusion
              </label>
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-xs sm:text-sm focus:ring-2 focus:ring-navy focus:outline-none cursor-pointer"
              >
                <option value="">Tous les formats</option>
                <option value="digital">Livre numérique</option>
                <option value="paper">Livre papier</option>
              </select>
            </div>
          </aside>

          {/* Liste des Ouvrages */}
          <main className="md:col-span-8 lg:col-span-9 space-y-6">
            
            {/* Barre de compteur de résultats */}
            <div className="flex items-center justify-between text-xs text-foreground-muted border-b border-border pb-3">
              <span>
                <strong>{books.length}</strong> ouvrage{books.length > 1 ? "s" : ""} disponible{books.length > 1 ? "s" : ""}
              </span>
              {hasActiveFilters && (
                <span className="text-gold font-medium">Filtres actifs</span>
              )}
            </div>

            {/* Squelette de Chargement */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="animate-pulse bg-background-secondary rounded-2xl p-4 border border-border space-y-4">
                    <div className="h-48 bg-border/50 rounded-xl"></div>
                    <div className="h-4 bg-border/50 rounded w-3/4"></div>
                    <div className="h-3 bg-border/50 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : books.length === 0 ? (
              
              /* État Vide */
              <div className="text-center py-16 px-4 bg-background-secondary rounded-2xl border border-border space-y-4">
                <BookOpen className="w-12 h-12 text-gold mx-auto" />
                <h3 className="text-lg font-serif font-bold text-navy">Aucun ouvrage trouvé</h3>
                <p className="text-xs sm:text-sm text-foreground-muted max-w-md mx-auto">
                  Aucun document ne correspond à vos critères. Essayez de réinitialiser la recherche par auteur ou par discipline.
                </p>
                <button
                  onClick={clearFilters}
                  className="px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-navy text-xs font-bold transition-colors shadow-sm"
                >
                  Réinitialiser la recherche
                </button>
              </div>
            ) : (

              /* Grille de Cartes d'Ouvrages */
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {books.map((book) => {
                  const authorName = book.authors_details && book.authors_details.length > 0 
                    ? book.authors_details.map(a => `${a.first_name} ${a.last_name}`).join(", ")
                    : "Auteur certifié";

                  return (
                    <article
                      key={book.id}
                      className="group bg-background rounded-2xl border border-border overflow-hidden flex flex-col hover:border-gold transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                      {/* Présentation du Livre : Vraie Couverture ou Fallback 3D */}
                      <div className="p-6 bg-background-secondary flex items-center justify-center min-h-[230px] border-b border-border relative">
                        <Link href={`/catalog/${book.id}`} className="transition-transform group-hover:scale-105 duration-300 flex items-center justify-center">
                          {book.cover_url || book.cover_image ? (
                            <div className="relative w-[130px] aspect-[2/3] rounded-r-md rounded-l-sm overflow-hidden shadow-xl border-l-4 border-black/20 border-r border-t border-b border-border/60 group-hover:shadow-2xl transition-shadow duration-300">
                              <img
                                src={book.cover_url || book.cover_image}
                                alt={book.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <Book3D 
                              title={book.title}
                              author={authorName}
                              variant="lahatheque"
                              color={book.cover_color || "var(--navy)"}
                              textColor={book.cover_text_color || "var(--gold)"}
                              width={{ sm: 120, md: 130, lg: 135, xl: 130 }}
                              textured
                            />
                          )}
                        </Link>
                      </div>

                      {/* Informations Livre */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          {book.discipline_detail && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gold block">
                              {book.discipline_detail.name}
                            </span>
                          )}
                          <h3 className="font-serif font-bold text-navy text-base leading-snug line-clamp-2 group-hover:text-gold transition-colors">
                            <Link href={`/catalog/${book.id}`}>
                              {book.title}
                            </Link>
                          </h3>
                          <p className="text-xs text-foreground-muted font-medium">
                            Par <span className="text-navy font-semibold">{authorName}</span>
                          </p>
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            {book.institution_name && (
                              <span className="text-[11px] text-foreground-muted flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-gold shrink-0" />
                                {book.institution_name}
                              </span>
                            )}
                            {book.publication_year && (
                              <span className="text-[10px] font-semibold text-navy bg-navy/5 px-2 py-0.5 rounded border border-border">
                                {book.publication_year}
                              </span>
                            )}
                            <span className="text-[10px] font-medium text-foreground-muted bg-background-secondary px-2 py-0.5 rounded border border-border">
                              {book.is_paper_available !== false && book.is_digital_available !== false
                                ? "Papier & Numérique"
                                : book.is_paper_available !== false
                                ? "Livre Papier"
                                : "Livre Numérique"}
                            </span>
                          </div>
                        </div>

                        {/* Prix & Action Achat à l'unité */}
                        <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                          <div>
                            <span className="text-xs sm:text-sm font-bold font-mono text-navy block">
                              {(book.price || 2500).toLocaleString("fr-FR")} FCFA
                            </span>
                            <span className="text-[10px] text-foreground-muted font-medium">
                              Achat à l'unité
                            </span>
                          </div>
                          <Link
                            href={`/catalog/${book.id}`}
                            className="px-3.5 py-2 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs shrink-0"
                          >
                            <span>Acheter / Détails</span>
                            <ArrowRight className="w-3.5 h-3.5 text-gold" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </main>
        </div>

      </div>
    </div>
  );
}

export default function CatalogSearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <Sparkles className="w-8 h-8 text-gold animate-spin mx-auto" />
          <p className="text-xs text-foreground-muted font-sans">Chargement du catalogue...</p>
        </div>
      </div>
    }>
      <CatalogSearchInner />
    </Suspense>
  );
}
