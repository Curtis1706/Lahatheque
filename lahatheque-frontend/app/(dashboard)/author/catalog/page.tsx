"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  BookOpen,
  ArrowLeft,
  Filter,
  ShoppingBag,
  Eye,
  CheckCircle2,
  Truck,
  Sparkles,
} from "lucide-react";
import {
  getStudentCatalog,
  type BookAPI,
  type CatalogDataAPI,
} from "@/lib/services/student";
import { BookSampleModal } from "@/components/features/student/book-sample-modal";
import { AuthorCatalogOrderModal } from "@/components/features/author/author-catalog-order-modal";

function SkeletonBook() {
  return (
    <div className="p-4 rounded-3xl border border-border bg-background animate-pulse space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-12 h-16 rounded-xl bg-navy/10 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 rounded bg-navy/10 w-2/3" />
          <div className="h-2 rounded bg-navy/10 w-1/2" />
          <div className="h-2 rounded bg-navy/10 w-1/3" />
        </div>
      </div>
      <div className="h-8 rounded-xl bg-navy/10" />
    </div>
  );
}

function AuthorCatalogBookCard({
  book,
  onOpenOrderModal,
}: {
  book: BookAPI;
  onOpenOrderModal: (book: BookAPI) => void;
}) {
  const authorName =
    book.authors?.map((a) => a.full_name).join(", ") || "Auteur académique";

  return (
    <div className="group h-full rounded-3xl border border-border bg-background hover:border-gold/60 hover:shadow-md transition-all flex flex-col overflow-hidden">
      <Link href={`/author/catalog/${book.id}`} className="flex gap-4 p-5 pb-0">
        <div className="shrink-0 w-20 h-28 rounded-xl bg-navy/10 border border-navy/20 overflow-hidden shadow-sm group-hover:shadow-lg transition-shadow">
          {book.cover_url ? (
            <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-navy/40" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-[10px] font-bold text-gold uppercase tracking-wider truncate">
            {book.discipline_name || "Académique"}
          </p>
          <h3 className="font-serif font-bold text-navy text-base leading-snug line-clamp-2 group-hover:text-gold transition-colors">
            {book.title}
          </h3>
          <p className="text-[11px] text-foreground-muted truncate">
            Par {authorName}
          </p>
          <span className="inline-block px-2 py-0.5 rounded-md bg-navy/5 border border-navy/15 text-[10px] font-mono uppercase text-navy/70">
            {book.format_type?.toUpperCase() || "EPUB"}
          </span>
        </div>
      </Link>

      <div className="px-5 pt-3">
        {book.summary && (
          <p className="text-xs text-foreground-muted line-clamp-2 leading-relaxed">
            {book.summary}
          </p>
        )}
      </div>

      <div className="mt-auto p-5 pt-3 space-y-3">
        <div className="border-t border-border pt-3">
          {book.is_owned || book.has_digital_access ? (
            <span className="text-[10px] font-bold text-success bg-success/10 border border-success/30 px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit">
              <CheckCircle2 className="w-3 h-3 text-success" /> Déjà acquis
            </span>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1">
                <span className="text-[9px] uppercase font-bold text-foreground-muted">Numérique</span>
                {book.author_discounted_digital_price !== undefined && book.author_discounted_digital_price !== null ? (
                  <div className="flex items-center gap-1">
                    <span className="font-mono font-bold text-navy text-xs">
                      {book.author_discounted_digital_price.toLocaleString("fr-FR")} FCFA
                    </span>
                    <span className="text-[9px] text-foreground-muted line-through font-mono">
                      {(book.price_digital ?? 0).toLocaleString("fr-FR")}
                    </span>
                  </div>
                ) : (
                  <span className="font-mono font-bold text-navy text-xs">
                    {(book.price_digital ?? 0).toLocaleString("fr-FR")} FCFA
                  </span>
                )}
              </div>
              {book.is_paper_available && (
                <div className="flex items-center gap-1">
                  <span className="text-[9px] uppercase font-bold text-foreground-muted flex items-center gap-0.5">
                    <Truck className="w-2.5 h-2.5 text-gold" /> Papier
                  </span>
                  {book.author_discounted_paper_price !== undefined && book.author_discounted_paper_price !== null ? (
                    <div className="flex items-center gap-1">
                      <span className="font-mono font-bold text-gold text-xs">
                        {book.author_discounted_paper_price.toLocaleString("fr-FR")} FCFA
                      </span>
                      <span className="text-[9px] text-foreground-muted line-through font-mono">
                        {(book.price_paper ?? 0).toLocaleString("fr-FR")}
                      </span>
                    </div>
                  ) : (
                    <span className="font-mono font-bold text-gold text-xs">
                      {(book.price_paper ?? 0).toLocaleString("fr-FR")} FCFA
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/author/catalog/${book.id}`}
            className="px-4 py-2 rounded-xl border border-border bg-background-secondary text-navy text-xs font-semibold hover:border-gold/40 transition-colors flex items-center justify-center min-h-[38px]"
          >
            Détail
          </Link>

          <button
            type="button"
            onClick={() => onOpenOrderModal(book)}
            className="flex-1 px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-dark transition-all flex items-center justify-center gap-1.5 min-h-[38px]"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-gold" />
            <span>Commander</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AuthorCatalogPage() {
  const [catalog, setCatalog] = useState<CatalogDataAPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("all");

  const [sampleBook, setSampleBook] = useState<BookAPI | null>(null);
  const [orderModalBook, setOrderModalBook] = useState<BookAPI | null>(null);

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getStudentCatalog(
        search.trim() || undefined,
        selectedDiscipline !== "all" ? selectedDiscipline : undefined
      );
      setCatalog(data);
    } catch {
      // Fallback empty
    } finally {
      setLoading(false);
    }
  }, [selectedDiscipline, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCatalog();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchCatalog]);

  const allBooks = catalog?.books || [];
  const disciplines = catalog?.disciplines || [];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-8 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 text-xs text-foreground-muted mb-1">
            <Link href="/author" className="hover:text-navy transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Espace Auteur
            </Link>
            <span>/</span>
            <span className="text-navy font-semibold">Catalogue des Ouvrages</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Catalogue Général & Acquisition Auteur
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            Parcourez les publications académiques avec possibilité de commande
          </p>
        </div>

        <Link
          href="/author/purchases"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gold/10 border border-gold/20 text-gold hover:bg-gold/20 text-xs font-bold transition-all self-start sm:self-auto min-h-[44px]"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Mes Achats</span>
        </Link>
      </div>

      {/* Barre de Recherche & Filtres */}
      <div className="p-4 rounded-3xl bg-background border border-border flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-foreground-muted absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par titre, auteur, ISBN, mot-clé..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl border border-border bg-background-secondary text-navy placeholder:text-foreground-muted focus:outline-none focus:border-gold min-h-[44px]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-foreground-muted shrink-0 ml-1" />
          <select
            value={selectedDiscipline}
            onChange={(e) => setSelectedDiscipline(e.target.value)}
            className="px-3.5 py-2.5 text-xs font-semibold rounded-2xl border border-border bg-background-secondary text-navy focus:outline-none focus:border-gold min-h-[44px]"
          >
            <option value="all">Toutes les disciplines</option>
            {disciplines.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>


      {/* Grille des Ouvrages */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-navy">
            Ouvrages Disponibles ({loading ? "..." : allBooks.length})
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonBook key={i} />
            ))}
          </div>
        ) : allBooks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {allBooks.map((book) => (
              <AuthorCatalogBookCard
                key={book.id}
                book={book}
                onOpenOrderModal={(b) => setOrderModalBook(b)}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center rounded-3xl bg-background border border-border space-y-3">
            <BookOpen className="w-10 h-10 text-foreground-muted mx-auto" />
            <h3 className="font-serif text-base font-bold text-navy">Aucun ouvrage trouvé</h3>
            <p className="text-xs text-foreground-muted max-w-sm mx-auto">
              Aucun ouvrage ne correspond à vos critères de recherche ou de filtre.
            </p>
          </div>
        )}
      </div>

      {/* Modale Extrait */}
      <BookSampleModal
        book={
          sampleBook
            ? {
                ...sampleBook,
                author: sampleBook.authors?.map((a) => a.full_name).join(", "),
              }
            : null
        }
        isOpen={Boolean(sampleBook)}
        onClose={() => setSampleBook(null)}
      />

      {/* Modale Commande avec option Crédit Auteur */}
      {orderModalBook && (
        <AuthorCatalogOrderModal
          book={orderModalBook}
          onClose={() => setOrderModalBook(null)}
          onOpenSample={() => {
            const b = orderModalBook;
            setOrderModalBook(null);
            setSampleBook(b);
          }}
          onOrderSuccess={() => {
            fetchCatalog();
          }}
        />
      )}
    </div>
  );
}
