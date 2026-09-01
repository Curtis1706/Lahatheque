"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  ArrowLeft,
  Search,
  Bookmark,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  getStudentBooks,
  toggleStudentFavorite,
  type BookAPI,
} from "@/lib/services/student";
import { BookCard } from "@/components/features/student/book-card";
import { BookListItem } from "@/components/features/student/book-list-item";
import { ViewToggle, type ViewMode } from "@/components/features/student/view-toggle";
import { Pagination } from "@/components/ui/pagination";

// ─── Skeletons ────────────────────────────────────────────────────────────────

function SkeletonBookCard() {
  return (
    <div className="p-5 rounded-3xl border border-border bg-background animate-pulse space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-24 rounded-xl bg-navy/10 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 rounded bg-navy/10 w-1/4" />
          <div className="h-4 rounded bg-navy/10 w-3/4" />
          <div className="h-3 rounded bg-navy/10 w-1/2" />
        </div>
      </div>
      <div className="h-2 rounded-full bg-navy/10 w-full" />
    </div>
  );
}

function SkeletonBookList() {
  return (
    <div className="p-4 sm:p-5 rounded-3xl border border-border bg-background animate-pulse flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-14 h-20 rounded-xl bg-navy/10 shrink-0" />
        <div className="space-y-2 flex-1 min-w-0">
          <div className="h-3 rounded bg-navy/10 w-1/4" />
          <div className="h-4 rounded bg-navy/10 w-3/5" />
          <div className="h-3 rounded bg-navy/10 w-1/3" />
        </div>
      </div>
      <div className="h-10 rounded-xl bg-navy/10 w-32 shrink-0 hidden sm:block" />
    </div>
  );
}

// ─── Page Principale ──────────────────────────────────────────────────────────

