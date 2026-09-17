"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  X,
  BookOpen,
  Eye,
  Search,
  Sparkles,
  CheckCircle2,
  Layers,
  LayoutList,
  LayoutGrid,
} from "lucide-react";
import { BookCover3D } from "@/components/ui/book-cover-3d";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";

export interface BouquetBookItem {
  id: string;
  title: string;
  subtitle?: string;
  authors?: string[];
  author?: string;
  discipline?: string;
  cover_url?: string | null;
  page_count?: number;
  format_type?: string;
  summary?: string;
  isbn?: string;
  has_sample?: boolean;
}

export interface BouquetDetailsModalData {
  id: string;
  offering_id?: string | null;
  title: string;
  bouquet_type?: string;
  faculty_code?: string;
  discipline?: string;
  books_count: number;
  monthly_price?: number;
  annual_price: number;
  currency?: string;
  description?: string;
  is_subscribed: boolean;
  end_date?: string | null;
  books?: BouquetBookItem[];
}

interface BouquetBooksModalProps {
  bouquet: BouquetDetailsModalData | null;
  isOpen: boolean;
  onClose: () => void;
  onSubscribe?: (bouquetId: string, period: "monthly" | "annual") => Promise<boolean | any>;
}

export function BouquetBooksModal({
  bouquet,
  isOpen,
  onClose,
  onSubscribe,
}: BouquetBooksModalProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<"monthly" | "annual">("annual");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Fermeture par la touche Échap
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const books = useMemo(() => bouquet?.books || [], [bouquet?.books]);

  if (!isOpen || !bouquet) return null;

  const isSubscribed = bouquet.is_subscribed;
  const currency = "FCFA";
  const monthlyPrice = bouquet.monthly_price || Math.round(bouquet.annual_price / 10) || 50000;
  const annualPrice = bouquet.annual_price || 500000;

  const handleSubscribeClick = async () => {
    if (!onSubscribe) return;
    setIsSubmitting(true);
    try {
      await onSubscribe(bouquet.offering_id || bouquet.id, selectedPeriod);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAuthorDisplay = (book: BouquetBookItem) => {
    if (book.author) return book.author;
    if (book.authors && book.authors.length > 0) return book.authors.join(", ");
    return "Auteur académique";
  };

  const renderMobileCard = (book: BouquetBookItem) => {
    const authorDisplay = getAuthorDisplay(book);
    const readerUrl = isSubscribed
      ? `/catalog/reader/${book.id}`
      : `/catalog/reader/${book.id}?mode=sample`;

    return (
      <div className="p-3.5 rounded-2xl bg-card border border-border hover:border-gold/60 transition-all flex gap-3.5 items-start">
        <div className="shrink-0 pt-0.5">
          <BookCover3D
            title={book.title}
            authors={authorDisplay}
            discipline={book.discipline || bouquet.discipline || "Numérique"}
            coverUrl={book.cover_url || undefined}
            size="xs"
            interactive={false}
          />
        </div>

        <div className="min-w-0 flex-1 flex flex-col justify-between self-stretch gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] font-bold uppercase tracking-wider text-gold px-1.5 py-0.5 rounded bg-navy/5 border border-gold/20">
                {book.discipline || bouquet.discipline || "Général"}
              </span>
              <span className="text-[9px] text-foreground-muted">
                {book.page_count ? `${book.page_count} pages` : "Numérique"}
              </span>
            </div>
            <h4 className="font-serif font-bold text-xs sm:text-sm text-navy leading-snug line-clamp-2">
              {book.title}
            </h4>
            <p className="text-[11px] text-foreground-muted line-clamp-1">
              {authorDisplay}
            </p>
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono text-foreground-muted uppercase">
              {isSubscribed ? "Accès Intégral" : "Extrait Gratuit"}
            </span>
            <Link
              href={readerUrl}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors min-h-[34px] ${
                isSubscribed
                  ? "bg-navy hover:bg-navy-hover text-white shadow-2xs"
                  : "bg-gold/15 hover:bg-gold/25 text-navy border border-gold/30"
              }`}
            >
              {isSubscribed ? (
                <>
                  <BookOpen className="w-3.5 h-3.5 text-gold" />
                  <span>Lire</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-gold" />
                  <span>Lire l&apos;extrait</span>
                </>
              )}
            </Link>
          </div>
        </div>
      </div>
    );
  };

  const columns: DataTableColumn<BouquetBookItem>[] = [
    {
      key: "cover",
      header: "Ouvrage",
      className: "w-[72px] sm:w-[80px] text-center",
      cell: (book) => {
        const authorDisplay = getAuthorDisplay(book);
        return (
          <div className="flex justify-center py-1">
            <BookCover3D
              title={book.title}
              authors={authorDisplay}
              discipline={book.discipline || bouquet.discipline || "Numérique"}
              coverUrl={book.cover_url || undefined}
              size="xs"
              interactive={false}
            />
          </div>
        );
      },
    },
    {
      key: "title",
      header: "Titre & Auteurs",
      cell: (book) => {
        const authorDisplay = getAuthorDisplay(book);
        return (
          <div className="space-y-1 py-1 max-w-sm sm:max-w-md">
            <h4 className="font-serif font-bold text-xs sm:text-sm text-navy leading-snug line-clamp-2">
              {book.title}
            </h4>
            {book.subtitle && (
              <p className="text-[11px] text-foreground-muted line-clamp-1">
                {book.subtitle}
              </p>
            )}
            <p className="text-[11px] text-foreground-muted font-medium">
              {authorDisplay}
            </p>
            {book.isbn && (
              <span className="text-[10px] font-mono text-foreground-muted/70 block">
                ISBN : {book.isbn}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "discipline",
      header: "Discipline",
      hideOnMobile: true,
      cell: (book) => (
        <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-gold px-2 py-0.5 rounded bg-navy/5 border border-gold/20">
          {book.discipline || bouquet.discipline || "Général"}
        </span>
      ),
    },
    {
      key: "page_count",
      header: "Pages",
      hideOnMobile: true,
      className: "text-center whitespace-nowrap",
      cell: (book) => (
        <span className="text-xs font-mono text-foreground-muted">
          {book.page_count ? `${book.page_count} p.` : "Numérique"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Action",
      className: "text-right whitespace-nowrap",
      cell: (book) => {
        const readerUrl = isSubscribed
          ? `/catalog/reader/${book.id}`
          : `/catalog/reader/${book.id}?mode=sample`;
        return (
          <Link
            href={readerUrl}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors min-h-[34px] ${
              isSubscribed
                ? "bg-navy hover:bg-navy-hover text-white shadow-2xs"
                : "bg-gold/15 hover:bg-gold/25 text-navy border border-gold/30"
            }`}
            title={
              isSubscribed
                ? "Ouvrir l'ouvrage complet dans la liseuse"
                : "Lire l'extrait gratuit de cet ouvrage"
            }
          >
            {isSubscribed ? (
              <>
                <BookOpen className="w-3.5 h-3.5 text-gold" />
                <span>Lire</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-gold" />
                <span>Lire l&apos;extrait</span>
              </>
            )}
          </Link>
        );
      },
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bouquet-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-navy-dark/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-background border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header Modale */}
        <div className="p-4 sm:p-5 border-b border-border bg-background-secondary/40 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 pr-4">
              <div className="flex items-center flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gold/15 text-navy border border-gold/30">
                  <Layers className="w-3 h-3 text-gold" />
                  {bouquet.faculty_code || bouquet.discipline || "Bouquet Thématique"}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-navy/10 text-navy border border-navy/20">
                  Format 100% Numérique
                </span>
                {isSubscribed ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 border border-emerald-300">
                    <CheckCircle2 className="w-3 h-3" />
                    Souscription Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-background text-foreground-muted border border-border">
                    Disponible
                  </span>
                )}
              </div>

              <h2
                id="bouquet-modal-title"
                className="font-playfair text-lg sm:text-2xl font-bold text-navy leading-snug"
              >
                {bouquet.title}
              </h2>

              <p className="text-xs text-foreground-muted leading-relaxed max-w-2xl">
                {isSubscribed
                  ? "Votre accès campus est actif. Les titres ci-dessous sont disponibles en lecture intégrale et illimitée sur la liseuse numérique sécurisée."
                  : "Parcourez la collection officielle de ce bouquet numérique. Chaque ouvrage propose son extrait officiel en lecture gratuite avant souscription."}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Sélecteur de vue (Tableau / Grille) */}
              <div className="hidden sm:flex items-center p-0.5 bg-background border border-border rounded-xl">
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    viewMode === "table"
                      ? "bg-navy text-white shadow-xs"
                      : "text-foreground-muted hover:text-navy"
                  }`}
                  title="Vue Tableau (DataTable)"
                >
                  <LayoutList className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-navy text-white shadow-xs"
                      : "text-foreground-muted hover:text-navy"
                  }`}
                  title="Vue Grille (Cartes)"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-foreground-muted hover:text-navy hover:bg-navy/5 transition-colors cursor-pointer"
                aria-label="Fermer la fenêtre"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Corps : DataTable ou Grille avec Pagination */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {viewMode === "table" ? (
            <DataTable
              data={books}
              columns={columns}
              rowKey="id"
              searchable={true}
              searchPlaceholder="Rechercher un ouvrage, auteur ou discipline..."
              pageSize={10}
              pageSizeOptions={[10, 20, 50, 100]}
              showPagination={true}
              mobileCard={renderMobileCard}
              emptyMessage="Aucun ouvrage ne correspond à votre recherche dans ce bouquet."
              className="border-0 shadow-none p-0"
            />
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {books.map(renderMobileCard)}
              </div>
            </div>
          )}
        </div>

        {/* Footer Modale : Souscription ou Rappel d'accès */}
        <div className="p-4 sm:p-5 border-t border-border bg-background-secondary/60 shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {isSubscribed ? (
            <div className="flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Accès illimité actif pour votre campus
                {bouquet.end_date ? ` jusqu'au ${bouquet.end_date}` : ""}.
              </span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full justify-between">
              {/* Sélecteur de Formule */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPeriod("monthly")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    selectedPeriod === "monthly"
                      ? "bg-navy text-white border-navy shadow-xs"
                      : "bg-background border-border text-foreground hover:border-gold/40"
                  }`}
                >
                  Mensuel ({monthlyPrice.toLocaleString("fr-FR")} FCFA)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPeriod("annual")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    selectedPeriod === "annual"
                      ? "bg-navy text-white border-navy shadow-xs"
                      : "bg-background border-border text-foreground hover:border-gold/40"
                  }`}
                >
                  Annuel ({annualPrice.toLocaleString("fr-FR")} FCFA)
                </button>
              </div>

              {/* Bouton de Souscription */}
              {onSubscribe && (
                <button
                  type="button"
                  onClick={handleSubscribeClick}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold transition-colors inline-flex items-center justify-center gap-2 shadow-md min-h-[42px] disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-gold" />
                  <span className="text-white">
                    {isSubmitting
                      ? "Initialisation..."
                      : `Souscrire à ce Bouquet (${selectedPeriod === "monthly" ? "Mensuel" : "Annuel"})`}
                  </span>
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-background border border-border hover:border-gold text-navy text-xs font-bold transition-colors shrink-0 min-h-[40px] cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
