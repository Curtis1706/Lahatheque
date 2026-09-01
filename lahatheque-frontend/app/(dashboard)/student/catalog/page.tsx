"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  BookOpen,
  ArrowLeft,
  Filter,
  ShoppingBag,
  Eye,
  Globe,
  CheckCircle2,
  Truck,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  getStudentCatalog,
  type BookAPI,
  type CatalogDataAPI,
} from "@/lib/services/student";
import { BookSampleModal } from "@/components/features/student/book-sample-modal";
import { UnifiedBookOrderModal } from "@/components/features/student/unified-book-order-modal";
import { BookCover } from "@/components/features/student/book-cover";
import { Pagination } from "@/components/ui/pagination";
import { ViewToggle, type ViewMode } from "@/components/features/student/view-toggle";

// ─── Skeletons ────────────────────────────────────────────────────────────────

function SkeletonBookCard() {
  return (
    <div className="p-5 sm:p-6 rounded-3xl border border-border bg-background animate-pulse flex flex-col justify-between h-[290px] space-y-4">
      <div className="flex items-start gap-4">
        <div className="w-16 h-24 rounded-xl bg-navy/10 shrink-0" />
        <div className="flex-1 space-y-2.5 min-w-0">
          <div className="h-3 rounded bg-navy/10 w-1/3" />
          <div className="h-5 rounded bg-navy/10 w-4/5" />
          <div className="h-3 rounded bg-navy/10 w-1/2" />
        </div>
      </div>
      <div className="space-y-3 pt-3 border-t border-border/50">
        <div className="h-4 rounded bg-navy/10 w-1/4" />
        <div className="h-11 rounded-xl bg-navy/10 w-full" />
      </div>
    </div>
  );
}

function SkeletonBookList() {
  return (
    <div className="p-4 sm:p-5 rounded-3xl border border-border bg-background animate-pulse flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-16 h-20 rounded-xl bg-navy/10 shrink-0" />
        <div className="space-y-2 flex-1 min-w-0">
          <div className="h-3 rounded bg-navy/10 w-1/4" />
          <div className="h-5 rounded bg-navy/10 w-3/5" />
          <div className="h-3 rounded bg-navy/10 w-1/3" />
        </div>
      </div>
      <div className="h-10 rounded-xl bg-navy/10 w-full md:w-64 shrink-0" />
    </div>
  );
}

// ─── Carte Livre Grille (Vue Grille) ──────────────────────────────────────────

