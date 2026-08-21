"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  BookOpen,
  ArrowLeft,
  Search,
  Heart,
  Filter,
  Sparkles,
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonBook() {
  return (
    <div className="p-4 rounded-3xl border border-border bg-background animate-pulse space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-16 h-22 rounded-xl bg-navy/10 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 rounded bg-navy/10 w-3/4" />
          <div className="h-2 rounded bg-navy/10 w-1/2" />
          <div className="h-2 rounded bg-navy/10 w-1/3" />
        </div>
      </div>
      <div className="h-2 rounded-full bg-navy/10" />
    </div>
  );
}

// ─── Page Principale ──────────────────────────────────────────────────────────

export default function StudentBooksPage() {
  const [books, setBooks] = useState<BookAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formatFilter, setFormatFilter] = useState("all");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const loadBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStudentBooks(
        formatFilter !== "all" ? formatFilter : undefined,
        onlyFavorites
      );
      setBooks(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [formatFilter, onlyFavorites]);

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

  const filteredBooks = books.filter((b) => {
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

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/student" className="hover:text-navy">
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
            className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4 text-gold" />
            Fonds Personnel de Lecture
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Ma Bibliothèque
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Tous les livres débloqués par vos bouquets universitaires, achats et
            accès libres.
          </p>
        </div>

        {/* Contrôles Header : Sélecteur Grille/Liste */}
        <div className="flex items-center gap-3 flex-wrap">
          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {/* ── Filtres & Recherche ────────────────────────────────────────── */}
      <div className="p-4 rounded-3xl bg-background border border-border space-y-3 shadow-xs">
        {/* Recherche */}
        <div className="relative">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par titre, auteur ou matière..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy placeholder:text-foreground-muted focus:outline-none focus:border-gold min-h-[44px]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-foreground-muted" />
            <span className="text-[10px] font-bold uppercase text-foreground-muted">
              Format :
            </span>
          </div>
          {[
            { id: "all", label: "Tous" },
            { id: "epub", label: "EPUB" },
            { id: "pdf", label: "PDF" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setFormatFilter(f.id);
                toast.info(`Filtre format : ${f.label}`);
              }}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors border min-h-[36px] ${
                formatFilter === f.id
                  ? "bg-navy text-white border-navy shadow-xs"
                  : "bg-background-secondary text-foreground-muted border-border hover:text-navy"
              }`}
            >
              {f.label}
            </button>
          ))}

          <div className="ml-auto">
            <button
              type="button"
              onClick={() => {
                const nextFav = !onlyFavorites;
                setOnlyFavorites(nextFav);
                toast.info(nextFav ? "Affichage des favoris uniquement" : "Affichage de tous les ouvrages");
              }}
              className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-colors border flex items-center gap-1.5 min-h-[36px] ${
                onlyFavorites
                  ? "bg-gold text-navy border-gold shadow-xs"
                  : "bg-background-secondary text-foreground-muted border-border hover:text-navy"
              }`}
            >
              <Heart
                className={`w-3.5 h-3.5 ${onlyFavorites ? "fill-current" : ""}`}
              />
              Favoris
            </button>
          </div>
        </div>
      </div>

      {/* ── Erreur ─────────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-2xl border border-error/30 bg-error/10 text-error text-sm">
          {error}
        </div>
      )}

      {/* ── Contenu ────────────────────────────────────────────────── */}
      {loading ? (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
              : "space-y-3"
          }
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonBook key={i} />
          ))}
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="py-16 rounded-3xl bg-background border border-dashed border-border text-center space-y-3">
          <BookOpen className="w-10 h-10 text-foreground-muted mx-auto opacity-40" />
          <h3 className="font-serif font-bold text-navy text-lg">
            {books.length === 0
              ? "Votre bibliothèque est vide"
              : "Aucun résultat pour cette recherche"}
          </h3>
          <p className="text-xs text-foreground-muted max-w-sm mx-auto">
            {books.length === 0
              ? "Explorez le catalogue académique pour acquérir vos premiers ouvrages ou connectez votre université."
              : "Modifiez vos critères de recherche ou réinitialisez les filtres."}
          </p>
          {books.length === 0 ? (
            <Link
              href="/student/catalog"
              className="inline-flex mt-2 items-center gap-2 px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors min-h-[44px]"
            >
              <Sparkles className="w-4 h-4 text-gold" />
              Explorer le Catalogue
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setFormatFilter("all");
                setOnlyFavorites(false);
              }}
              className="inline-flex mt-2 items-center gap-2 px-4 py-2 rounded-xl border border-border text-navy text-xs font-semibold hover:border-gold"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBooks.map((book) => (
            <BookCard
              key={book.id}
              book={{
                ...book,
                author: book.authors?.map((a) => a.full_name).join(", ") || "Auteur académique",
                discipline: book.discipline_name || "Général",
                format: book.format_type?.toUpperCase() === "PDF" ? "PDF" : "EPUB",
                progress_percent: book.progress_percent || 0,
                is_favorite: Boolean(book.is_favorite),
              }}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBooks.map((book) => (
            <BookListItem
              key={book.id}
              book={{
                ...book,
                author: book.authors?.map((a) => a.full_name).join(", ") || "Auteur académique",
                discipline: book.discipline_name || "Général",
                format: book.format_type?.toUpperCase() === "PDF" ? "PDF" : "EPUB",
                progress_percent: book.progress_percent || 0,
                is_favorite: Boolean(book.is_favorite),
              }}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}