export default function StudentBooksPage() {
  const [books, setBooks] = useState<BookAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  const loadBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStudentBooks();
      setBooks(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de chargement de la bibliothèque");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const handleToggleFavorite = async (id: string) => {
    try {
      const newFav = await toggleStudentFavorite(id);
      setBooks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, is_favorite: newFav } : b))
      );
    } catch {
      toast.error("Échec de la mise à jour des favoris");
    }
  };

  // Filtrage combiné : recherche textuelle et filtre favoris
  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      if (onlyFavorites && !b.is_favorite) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        b.title.toLowerCase().includes(q) ||
        b.authors?.some(
          (a) =>
            a.first_name.toLowerCase().includes(q) ||
            a.last_name.toLowerCase().includes(q) ||
            a.full_name.toLowerCase().includes(q)
        ) ||
        b.discipline_name?.toLowerCase().includes(q)
      );
    });
  }, [books, onlyFavorites, searchQuery]);

  const favoriteCount = useMemo(() => books.filter((b) => b.is_favorite).length, [books]);

  // Pagination calculée sur les livres filtrés
  const totalBooks = filteredBooks.length;
  const totalPages = Math.ceil(totalBooks / pageSize) || 1;

  const paginatedBooks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBooks.slice(start, start + pageSize);
  }, [filteredBooks, currentPage, pageSize]);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    toast.info(mode === "grid" ? "Mode Grille activé" : "Mode Liste / Tableau activé");
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setOnlyFavorites(false);
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
        <span className="text-navy font-semibold">Ma Bibliothèque</span>
      </div>

      {/* Header */}
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
            <BookOpen className="w-4 h-4 text-gold" />
            <span>Fonds Personnel de Lecture</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-navy">
            Ma Bibliothèque
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-1.5 max-w-2xl leading-relaxed">
            Consultez tous vos ouvrages débloqués, reprenez vos lectures en cours et gérez votre sélection de favoris.
          </p>
        </div>

        {/* Contrôles Header : Sélecteur Grille/Liste */}
        <div className="shrink-0 flex items-center gap-3">
          <ViewToggle mode={viewMode} onChange={handleViewModeChange} />
        </div>
      </div>

      {/* ── Filtres & Recherche ────────────────────────────────────────── */}
      <div className="p-5 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
        {/* Recherche */}
        <div className="relative">
          <Search className="w-4 h-4 text-foreground-muted absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Rechercher par titre, auteur, matière..."
            className="w-full pl-11 pr-4 py-3 text-xs sm:text-sm bg-background-secondary border border-border rounded-2xl text-navy placeholder:text-foreground-muted focus:outline-none focus:border-gold min-h-[48px] transition-colors"
          />
        </div>

        {/* Onglets Filtres : Tous les ouvrages / Mes Favoris */}
        <div className="flex items-center gap-2 pt-2 border-t border-border flex-wrap">
          <button
            type="button"
            onClick={() => {
              setOnlyFavorites(false);
              setCurrentPage(1);
              toast.info("Tous les ouvrages");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors border min-h-[40px] cursor-pointer ${
              !onlyFavorites
                ? "bg-navy text-white border-navy shadow-xs"
                : "bg-background-secondary text-foreground-muted border-border hover:text-navy hover:bg-background"
            }`}
          >
            Tous les ouvrages ({books.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setOnlyFavorites(true);
              setCurrentPage(1);
              toast.info("Mes Favoris");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors border flex items-center gap-2 min-h-[40px] cursor-pointer ${
              onlyFavorites
                ? "bg-gold text-navy border-gold shadow-xs"
                : "bg-background-secondary text-foreground-muted border-border hover:text-navy hover:bg-background"
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${onlyFavorites ? "fill-current text-navy" : "text-gold"}`} />
            <span>Mes Favoris ({favoriteCount})</span>
          </button>
        </div>
      </div>

      {/* ── Erreur ─────────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-2xl border border-error/30 bg-error/10 text-error text-xs sm:text-sm font-medium">
          {error}
        </div>
      )}

      {/* ── Résultats ──────────────────────────────────────────────── */}
      <div className="space-y-6">
        {!loading && (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs text-foreground-muted">
              <strong className="text-navy font-bold">{totalBooks}</strong> ouvrage{totalBooks > 1 ? "s" : ""}{" "}
              {onlyFavorites ? "dans vos favoris" : "dans votre bibliothèque"}
              {searchQuery && (
                <span>
                  {" "}pour « <strong className="text-navy">{searchQuery}</strong> »
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
        ) : filteredBooks.length === 0 ? (
          <div className="py-20 px-6 rounded-3xl bg-background border border-dashed border-border text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-navy/5 flex items-center justify-center mx-auto text-foreground-muted">
              {onlyFavorites ? (
                <Bookmark className="w-7 h-7 text-gold opacity-80" />
              ) : (
                <BookOpen className="w-7 h-7 opacity-60" />
              )}
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="font-serif font-bold text-navy text-lg">
                {onlyFavorites
                  ? "Aucun favori enregistré"
                  : books.length === 0
                  ? "Votre bibliothèque est vide"
                  : "Aucun résultat trouvé"}
              </h3>
              <p className="text-xs text-foreground-muted leading-relaxed">
                {onlyFavorites
                  ? "Cliquez sur l'icône de marque-page d'un ouvrage pour l'ajouter à vos favoris."
                  : books.length === 0
                  ? "Explorez le catalogue académique pour acquérir vos premiers ouvrages ou débloquer vos bouquets campus."
                  : "Modifiez vos critères de recherche ou réinitialisez les filtres."}
              </p>
            </div>
            {books.length === 0 ? (
              <Link
                href="/student/catalog"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors min-h-[44px] shadow-xs cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-gold" />
                <span>Explorer le Catalogue</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors min-h-[44px] shadow-xs cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-gold" />
                <span>Réinitialiser les filtres</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {paginatedBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={{
                      ...book,
                      author: book.authors?.map((a) => a.full_name).join(", ") || "Auteur académique",
                      discipline: book.discipline_name || "Général",
                      format: "PDF",
                      progress_percent: book.progress_percent || 0,
                      is_favorite: Boolean(book.is_favorite),
                    }}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedBooks.map((book) => (
                  <BookListItem
                    key={book.id}
                    book={{
                      ...book,
                      author: book.authors?.map((a) => a.full_name).join(", ") || "Auteur académique",
                      discipline: book.discipline_name || "Général",
                      format: "PDF",
                      progress_percent: book.progress_percent || 0,
                      is_favorite: Boolean(book.is_favorite),
                    }}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
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
    </div>
  );
}
