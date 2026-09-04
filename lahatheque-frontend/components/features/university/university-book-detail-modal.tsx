"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  X,
  BookOpen,
  ShoppingBag,
  Eye,
  Building2,
  Bookmark,
  Calendar,
  Layers,
  FileText,
  CheckCircle2,
  PackageCheck
} from "lucide-react";
import { BookCover3D } from "@/components/ui/book-cover-3d";
import { getBookById } from "@/lib/services/catalog";
import type { UniversityBookCatalogItem } from "@/lib/types/university";
import type { Book } from "@/lib/types/catalog";

interface UniversityBookDetailModalProps {
  book: UniversityBookCatalogItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UniversityBookDetailModal({
  book,
  isOpen,
  onClose,
}: UniversityBookDetailModalProps) {
  const [detailedBook, setDetailedBook] = useState<Book | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (!isOpen || !book) {
      setDetailedBook(null);
      return;
    }

    let isMounted = true;
    async function loadExtraDetails() {
      if (!book) return;
      setLoadingDetails(true);
      try {
        const extra = await getBookById(book.id);
        if (isMounted && extra) {
          setDetailedBook(extra);
        }
      } catch (err) {
        console.error("Erreur lors de la récupération des détails de l'ouvrage:", err);
      } finally {
        if (isMounted) {
          setLoadingDetails(false);
        }
      }
    }

    loadExtraDetails();

    return () => {
      isMounted = false;
    };
  }, [isOpen, book]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !book) return null;

  const authorsList = Array.isArray(book.authors)
    ? book.authors.join(", ")
    : (book.authors || "Auteur inconnu");

  const summaryText =
    detailedBook?.summary ||
    `Cet ouvrage de référence en ${book.discipline || "sciences universitaires"} fait partie intégrante du fonds académique LAHAThèque mis à disposition de votre communauté d'étudiants, enseignants et chercheurs affiliés.`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto bg-navy-dark/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-3xl bg-background rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header de la modale */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border bg-background-secondary/40 shrink-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-navy/5 text-navy border border-border text-xs font-bold">
              <Bookmark className="w-3.5 h-3.5 text-gold" />
              <span>Fiche Ouvrage Académique</span>
            </span>
            <span className="text-xs text-foreground-muted hidden sm:inline">
              Fonds Documentaire Campus
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-foreground-muted hover:text-navy hover:bg-background transition-colors"
            aria-label="Fermer la fiche détaillée"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps de la modale avec défilement fluide */}
        <div className="p-5 sm:p-6 md:p-7 overflow-y-auto space-y-6 flex-1 text-foreground">
          {/* Section principale : Couverture 3D + Métadonnées */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Couverture 3D */}
            <div className="shrink-0 flex flex-col items-center gap-3">
              <div className="p-2 rounded-xl bg-background-secondary border border-border">
                <BookCover3D
                  title={book.title}
                  authors={book.authors}
                  discipline={book.discipline}
                  coverUrl={book.cover_url}
                  size="sm"
                  interactive={true}
                />
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-navy px-2 py-0.5 rounded-md bg-gold/15 border border-gold/30">
                  <CheckCircle2 className="w-3 h-3 text-gold" />
                  Extrait disponible
                </span>
                <span className="text-[10px] text-foreground-muted">
                  Disponible en version papier &amp; numérique
                </span>
              </div>
            </div>

            {/* Informations principales */}
            <div className="space-y-3 min-w-0 flex-1 text-center sm:text-left">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-navy/10 text-navy font-semibold text-xs border border-navy/20">
                    {book.discipline || "Général"}
                  </span>
                  {book.faculty_name && (
                    <span className="px-2.5 py-0.5 rounded-md bg-background-secondary text-foreground-muted font-medium text-xs border border-border inline-flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-navy" />
                      {book.faculty_name}
                    </span>
                  )}
                </div>

                <h2
                  id="book-modal-title"
                  className="font-serif text-xl sm:text-2xl font-bold text-navy leading-snug pt-1"
                >
                  {book.title}
                </h2>

                <p className="text-sm font-medium text-foreground-muted">
                  Par <span className="text-navy font-semibold">{authorsList}</span>
                </p>
              </div>

              {/* Grille des identifiants et métadonnées */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs bg-background-secondary/50 p-3 rounded-xl border border-border">
                <div>
                  <span className="text-foreground-muted block text-[11px]">ISBN Numérique</span>
                  <span className="font-mono font-bold text-navy">{book.isbn_digital || "N/A"}</span>
                </div>
                <div>
                  <span className="text-foreground-muted block text-[11px]">ISBN Papier</span>
                  <span className="font-mono font-bold text-navy">{book.isbn_print || "N/A"}</span>
                </div>
                {detailedBook?.publisher_name && (
                  <div>
                    <span className="text-foreground-muted block text-[11px]">Éditeur</span>
                    <span className="font-semibold text-navy">{detailedBook.publisher_name}</span>
                  </div>
                )}
                {detailedBook?.publication_year && (
                  <div>
                    <span className="text-foreground-muted block text-[11px]">Année d&apos;édition</span>
                    <span className="font-semibold text-navy">{detailedBook.publication_year}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Grille des Métriques & Tarifs pour le Campus */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-border bg-background-secondary/30 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-navy/10 flex items-center justify-center text-navy shrink-0">
                <Eye className="w-4 h-4 text-gold" />
              </div>
              <div>
                <p className="text-[11px] text-foreground-muted font-medium">Consultations Campus</p>
                <p className="font-mono text-sm font-bold text-navy">
                  {book.consultations_count.toLocaleString("fr-FR")} vue(s)
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-background-secondary/30 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-navy/10 flex items-center justify-center text-navy shrink-0">
                <Layers className="w-4 h-4 text-gold" />
              </div>
              <div>
                <p className="text-[11px] text-foreground-muted font-medium">Tarif Unitaire Numérique</p>
                <p className="font-mono text-sm font-bold text-navy">
                  {book.price_digital.toLocaleString("fr-FR")} {book.currency}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-background-secondary/30 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-navy/10 flex items-center justify-center text-navy shrink-0">
                <PackageCheck className="w-4 h-4 text-gold" />
              </div>
              <div>
                <p className="text-[11px] text-foreground-muted font-medium">Tarif Exemplaire Papier</p>
                <p className="font-mono text-sm font-bold text-navy">
                  {book.price_paper.toLocaleString("fr-FR")} {book.currency}
                </p>
              </div>
            </div>
          </div>

          {/* Résumé académique */}
          <div className="space-y-2 pt-1 border-t border-border">
            <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5 text-gold" />
              Présentation &amp; Résumé de l&apos;ouvrage
            </div>
            <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed whitespace-pre-line bg-background-secondary/30 p-4 rounded-xl border border-border">
              {summaryText}
            </p>
          </div>
        </div>

        {/* Footer d'actions sécurisées en interne au dashboard */}
        <div className="px-5 sm:px-6 py-4 border-t border-border bg-background-secondary/60 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-background-secondary text-foreground text-xs font-semibold transition-colors min-h-[44px]"
          >
            Fermer
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
            <Link
              href={`/catalog/reader/${book.id}?mode=sample`}
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gold/15 border border-gold/30 hover:bg-gold/25 text-navy text-xs font-bold transition-colors inline-flex items-center justify-center gap-2 min-h-[44px]"
              title="Lire l'extrait gratuit"
            >
              <BookOpen className="w-4 h-4 text-gold" />
              <span>Lire l&apos;extrait gratuit</span>
            </Link>

            <Link
              href="/university/purchases/new"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold transition-colors inline-flex items-center justify-center gap-2 shadow-xs min-h-[44px]"
              title="Commander des exemplaires papier"
            >
              <ShoppingBag className="w-4 h-4 text-gold" />
              <span>Commander pour le Campus</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
