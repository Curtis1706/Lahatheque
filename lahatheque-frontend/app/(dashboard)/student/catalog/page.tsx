"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  BookOpen,
  ArrowLeft,
  Filter,
  ShoppingBag,
  Play,
  Eye,
  Globe,
  Sparkles,
  CheckCircle2,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import {
  getStudentCatalog,
  type BookAPI,
  type CatalogDataAPI,
} from "@/lib/services/student";
import { BookSampleModal } from "@/components/features/student/book-sample-modal";
import { UnifiedBookOrderModal } from "@/components/features/student/unified-book-order-modal";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

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

// ─── Carte Livre Catalogue ────────────────────────────────────────────────────

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
    <div className="group p-5 rounded-3xl border border-border bg-background hover:border-gold/60 transition-all shadow-xs flex flex-col justify-between gap-4">
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-12 h-16 rounded-xl bg-navy/10 border border-navy/20 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-navy/40" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-[10px] font-bold text-gold uppercase tracking-wider truncate">
              {book.discipline_name || "Académique"}
            </p>
            <h3 className="font-serif font-bold text-navy text-sm sm:text-base leading-snug line-clamp-2">
              {book.title}
            </h3>
            <p className="text-[11px] text-foreground-muted truncate">
              Par {authorName}
            </p>
            <div className="flex items-center gap-2 flex-wrap pt-0.5">
              <span className="px-2 py-0.5 rounded-md bg-navy/5 border border-navy/15 text-[10px] font-mono uppercase text-navy/70">
                {book.format_type?.toUpperCase() || "EPUB"}
              </span>
              {book.publisher_name && (
                <span className="text-[10px] text-foreground-muted truncate">
                  {book.publisher_name}
                </span>
              )}
            </div>
          </div>
        </div>

        {book.summary && (
          <p className="text-xs text-foreground-muted line-clamp-2 leading-relaxed">
            {book.summary}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
        <div className="flex items-center gap-2 flex-wrap">
          {book.is_owned || book.has_digital_access ? (
            <span className="text-[10px] font-bold text-success bg-success/10 border border-success/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-success" /> Déjà acquis
            </span>
          ) : book.price_digital > 0 ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-foreground-muted">Numérique</span>
              <span className="font-mono font-bold text-gold text-xs sm:text-sm">
                {book.price_digital.toLocaleString("fr-FR")} XOF
              </span>
            </div>
          ) : (
            <span className="text-xs font-bold text-success">Accès libre</span>
          )}
          {book.is_paper_available && book.price_paper > 0 && (
            <span className="text-[10px] font-bold text-navy bg-navy/10 px-2 py-0.5 rounded-full">
              Disponible en papier
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {book.is_owned || book.has_digital_access ? (
            <div className="flex items-center gap-1.5">
              <Link
                href={`/catalog/reader/${book.id}`}
                className="px-3.5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center gap-1.5 min-h-[40px] shadow-xs"
              >
                <BookOpen className="w-3.5 h-3.5 text-gold" />
                Lire
              </Link>
              {book.is_paper_available && (
                <button
                  type="button"
                  onClick={() => onOpenOrderModal(book)}
                  className="px-3 py-2 rounded-xl border border-border bg-background hover:border-gold text-navy text-xs font-bold transition-colors flex items-center gap-1 min-h-[40px] shadow-2xs cursor-pointer"
                  title="Commander la version papier"
                >
                  <Truck className="w-3.5 h-3.5 text-navy" />
                  Papier
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onOpenOrderModal(book)}
              className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center gap-1.5 min-h-[40px] shadow-xs cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-gold" />
              Commander
            </button>
          )}

          <Link
            href={`/student/catalog/${book.id}`}
            className="px-3 py-2 rounded-xl bg-background-secondary border border-border hover:border-gold text-navy text-xs font-semibold flex items-center justify-center min-h-[40px] transition-colors"
            title="Consulter la fiche détaillée"
          >
            Détail
          </Link>
        </div>
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
  const [selectedFormat, setSelectedFormat] = useState("all");
  const [debouncedQ, setDebouncedQ] = useState("");

  const [sampleModalBook, setSampleModalBook] = useState<BookAPI | null>(null);
  const [orderModalBook, setOrderModalBook] = useState<BookAPI | null>(null);

  // Debounce la recherche
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStudentCatalog(
        debouncedQ || undefined,
        selectedDiscipline !== "all" ? selectedDiscipline : undefined,
        selectedFormat !== "all" ? selectedFormat : undefined
      );
      setCatalogData(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Erreur de chargement du catalogue"
      );
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, selectedDiscipline, selectedFormat]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const handleOpenSample = (book: BookAPI) => {
    setSampleModalBook(book);
    toast.info(`Ouverture de l'extrait pour « ${book.title} »`);
  };

  const books = catalogData?.books || [];
  const disciplines = catalogData?.disciplines || [];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/student" className="hover:text-navy">
          Mon Espace
        </Link>
        <span>/</span>
        <span className="text-navy font-semibold">Catalogue Académique</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-5">
        <Link
          href="/student"
          className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour
        </Link>
        <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
          <Globe className="w-4 h-4 text-gold" />
          Catalogue Universitaire &amp; Grand Public
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
          Explorer le Catalogue
        </h1>
        <p className="text-xs text-foreground-muted mt-1">
          Consultez un extrait gratuit sans inscription préalable. Achetez à l&apos;unité ou débloquez via vos bouquets campus.
        </p>
      </div>

      {/* ── Erreur ────────────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-2xl border border-error/30 bg-error/10 text-error text-sm">
          {error}
        </div>
      )}

      {/* ── Filtres ─────────────────────────────────────────────────── */}
      <div className="p-4 rounded-3xl bg-background border border-border space-y-3 shadow-xs">
        {/* Recherche */}
        <div className="relative">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par titre, auteur, mot-clé, matière..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy placeholder:text-foreground-muted focus:outline-none focus:border-gold min-h-[44px]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
          {/* Disciplines */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-foreground-muted" />
              <span className="text-[10px] font-bold uppercase text-foreground-muted">
                Discipline :
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedDiscipline("all");
                toast.info("Toutes les disciplines");
              }}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors border min-h-[36px] ${
                selectedDiscipline === "all"
                  ? "bg-navy text-white border-navy shadow-xs"
                  : "bg-background-secondary text-foreground-muted border-border hover:text-navy"
              }`}
            >
              Toutes
            </button>
            {disciplines.slice(0, 5).map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => {
                  setSelectedDiscipline(d.id);
                  toast.info(`Discipline : ${d.name}`);
                }}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors border min-h-[36px] ${
                  selectedDiscipline === d.id
                    ? "bg-navy text-white border-navy shadow-xs"
                    : "bg-background-secondary text-foreground-muted border-border hover:text-navy"
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>

          {/* Format */}
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase text-foreground-muted">
              Format :
            </span>
            {[
              { id: "all", label: "Tous" },
              { id: "epub", label: "EPUB" },
              { id: "pdf", label: "PDF" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setSelectedFormat(f.id);
                  toast.info(`Format : ${f.label}`);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-colors border min-h-[36px] ${
                  selectedFormat === f.id
                    ? "bg-gold text-navy border-gold shadow-xs"
                    : "bg-background-secondary text-foreground-muted border-border hover:text-navy"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Résultats ─────────────────────────────────────────────────── */}
      <div>
        {!loading && catalogData && (
          <p className="text-xs text-foreground-muted mb-4">
            {catalogData.total} ouvrage{catalogData.total > 1 ? "s" : ""} trouvé
            {catalogData.total > 1 ? "s" : ""}
            {debouncedQ && (
              <span>
                {" "}
                pour «{" "}
                <strong className="text-navy">{debouncedQ}</strong> »
              </span>
            )}
          </p>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 9 }).map((_, i) => (
              <SkeletonBook key={i} />
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="py-16 rounded-3xl bg-background border border-dashed border-border text-center space-y-3">
            <BookOpen className="w-10 h-10 text-foreground-muted mx-auto opacity-40" />
            <h3 className="font-serif font-bold text-navy text-lg">Aucun résultat trouvé</h3>
            <p className="text-xs text-foreground-muted max-w-sm mx-auto">
              Modifiez vos critères de recherche ou réinitialisez les filtres.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedDiscipline("all");
                setSelectedFormat("all");
                toast.info("Filtres réinitialisés");
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors min-h-[44px]"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {books.map((book) => (
              <CatalogBookCard
                key={book.id}
                book={book}
                onOpenSample={handleOpenSample}
                onOpenOrderModal={(b) => setOrderModalBook(b)}
              />
            ))}
          </div>
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
