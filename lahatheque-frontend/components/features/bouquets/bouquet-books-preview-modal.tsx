"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import {
  BookOpen,
  Search,
  Building2,
  X,
  Layers,
  GraduationCap,
  Calendar,
  AlertCircle,
} from "lucide-react";
import {
  getInstitutionBooksPreview,
  getBouquetOfferingBooksPreview,
  InstitutionBooksPreviewResponse,
  InstitutionBookPreviewItem,
} from "@/lib/services/admin";

export interface BouquetBooksPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Option 1 : ID du bouquet offering
  bouquetId?: string | null;
  bouquetTitle?: string;
  // Option 2 : ID d'université
  institutionId?: string | null;
  institutionName?: string;
  // Option 3 : Liste directe d'ouvrages (ex: sélection sur-mesure dans la modale)
  directBooks?: InstitutionBookPreviewItem[] | null;
  directTitle?: string;
}

export function BouquetBooksPreviewModal({
  isOpen,
  onClose,
  bouquetId,
  bouquetTitle,
  institutionId,
  institutionName,
  directBooks,
  directTitle,
}: BouquetBooksPreviewModalProps) {
  const [data, setData] = useState<{
    title: string;
    subtitle?: string;
    books_count: number;
    books: InstitutionBookPreviewItem[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setData(null);
      setError(null);
      setSearchQuery("");
      return;
    }

    // Cas 1 : Ouvrages passés directement (ex: sélection sur mesure en cours)
    if (directBooks) {
      setData({
        title: directTitle || "Ouvrages sélectionnés",
        subtitle: "Sélection sur-mesure",
        books_count: directBooks.length,
        books: directBooks,
      });
      setLoading(false);
      setError(null);
      return;
    }

    // Cas 2 : ID de bouquet
    if (bouquetId) {
      let isMounted = true;
      setLoading(true);
      setError(null);

      getBouquetOfferingBooksPreview(bouquetId)
        .then((res) => {
          if (!isMounted) return;
          if (res) {
            setData({
              title: bouquetTitle || res.title,
              subtitle: res.target_institution_name || (res.discipline ? `Discipline : ${res.discipline}` : (res.country ? `Pays : ${res.country}` : "Catalogue")),
              books_count: res.books_count,
              books: res.books,
            });
          } else {
            setError("Impossible de charger le contenu réel de ce bouquet.");
          }
        })
        .catch((err) => {
          if (!isMounted) return;
          console.error("Erreur aperçu livres bouquet:", err);
          setError("Une erreur réseau est survenue.");
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });

      return () => {
        isMounted = false;
      };
    }

    // Cas 3 : ID d'institution
    if (institutionId) {
      let isMounted = true;
      setLoading(true);
      setError(null);

      getInstitutionBooksPreview(institutionId)
        .then((res) => {
          if (!isMounted) return;
          if (res) {
            setData({
              title: institutionName || res.institution_name,
              subtitle: `Code : ${res.institution_code || "—"}`,
              books_count: res.books_count,
              books: res.books,
            });
          } else {
            setError("Impossible de charger les ouvrages de cet établissement.");
          }
        })
        .catch((err) => {
          if (!isMounted) return;
          console.error("Erreur aperçu livres université:", err);
          setError("Une erreur réseau est survenue.");
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [isOpen, bouquetId, bouquetTitle, institutionId, institutionName, directBooks, directTitle]);

  const filteredBooks = useMemo(() => {
    if (!data?.books) return [];
    if (!searchQuery.trim()) return data.books;
    const q = searchQuery.toLowerCase().trim();
    return data.books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.discipline.toLowerCase().includes(q) ||
        b.authors.some((a) => a.toLowerCase().includes(q))
    );
  }, [data, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-navy-dark/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-background rounded-2xl border border-border shadow-2xl overflow-hidden font-poppins"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bouquet-books-preview-title"
      >
        {/* En-tête */}
        <div className="flex items-start justify-between p-4 sm:p-6 border-b border-border bg-background-secondary/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="bouquet-books-preview-title"
                className="font-playfair font-bold text-lg sm:text-xl text-navy"
              >
                {data?.title || bouquetTitle || institutionName || "Contenu du Bouquet"}
              </h2>
              <p className="text-xs sm:text-sm text-foreground/70 flex items-center gap-2 mt-0.5">
                {data?.subtitle && (
                  <>
                    <span><strong className="text-navy">{data.subtitle}</strong></span>
                    <span>•</span>
                  </>
                )}
                <span>
                  Total : <strong className="text-gold">{data?.books_count ?? 0} ouvrage(s)</strong>
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la fenêtre"
            className="p-2 rounded-lg text-foreground/60 hover:text-navy hover:bg-background-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barre de recherche rapide */}
        <div className="p-4 border-b border-border bg-background flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par titre, auteur ou discipline..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-border bg-background-secondary/30 focus:bg-background focus:outline-none focus:border-gold transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-foreground/40 hover:text-foreground"
              >
                Effacer
              </button>
            )}
          </div>
          <div className="text-xs text-foreground/60 shrink-0 hidden sm:block">
            {filteredBooks.length} / {data?.books_count ?? 0} affiché(s)
          </div>
        </div>

        {/* Corps défilant */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-10 h-10 mx-auto rounded-full border-2 border-gold border-t-transparent animate-spin" />
              <p className="text-sm text-foreground/70">Chargement des ouvrages de l'université...</p>
            </div>
          ) : error ? (
            <div className="py-12 px-4 rounded-xl border border-border bg-background-secondary/40 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-foreground/60 mx-auto" />
              <p className="text-sm text-foreground/80">{error}</p>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <BookOpen className="w-10 h-10 text-foreground/40 mx-auto" />
              <p className="font-playfair font-semibold text-base text-navy">
                {searchQuery ? "Aucun ouvrage ne correspond à votre recherche" : "Aucun ouvrage publié pour cette université"}
              </p>
              <p className="text-xs text-foreground/60 max-w-sm mx-auto">
                {searchQuery
                  ? "Essayez de modifier vos termes de recherche."
                  : "Dès que l'établissement ou ses enseignants publieront des ouvrages validés, ils apparaîtront automatiquement ici."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBooks.map((book) => (
                <div
                  key={book.id}
                  className="flex gap-3 p-3 rounded-xl border border-border bg-background-secondary/30 hover:border-gold/40 hover:bg-background-secondary/60 transition-all group"
                >
                  {/* Miniature Couverture */}
                  <div className="relative w-16 h-22 sm:w-20 sm:h-28 shrink-0 rounded-lg overflow-hidden border border-border bg-navy/5 flex items-center justify-center">
                    {book.cover_url ? (
                      <img
                        src={book.cover_url}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                    ) : (
                      <div className="p-2 text-center flex flex-col items-center justify-center h-full">
                        <BookOpen className="w-6 h-6 text-gold/60 mb-1" />
                        <span className="text-[9px] line-clamp-2 font-serif text-navy font-bold leading-tight">
                          {book.title}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Informations */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      {book.discipline && (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-gold/10 text-gold border border-gold/20 mb-1 max-w-full truncate">
                          {book.discipline}
                        </span>
                      )}
                      <h4
                        className="font-playfair font-bold text-xs sm:text-sm text-navy line-clamp-2 group-hover:text-gold transition-colors leading-tight"
                        title={book.title}
                      >
                        {book.title}
                      </h4>
                      <p className="text-[11px] text-foreground/70 truncate mt-1">
                        {book.authors.length > 0 ? book.authors.join(", ") : "Auteur non renseigné"}
                      </p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between text-[10px] text-foreground/60">
                      <span className="uppercase font-medium text-foreground/80">
                        {book.format_type}
                      </span>
                      {book.publication_year && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-foreground/40" />
                          {book.publication_year}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pied de page */}
        <div className="p-4 border-t border-border bg-background-secondary/30 flex items-center justify-between">
          <p className="text-xs text-foreground/60">
            Intégralité des ouvrages automatiquement inclus et accessibles aux abonnés de ce bouquet
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-navy text-background text-xs sm:text-sm font-medium hover:bg-navy-hover transition-colors shadow-sm cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