function CatalogBookCard({
  book,
  onOpenSample,
  onOpenOrderModal,
}: {
  book: BookAPI;
  onOpenSample: (book: BookAPI) => void;
  onOpenOrderModal: (book: BookAPI) => void;
}) {
  const authorName =
    book.authors?.map((a) => a.full_name).join(", ") || "Auteur académique";

  return (
    <div className="group p-5 sm:p-6 rounded-3xl border border-border bg-background hover:border-gold/60 transition-all duration-200 shadow-xs flex flex-col justify-between gap-5 overflow-hidden w-full min-w-0">
      {/* Haut : Couverture & Informations */}
      <div className="space-y-3.5 min-w-0">
        <div className="flex items-start gap-4 min-w-0">
          <Link
            href={`/student/catalog/${book.id}`}
            className="shrink-0 group-hover:scale-[1.02] transition-transform"
            title={`Consulter « ${book.title} »`}
          >
            <BookCover book={book} size="sm" />
          </Link>

          <div className="min-w-0 flex-1 space-y-1.5">
            <span className="inline-block text-[10px] font-bold text-gold uppercase tracking-wider bg-gold/10 px-2 py-0.5 rounded-md border border-gold/25 truncate max-w-full">
              {book.discipline_name || "Académique"}
            </span>

            <Link href={`/student/catalog/${book.id}`} className="block">
              <h3 className="font-serif font-bold text-navy text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-gold transition-colors">
                {book.title}
              </h3>
            </Link>

            <p className="text-xs text-foreground-muted truncate">
              Par {authorName}
            </p>

            {book.publisher_name && (
              <p className="text-[11px] text-foreground-muted/80 truncate font-medium">
                Éditions {book.publisher_name}
              </p>
            )}
          </div>
        </div>

        {book.summary && (
          <p className="text-xs text-foreground-muted line-clamp-2 leading-relaxed pt-1">
            {book.summary}
          </p>
        )}
      </div>

      {/* Bas : Prix, Disponibilité & Actions */}
      <div className="space-y-3.5 pt-3.5 border-t border-border min-w-0">
        {/* Prix & Statut */}
        <div className="flex items-center justify-between gap-2 flex-wrap min-h-[26px]">
          {book.is_owned || book.has_digital_access ? (
            <span className="text-[10px] font-bold text-success bg-success/10 border border-success/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
              <span>Déjà acquis</span>
            </span>
          ) : book.price_digital > 0 ? (
            <div className="flex items-baseline gap-1.5">
              <span className="text-[9px] uppercase font-bold text-foreground-muted tracking-wider">
                Numérique
              </span>
              <span className="font-mono font-bold text-gold text-xs sm:text-sm">
                {book.price_digital.toLocaleString("fr-FR")} XOF
              </span>
            </div>
          ) : (
            <span className="text-xs font-bold text-success">Accès libre</span>
          )}

          {book.is_paper_available && book.price_paper > 0 && (
            <span className="text-[10px] font-medium text-navy bg-navy/5 border border-navy/10 px-2.5 py-0.5 rounded-full">
              Disponible en papier
            </span>
          )}
        </div>

        {/* Barre d'actions aérée et adaptée à tous les écrans */}
        <div className="flex items-center gap-2 w-full min-w-0">
          {book.is_owned || book.has_digital_access ? (
            <>
              <Link
                href={`/catalog/reader/${book.id}`}
                className="flex-1 px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center justify-center gap-2 min-h-[44px] shadow-xs truncate cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-gold shrink-0" />
                <span>Lire</span>
              </Link>
              {book.is_paper_available && (
                <button
                  type="button"
                  onClick={() => onOpenOrderModal(book)}
                  className="px-3.5 py-2.5 rounded-xl border border-border bg-background hover:border-gold text-navy text-xs font-bold transition-colors flex items-center justify-center gap-1.5 min-h-[44px] shadow-2xs cursor-pointer shrink-0"
                  title="Commander la version papier"
                >
                  <Truck className="w-3.5 h-3.5 text-navy shrink-0" />
                  <span>Papier</span>
                </button>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onOpenSample(book)}
                className="flex-1 px-3 py-2.5 rounded-xl border border-gold/40 bg-gold/10 hover:bg-gold/20 text-gold text-xs font-bold transition-colors flex items-center justify-center gap-1.5 min-h-[44px] shadow-2xs cursor-pointer truncate"
                title="Lire un extrait gratuit"
              >
                <Eye className="w-4 h-4 text-gold shrink-0" />
                <span className="truncate">Extrait</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenOrderModal(book)}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center justify-center gap-1.5 min-h-[44px] shadow-xs cursor-pointer truncate"
              >
                <ShoppingBag className="w-4 h-4 text-gold shrink-0" />
                <span className="truncate">Commander</span>
              </button>
            </>
          )}

          <Link
            href={`/student/catalog/${book.id}`}
            className="px-3.5 py-2.5 rounded-xl bg-background-secondary border border-border hover:border-gold text-navy text-xs font-semibold flex items-center justify-center min-h-[44px] transition-colors shrink-0"
            title="Consulter la fiche détaillée"
          >
            Détail
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Ligne / Carte Tableau (Vue Liste / Data Table) ───────────────────────────

function CatalogBookListItem({
  book,
  onOpenSample,
  onOpenOrderModal,
}: {
  book: BookAPI;
  onOpenSample: (book: BookAPI) => void;
  onOpenOrderModal: (book: BookAPI) => void;
}) {
  const authorName =
    book.authors?.map((a) => a.full_name).join(", ") || "Auteur académique";

  return (
    <div className="group p-4 sm:p-5 rounded-3xl border border-border bg-background hover:border-gold/60 transition-all duration-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 w-full min-w-0 overflow-hidden">
      {/* Couverture & Informations */}
      <div className="flex items-center gap-4 min-w-0 flex-1 w-full md:w-auto">
        <Link
          href={`/student/catalog/${book.id}`}
          className="shrink-0 group-hover:scale-[1.02] transition-transform"
          title={`Consulter « ${book.title} »`}
        >
          <BookCover book={book} size="sm" />
        </Link>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-gold uppercase tracking-wider bg-gold/10 px-2 py-0.5 rounded-md border border-gold/25 truncate">
              {book.discipline_name || "Académique"}
            </span>
            {book.publisher_name && (
              <span className="text-[10px] text-foreground-muted truncate">
                Éditions {book.publisher_name}
              </span>
            )}
          </div>

          <Link href={`/student/catalog/${book.id}`} className="block">
            <h3 className="font-serif font-bold text-navy text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-gold transition-colors">
              {book.title}
            </h3>
          </Link>

          <p className="text-xs text-foreground-muted truncate">
            Par <span className="text-navy font-semibold">{authorName}</span>
          </p>
        </div>
      </div>

      {/* Prix & Statut */}
      <div className="shrink-0 flex items-center gap-2 self-start md:self-center">
        {book.is_owned || book.has_digital_access ? (
          <span className="text-[10px] font-bold text-success bg-success/10 border border-success/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
            <span>Déjà acquis</span>
          </span>
        ) : book.price_digital > 0 ? (
          <div className="text-left md:text-right">
            <span className="block text-[9px] uppercase font-bold text-foreground-muted tracking-wider">
              Numérique
            </span>
            <span className="font-mono font-bold text-gold text-sm sm:text-base">
              {book.price_digital.toLocaleString("fr-FR")} XOF
            </span>
          </div>
        ) : (
          <span className="text-xs font-bold text-success">Accès libre</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 self-stretch md:self-center shrink-0 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-border">
        {book.is_owned || book.has_digital_access ? (
          <>
            <Link
              href={`/catalog/reader/${book.id}`}
              className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center justify-center gap-1.5 min-h-[44px] shadow-xs cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-gold shrink-0" />
              <span>Lire</span>
            </Link>
            {book.is_paper_available && (
              <button
                type="button"
                onClick={() => onOpenOrderModal(book)}
                className="px-3.5 py-2.5 rounded-xl border border-border bg-background hover:border-gold text-navy text-xs font-bold transition-colors flex items-center justify-center gap-1.5 min-h-[44px] shadow-2xs cursor-pointer shrink-0"
                title="Commander la version papier"
              >
                <Truck className="w-3.5 h-3.5 text-navy shrink-0" />
                <span>Papier</span>
              </button>
            )}
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onOpenSample(book)}
              className="px-3.5 py-2.5 rounded-xl border border-gold/40 bg-gold/10 hover:bg-gold/20 text-gold text-xs font-bold transition-colors flex items-center justify-center gap-1.5 min-h-[44px] shadow-2xs cursor-pointer"
              title="Lire un extrait gratuit"
            >
              <Eye className="w-4 h-4 text-gold shrink-0" />
              <span>Extrait</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenOrderModal(book)}
              className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center justify-center gap-1.5 min-h-[44px] shadow-xs cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-gold shrink-0" />
              <span>Commander</span>
            </button>
          </>
        )}

        <Link
          href={`/student/catalog/${book.id}`}
          className="px-3.5 py-2.5 rounded-xl bg-background-secondary border border-border hover:border-gold text-navy text-xs font-semibold flex items-center justify-center min-h-[44px] transition-colors shrink-0"
          title="Consulter la fiche détaillée"
        >
          Détail
        </Link>
      </div>
    </div>
  );
}

// ─── Page Principale ──────────────────────────────────────────────────────────

export default function StudentCatalogPage() {
  const [catalogData, setCatalogData] = useState<CatalogDataAPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDiscipline, setSelectedDiscipline] = useState("all");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  const [sampleModalBook, setSampleModalBook] = useState<BookAPI | null>(null);
  const [orderModalBook, setOrderModalBook] = useState<BookAPI | null>(null);

  // Debounce la recherche
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(searchQuery);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStudentCatalog(
        debouncedQ || undefined,
        selectedDiscipline !== "all" ? selectedDiscipline : undefined
      );
      setCatalogData(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Erreur de chargement du catalogue"
      );
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, selectedDiscipline]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const router = useRouter();

  const handleOpenSample = (book: BookAPI) => {
    toast.info(`Ouverture de l'extrait pour « ${book.title} »`);
    router.push(`/catalog/reader/${book.id}?mode=sample`);
  };

  const allBooks = catalogData?.books || [];
  const disciplines = catalogData?.disciplines || [];

  // Pagination calculée
  const totalBooks = allBooks.length;
  const totalPages = Math.ceil(totalBooks / pageSize) || 1;

  const paginatedBooks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return allBooks.slice(start, start + pageSize);
  }, [allBooks, currentPage, pageSize]);

  const handleDisciplineSelect = (disciplineId: string, disciplineName: string) => {
    setSelectedDiscipline(disciplineId);
    setCurrentPage(1);
    toast.info(disciplineId === "all" ? "Toutes les disciplines" : `Discipline : ${disciplineName}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    toast.info(mode === "grid" ? "Mode Grille activé" : "Mode Tableau / Liste activé");
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedDiscipline("all");
    setCurrentPage(1);
    toast.info("Filtres réinitialisés");
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto min-w-0 pr-14 sm:pr-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/student" className="hover:text-navy transition-colors">
          Mon Espace
        </Link>
        <span>/</span>
        <span className="text-navy font-semibold">Catalogue Académique</span>
      </div>

      {/* Header avec Sélecteur Grille / Liste */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/student"
            className="inline-flex items-center gap-1.5 text-xs text-navy font-bold hover:underline mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour à l&apos;espace étudiant</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
            <Globe className="w-4 h-4 text-gold" />
            <span>Catalogue Universitaire &amp; Scientifique</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-navy">
            Explorer le Catalogue
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-1.5 max-w-2xl leading-relaxed">
            Consultez les extraits sans restriction, achetez vos ouvrages à l&apos;unité ou accédez aux collections complètes grâce à vos bouquets universitaires.
          </p>
        </div>

        {/* Contrôles Header : Sélecteur Grille / Tableau */}
        <div className="shrink-0 flex items-center gap-3">
          <ViewToggle mode={viewMode} onChange={handleViewModeChange} />
        </div>
      </div>

      {/* ── Erreur ────────────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-2xl border border-error/30 bg-error/10 text-error text-xs sm:text-sm font-medium">
          {error}
        </div>
      )}

      {/* ── Barre de Recherche & Filtres Disciplines ───────────────────── */}
      <div className="p-5 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
        {/* Recherche */}
        <div className="relative">
          <Search className="w-4 h-4 text-foreground-muted absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un ouvrage, auteur, matière, ISBN..."
            className="w-full pl-11 pr-4 py-3 text-xs sm:text-sm bg-background-secondary border border-border rounded-2xl text-navy placeholder:text-foreground-muted focus:outline-none focus:border-gold min-h-[48px] transition-colors"
          />
        </div>

        {/* Disciplines : Barre défilante ergonomique */}
        <div className="pt-2 border-t border-border flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1.5 shrink-0 pr-1">
            <Filter className="w-3.5 h-3.5 text-foreground-muted" />
            <span className="text-[10px] font-bold uppercase text-foreground-muted tracking-wider">
              Discipline :
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 w-full flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => handleDisciplineSelect("all", "Toutes")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors border shrink-0 min-h-[40px] cursor-pointer ${
                selectedDiscipline === "all"
                  ? "bg-navy text-white border-navy shadow-xs"
                  : "bg-background-secondary text-foreground-muted border-border hover:text-navy hover:bg-background"
              }`}
            >
              Toutes
            </button>

            {disciplines.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => handleDisciplineSelect(d.id, d.name)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors border shrink-0 min-h-[40px] cursor-pointer ${
                  selectedDiscipline === d.id
                    ? "bg-navy text-white border-navy shadow-xs"
                    : "bg-background-secondary text-foreground-muted border-border hover:text-navy hover:bg-background"
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Résultats du Catalogue (Grille ou Liste) ─────────────────── */}
      <div className="space-y-6">
        {!loading && catalogData && (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs text-foreground-muted">
              <strong className="text-navy font-bold">{totalBooks}</strong> ouvrage{totalBooks > 1 ? "s" : ""} disponible{totalBooks > 1 ? "s" : ""}
              {debouncedQ && (
                <span>
                  {" "}pour « <strong className="text-navy">{debouncedQ}</strong> »
                </span>
              )}
            </p>

            {totalPages > 1 && (
              <span className="text-xs text-foreground-muted font-medium">
                Page <strong className="text-navy">{currentPage}</strong> sur <strong className="text-navy">{totalPages}</strong>
              </span>
            )}
          </div>
        )}

        {loading ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonBookCard key={i} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonBookList key={i} />
              ))}
            </div>
          )
        ) : allBooks.length === 0 ? (
          <div className="py-20 px-6 rounded-3xl bg-background border border-dashed border-border text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-navy/5 flex items-center justify-center mx-auto text-foreground-muted">
              <BookOpen className="w-7 h-7 opacity-60" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="font-serif font-bold text-navy text-lg">
                Aucun ouvrage trouvé
              </h3>
              <p className="text-xs text-foreground-muted leading-relaxed">
                Aucun document ne correspond à vos critères de recherche dans cette discipline.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors min-h-[44px] shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-gold" />
              <span>Réinitialiser les filtres</span>
            </button>
          </div>
        ) : (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {paginatedBooks.map((book) => (
                  <CatalogBookCard
                    key={book.id}
                    book={book}
                    onOpenSample={handleOpenSample}
                    onOpenOrderModal={(b) => setOrderModalBook(b)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedBooks.map((book) => (
                  <CatalogBookListItem
                    key={book.id}
                    book={book}
                    onOpenSample={handleOpenSample}
                    onOpenOrderModal={(b) => setOrderModalBook(b)}
                  />
                ))}
              </div>
            )}

            {/* Pagination Component */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalBooks}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={(s) => {
                setPageSize(s);
                setCurrentPage(1);
              }}
              pageSizeOptions={[6, 9, 12, 24]}
              itemLabel="ouvrages"
            />
          </>
        )}
      </div>

      {/* Modales Interactives */}
      <BookSampleModal
        book={
          sampleModalBook
            ? {
                ...sampleModalBook,
                author: sampleModalBook.authors?.map((a) => a.full_name).join(", "),
              }
            : null
        }
        isOpen={Boolean(sampleModalBook)}
        onClose={() => setSampleModalBook(null)}
      />

      {orderModalBook && (
        <UnifiedBookOrderModal
          book={orderModalBook}
          onClose={() => setOrderModalBook(null)}
          onOpenSample={() => {
            const targetBook = orderModalBook;
            setOrderModalBook(null);
            setSampleModalBook(targetBook);
          }}
        />
      )}
    </div>
  );
}
