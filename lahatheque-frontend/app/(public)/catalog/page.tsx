"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
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
  Calendar,
  Headphones,
  Laptop,
  ArrowUpDown,
  RotateCcw,
  Languages,
} from "lucide-react";
import { Book } from "@/lib/types/catalog";
import { searchCatalogBooks, getInstitutions, type InstitutionOption } from "@/lib/services/catalog";
import { ActionSearchBar } from "@/components/ui/action-search-bar";
import { Book as Book3D } from "@/components/ui/book";
import { DisciplineCombobox } from "@/components/features/catalog/discipline-combobox";
import { useDisciplines } from "@/lib/hooks/use-disciplines";
import { SampleChoiceModal } from "@/components/features/catalog/sample-choice-modal";
import { AuthorsDisplay } from "@/components/features/catalog/authors-display";
import { Pagination } from "@/components/ui/pagination";
import { CATALOG_LANGUAGE_OPTIONS } from "@/lib/constants/catalog-languages";

// Liste dynamique des années de publication : de l'année en cours jusqu'à 1950
const CURRENT_YEAR = new Date().getFullYear();
const PUBLICATION_YEARS = Array.from(
  { length: CURRENT_YEAR - 1950 + 1 },
  (_, i) => CURRENT_YEAR - i
);

function CatalogSearchInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") || "";
  const urlLanguage = searchParams.get("language") || "";
  const urlPage = parseInt(searchParams.get("page") || "1", 10);
  const urlPageSize = parseInt(searchParams.get("page_size") || "20", 10);
  const urlOrdering = searchParams.get("ordering") || "-created_at";

  const { disciplineNames } = useDisciplines();
  const [books, setBooks] = useState<Book[]>([]);
  const [institutions, setInstitutions] = useState<InstitutionOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [authorQuery, setAuthorQuery] = useState("");
  const [selectedDiscipline, setSelectedDiscipline] = useState("");
  const [selectedInstitution, setSelectedInstitution] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState(urlLanguage);
  const [selectedFormat, setSelectedFormat] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [ordering, setOrdering] = useState(urlOrdering);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedSampleBook, setSelectedSampleBook] = useState<Book | null>(null);

  // Pagination dynamique réelle
  const [currentPage, setCurrentPage] = useState<number>(Number.isNaN(urlPage) || urlPage < 1 ? 1 : urlPage);
  const [pageSize, setPageSize] = useState<number>(Number.isNaN(urlPageSize) || urlPageSize < 1 ? 20 : urlPageSize);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  const resultsTopRef = useRef<HTMLDivElement>(null);

  // Chargement dynamique des universités de la base de données
  useEffect(() => {
    getInstitutions().then((data: InstitutionOption[]) => {
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

  // Réinitialiser à la page 1 lorsque les filtres changent
  const handleFilterChange = (setter: (val: any) => void, val: any) => {
    setter(val);
    setCurrentPage(1);
  };

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const data = await searchCatalogBooks({
          q: searchQuery || undefined,
          author: authorQuery || undefined,
          discipline: selectedDiscipline || undefined,
          institution: selectedInstitution || undefined,
          language: selectedLanguage || undefined,
          format: selectedFormat || undefined,
          year: selectedYear || undefined,
          ordering: ordering || undefined,
          page: currentPage,
          page_size: pageSize,
        });
        setBooks(data.results);
        setTotalCount(data.count);
        setTotalPages(data.total_pages);
      } catch (err) {
        console.error("Erreur lors du chargement du catalogue:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [
    searchQuery, 
    authorQuery, 
    selectedDiscipline, 
    selectedInstitution, 
    selectedLanguage, 
    selectedFormat, 
    selectedYear,
    ordering,
    currentPage,
    pageSize
  ]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (resultsTopRef.current) {
      resultsTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 280, behavior: "smooth" });
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setAuthorQuery("");
    setSelectedDiscipline("");
    setSelectedInstitution("");
    setSelectedLanguage("");
    setSelectedFormat("");
    setSelectedYear("");
    setOrdering("-created_at");
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    searchQuery || authorQuery || selectedDiscipline || selectedInstitution || selectedLanguage || selectedFormat || selectedYear || ordering !== "-created_at"
  );

  const startItem = totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(currentPage * pageSize, totalCount);

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
              onSearch={(val) => handleFilterChange(setSearchQuery, val)}
              onSelectAction={(category, value) => {
                if (category === "discipline") {
                  handleFilterChange(setSelectedDiscipline, value);
                } else if (category === "institution") {
                  handleFilterChange(setSelectedInstitution, value);
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
                  onChange={(e) => handleFilterChange(setAuthorQuery, e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-xs sm:text-sm focus:ring-2 focus:ring-navy focus:outline-none placeholder:text-foreground-muted/60"
                />
                {authorQuery && (
                  <button 
                    onClick={() => handleFilterChange(setAuthorQuery, "")} 
                    className="absolute right-2.5 top-2.5 text-foreground-muted hover:text-navy cursor-pointer"
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
                onChange={(e) => handleFilterChange(setSelectedInstitution, e.target.value)}
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
                onChange={(e) => handleFilterChange(setSelectedYear, e.target.value)}
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
                onChange={(val) => handleFilterChange(setSelectedDiscipline, val)}
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
                onChange={(e) => handleFilterChange(setSelectedFormat, e.target.value)}
                className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-xs sm:text-sm focus:ring-2 focus:ring-navy focus:outline-none cursor-pointer"
              >
                <option value="">Tous les formats</option>
                <option value="digital">Livre numérique</option>
                <option value="paper">Livre papier</option>
                <option value="audio">Livre audio</option>
              </select>
            </div>

            {/* Filtre Langue */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-gold" />
                Langue de Publication
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => handleFilterChange(setSelectedLanguage, e.target.value === "all" ? "" : e.target.value)}
                className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-xs sm:text-sm focus:ring-2 focus:ring-navy focus:outline-none cursor-pointer"
              >
                {CATALOG_LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value === "all" ? "" : opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </aside>

          {/* Liste des Ouvrages */}
          <main className="md:col-span-8 lg:col-span-9 space-y-6">
            
            {/* Barre de compteur de résultats et options de tri (Norme e-commerce & bibliothèques) */}
            <div 
              ref={resultsTopRef}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-b border-border pb-4"
            >
              <div className="space-y-0.5">
                <p className="text-foreground font-medium">
                  {totalCount > 0 ? (
                    <>
                      Affichage de <strong className="text-navy">{startItem}</strong> à{" "}
                      <strong className="text-navy">{endItem}</strong> sur{" "}
                      <strong className="text-navy">{totalCount}</strong> ouvrage{totalCount > 1 ? "s" : ""} disponible{totalCount > 1 ? "s" : ""}
                    </>
                  ) : (
                    <span className="text-foreground-muted">0 ouvrage disponible</span>
                  )}
                </p>
                {hasActiveFilters && (
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="text-[11px] font-semibold text-gold bg-gold/10 px-2 py-0.5 rounded-full border border-gold/30">
                      Filtres actifs
                    </span>
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-[11px] text-foreground-muted hover:text-navy underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3 text-gold" />
                      Tout effacer
                    </button>
                  </div>
                )}
              </div>

              {/* Contrôles de Tri et Éléments par Page */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Sélecteur de tri */}
                <div className="flex items-center gap-1.5 bg-background-secondary border border-border rounded-xl px-2.5 py-1.5 shadow-2xs">
                  <ArrowUpDown className="w-3.5 h-3.5 text-gold shrink-0" />
                  <label htmlFor="catalog-sort" className="text-[11px] font-medium text-foreground-muted shrink-0 hidden sm:inline">
                    Trier par :
                  </label>
                  <select
                    id="catalog-sort"
                    value={ordering}
                    onChange={(e) => handleFilterChange(setOrdering, e.target.value)}
                    className="bg-transparent text-navy text-xs font-semibold focus:outline-none cursor-pointer pr-1"
                  >
                    <option value="-created_at">Plus récents</option>
                    <option value="created_at">Plus anciens</option>
                    <option value="title_asc">Titre (A → Z)</option>
                    <option value="title_desc">Titre (Z → A)</option>
                    <option value="price_asc">Prix croissant</option>
                    <option value="price_desc">Prix décroissant</option>
                    <option value="-publication_date">Année de parution</option>
                  </select>
                </div>

                {/* Sélecteur de nombre d'éléments par page */}
                <div className="flex items-center gap-1.5 bg-background-secondary border border-border rounded-xl px-2.5 py-1.5 shadow-2xs">
                  <span className="text-[11px] font-medium text-foreground-muted shrink-0">
                    Par page :
                  </span>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="bg-transparent text-navy text-xs font-semibold focus:outline-none cursor-pointer pr-1 font-mono"
                  >
                    <option value={12}>12</option>
                    <option value={20}>20</option>
                    <option value={36}>36</option>
                    <option value={48}>48</option>
                  </select>
                </div>
              </div>
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
              <>
                {/* Grille de Cartes d'Ouvrages */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {books.map((book) => {
                  const authorName = book.authors_details && book.authors_details.length > 0 
                    ? book.authors_details.map(a => `${a.first_name} ${a.last_name}`).join(", ")
                    : "Auteur certifié";

                  const bookSlug = book.slug || book.id;
                  const hasAudio = Boolean(
                    book.has_audio_version || 
                    book.has_audio || 
                    book.format_type === "audio" || 
                    (book.price_audio && book.price_audio > 0) ||
                    book.audio_status === "published"
                  );
                  const hasPaper = book.is_paper_available !== false;
                  const hasDigital = book.is_digital_available !== false && book.format_type !== "audio";

                  let formatBadgeLabel = "Livre Numérique";
                  let formatBadgeClass = "text-foreground-muted bg-background-secondary border-border";

                  if (hasPaper && hasDigital && hasAudio) {
                    formatBadgeLabel = "Papier • Numérique • Audio";
                    formatBadgeClass = "text-gold bg-gold/10 border-gold/40 font-bold";
                  } else if (hasDigital && hasAudio && !hasPaper) {
                    formatBadgeLabel = "Numérique • Audio";
                    formatBadgeClass = "text-navy bg-navy/10 border-navy/30 font-bold";
                  } else if (hasPaper && hasAudio && !hasDigital) {
                    formatBadgeLabel = "Papier • Audio";
                    formatBadgeClass = "text-navy bg-navy/10 border-navy/30 font-bold";
                  } else if (hasAudio && !hasPaper && !hasDigital) {
                    formatBadgeLabel = "Audio Seul";
                    formatBadgeClass = "text-gold bg-gold/15 border-gold font-bold";
                  } else if (hasPaper && hasDigital && !hasAudio) {
                    formatBadgeLabel = "Papier & Numérique";
                    formatBadgeClass = "text-foreground-muted bg-background-secondary border-border";
                  } else if (hasPaper && !hasDigital && !hasAudio) {
                    formatBadgeLabel = "Livre Papier";
                    formatBadgeClass = "text-foreground-muted bg-background-secondary border-border";
                  }

                  return (
                    <article
                      key={book.id}
                      className="group bg-background rounded-2xl border border-border overflow-hidden flex flex-col hover:border-gold transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                      {/* Présentation du Livre : Vraie Couverture ou Fallback 3D */}
                      <div className="p-6 bg-background-secondary flex items-center justify-center min-h-[230px] border-b border-border relative">
                        {hasAudio && (
                          <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-navy/90 text-gold text-[10px] font-bold flex items-center gap-1 shadow-md border border-gold/30 z-10">
                            <Headphones className="w-3 h-3 text-gold" />
                            <span>Audio</span>
                          </div>
                        )}

                        <Link href={`/catalog/${bookSlug}`} className="transition-transform group-hover:scale-105 duration-300 flex items-center justify-center">
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
                            <Link href={`/catalog/${bookSlug}`}>
                              {book.title}
                            </Link>
                          </h3>
                          <div className="text-xs text-foreground-muted font-medium flex items-center flex-wrap gap-1">
                            <span>Par</span>
                            <AuthorsDisplay
                              authors={book.authors_details && book.authors_details.length > 0 ? book.authors_details : ((book as any).authors || (book as any).author_name || authorName)}
                              fallbackName={authorName}
                              bookTitle={book.title}
                              maxVisible={2}
                              className="text-navy font-semibold"
                            />
                          </div>
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
                            <span className={`text-[10px] px-2 py-0.5 rounded border flex items-center gap-1 ${formatBadgeClass}`}>
                              {hasAudio && <Headphones className="w-3 h-3 text-gold shrink-0" />}
                              <span>{formatBadgeLabel}</span>
                            </span>
                          </div>
                        </div>

                        {/* Prix & Actions (Extrait + Achat) */}
                        <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                          <div>
                            <span className="text-xs sm:text-sm font-bold font-mono text-navy block">
                              {(book.price || 2500).toLocaleString("fr-FR")} FCFA
                            </span>
                            <span className="text-[10px] text-foreground-muted font-medium">
                              {hasAudio && !hasDigital ? "Format audio" : "Achat à l'unité"}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Bouton Extrait intelligent : modale de choix si les 2 formats existent, sinon action directe */}
                            {hasAudio && hasDigital ? (
                              <button
                                type="button"
                                onClick={() => setSelectedSampleBook(book)}
                                className="px-2.5 py-2 rounded-xl border border-gold/40 bg-gold/10 hover:bg-gold/20 text-navy text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                                title="Choisir le format d'extrait (Lire ou Écouter)"
                              >
                                <Headphones className="w-3.5 h-3.5 text-gold shrink-0" />
                                <span>Extrait</span>
                              </button>
                            ) : hasAudio ? (
                              <Link
                                href={`/preview/${bookSlug}`}
                                className="px-2.5 py-2 rounded-xl border border-gold/40 bg-gold/10 hover:bg-gold/20 text-navy text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                                title="Écouter l'extrait audio gratuit"
                              >
                                <Headphones className="w-3.5 h-3.5 text-gold shrink-0" />
                                <span>Extrait audio</span>
                              </Link>
                            ) : (
                              <Link
                                href={`/catalog/reader/${book.id}?mode=sample`}
                                className="px-2.5 py-2 rounded-xl border border-border bg-background-secondary hover:bg-navy/5 text-navy text-xs font-semibold transition-colors cursor-pointer"
                                title="Feuilleter l'extrait"
                              >
                                Extrait
                              </Link>
                            )}

                            <Link
                              href={`/catalog/${bookSlug}`}
                              className="px-3 py-2 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold transition-all flex items-center gap-1 shadow-xs shrink-0"
                            >
                              <span>Détails</span>
                              <ArrowRight className="w-3.5 h-3.5 text-gold" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

                {/* Pagination Standard du Marché (Norme e-commerce & bibliothèque académique) */}
                <div className="pt-2">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalCount}
                    pageSize={pageSize}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    pageSizeOptions={[12, 20, 36, 48]}
                    itemLabel="ouvrages disponibles"
                  />
                </div>
              </>
            )}
          </main>
        </div>

        {/* Modale de Choix d'Extrait (Liseuse 3D ou Écoute Audio) */}
        {selectedSampleBook && (
          <SampleChoiceModal
            isOpen={Boolean(selectedSampleBook)}
            onClose={() => setSelectedSampleBook(null)}
            book={selectedSampleBook as any}
          />
        )}

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
