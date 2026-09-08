"use client";

/**
 * Composant d'affichage intelligent des auteurs (AuthorsDisplay).
 * Résout le problème des longues listes d'auteurs scientifiques/universitaires :
 * - Affichage condensé (1 à 2 auteurs + badge interactif "+N autres")
 * - Modale détaillée listant l'intégralité des auteurs avec recherche et copie
 * Conforme à la charte LAHAThèque : tokens sémantiques, zéro émoji, Playfair/Poppins, Lucide React.
 */

import React, { useState, useMemo } from "react";
import { Users, User, Search, Copy, Check, X, BookOpen } from "lucide-react";
import { toast } from "sonner";

export interface AuthorItem {
  id?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  name?: string;
  role?: string;
}

export type RawAuthorsInput =
  | (string | AuthorItem)[]
  | string
  | null
  | undefined;

/**
 * Découpe et normalise toute structure d'auteurs en une liste propre de noms uniques.
 */
export function normalizeAuthorsList(
  authors: RawAuthorsInput,
  fallback?: string
): string[] {
  if (!authors && !fallback) return [];

  if (Array.isArray(authors)) {
    const list = authors
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (typeof item === "object" && item !== null) {
          if (item.full_name && item.full_name.trim()) return item.full_name.trim();
          if (item.name && item.name.trim()) return item.name.trim();
          const first = item.first_name || "";
          const last = item.last_name || "";
          return `${first} ${last}`.trim();
        }
        return "";
      })
      .filter((name) => name.length > 0);

    if (list.length > 0) return list;
  }

  const rawStr = typeof authors === "string" ? authors : (fallback || "");
  if (rawStr && rawStr.trim()) {
    return rawStr
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  return [];
}

interface AuthorsDisplayProps {
  authors: RawAuthorsInput;
  fallbackName?: string;
  bookTitle?: string;
  maxVisible?: number;
  className?: string;
  badgeClassName?: string;
  variant?: "table" | "card" | "inline";
  showIcon?: boolean;
}

export function AuthorsDisplay({
  authors,
  fallbackName,
  bookTitle,
  maxVisible = 2,
  className = "",
  badgeClassName = "",
  variant = "inline",
  showIcon = false,
}: AuthorsDisplayProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  const authorsList = useMemo(
    () => normalizeAuthorsList(authors, fallbackName),
    [authors, fallbackName]
  );

  const total = authorsList.length;

  if (total === 0) {
    return (
      <span className={`text-foreground-muted ${className}`}>
        {fallbackName || "Auteur non renseigné"}
      </span>
    );
  }

  // Filtrage pour la modale
  const filteredAuthors = useMemo(() => {
    if (!searchQuery.trim()) return authorsList;
    const q = searchQuery.toLowerCase();
    return authorsList.filter((a) => a.toLowerCase().includes(q));
  }, [authorsList, searchQuery]);

  const handleCopyAll = () => {
    const text = authorsList.join(", ");
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`Liste des ${total} auteurs copiée dans le presse-papier.`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const visibleAuthors = authorsList.slice(0, maxVisible);
  const remainingCount = total - maxVisible;
  const hasMore = remainingCount > 0;

  return (
    <>
      <span className={`inline-flex flex-wrap items-center gap-1 ${className}`}>
        {showIcon && <User className="w-3.5 h-3.5 text-foreground-muted shrink-0" />}
        <span>{visibleAuthors.join(", ")}</span>

        {hasMore && (
          <button
            type="button"
            onClick={handleOpenModal}
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gold/15 hover:bg-gold/25 text-navy border border-gold/40 text-[11px] font-semibold transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 ${badgeClassName}`}
            title={`Voir les ${total} auteurs au complet`}
          >
            <Users className="w-3 h-3 text-gold shrink-0" />
            <span>+{remainingCount} autres</span>
          </button>
        )}
      </span>

      {/* Modale d'affichage exhaustif de tous les auteurs */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="authors-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/70 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-background border border-border rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bouton Fermer */}
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-foreground-muted hover:text-navy hover:bg-background-secondary transition-colors cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* En-tête */}
            <div className="space-y-1.5 pr-8">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-gold px-2.5 py-0.5 rounded-md bg-gold/10 border border-gold/30 inline-flex items-center gap-1">
                  <Users className="w-3 h-3 text-gold" />
                  Collectif d&apos;auteurs
                </span>
                <span className="text-xs text-foreground-muted font-medium">
                  {total} chercheur{total > 1 ? "s" : ""} au total
                </span>
              </div>

              <h3
                id="authors-modal-title"
                className="font-serif font-bold text-xl text-navy"
              >
                Auteurs & Contributeurs
              </h3>

              {bookTitle && (
                <p className="text-xs text-foreground-muted font-sans line-clamp-2 flex items-start gap-1.5 pt-0.5">
                  <BookOpen className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
                  <span>{bookTitle}</span>
                </p>
              )}
            </div>

            {/* Barre de recherche interne si beaucoup d'auteurs */}
            {total > 6 && (
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un auteur par nom..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-background-secondary border border-border focus:border-gold focus:outline-none text-foreground placeholder:text-foreground-muted"
                />
              </div>
            )}

            {/* Liste complète défilante */}
            <div className="max-h-[340px] overflow-y-auto pr-1 space-y-2 divide-y divide-border/40">
              {filteredAuthors.length === 0 ? (
                <div className="py-8 text-center text-xs text-foreground-muted">
                  Aucun auteur ne correspond à « {searchQuery} »
                </div>
              ) : (
                filteredAuthors.map((authorName, index) => {
                  const originalIndex = authorsList.indexOf(authorName) + 1;
                  const isFirst = originalIndex === 1;

                  return (
                    <div
                      key={`${authorName}-${index}`}
                      className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[11px] shrink-0 font-bold ${
                            isFirst
                              ? "bg-navy text-gold border border-gold/40"
                              : "bg-background-secondary text-foreground-muted border border-border"
                          }`}
                        >
                          {originalIndex}
                        </span>
                        <span className={`truncate font-medium ${isFirst ? "text-navy font-semibold" : "text-foreground"}`}>
                          {authorName}
                        </span>
                      </div>

                      {isFirst && (
                        <span className="text-[10px] font-bold text-gold bg-gold/10 px-2 py-0.5 rounded border border-gold/30 shrink-0">
                          Premier auteur
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Pied de modale : Actions */}
            <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleCopyAll}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border hover:border-gold bg-background-secondary hover:bg-background text-navy text-xs font-semibold transition-colors cursor-pointer"
                title="Copier la liste de tous les auteurs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-gold" />
                    <span>Copier la liste</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold transition-all cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
