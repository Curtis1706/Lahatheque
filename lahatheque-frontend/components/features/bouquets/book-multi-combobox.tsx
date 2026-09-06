"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Search,
  BookOpen,
  ChevronDown,
  Check,
  X,
  RotateCcw,
  Sparkles,
  Layers,
} from "lucide-react";
import { Book } from "@/lib/types/catalog";
import { BookCover3D } from "@/components/ui/book-cover-3d";

export interface BookMultiComboboxProps {
  books: Book[];
  selectedBookIds: string[];
  onChange: (selectedIds: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function BookMultiCombobox({
  books,
  selectedBookIds,
  onChange,
  placeholder = "Rechercher et sélectionner des ouvrages...",
  className = "",
}: BookMultiComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isExpandedPreview, setIsExpandedPreview] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fermer le dropdown lors d'un clic à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Autofocus dans le champ de recherche à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Map des livres par ID pour un accès O(1)
  const booksMap = useMemo(() => {
    const map = new Map<string, Book>();
    books.forEach((b) => map.set(b.id, b));
    return map;
  }, [books]);

  // Livres actuellement sélectionnés
  const selectedBooks = useMemo(() => {
    return selectedBookIds
      .map((id) => booksMap.get(id))
      .filter((b): b is Book => Boolean(b));
  }, [selectedBookIds, booksMap]);

  // Filtrage des livres disponibles selon la recherche
  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return books;
    const q = searchQuery.toLowerCase().trim();
    return books.filter((b) => {
      const matchTitle = b.title?.toLowerCase().includes(q);
      const matchIsbn = b.isbn?.toLowerCase().includes(q);
      const matchDiscipline = b.discipline_detail?.name?.toLowerCase().includes(q);
      const matchInstitution = b.institution_name?.toLowerCase().includes(q);
      const matchAuthor = b.authors_details?.some(
        (a) =>
          a.first_name.toLowerCase().includes(q) ||
          a.last_name.toLowerCase().includes(q)
      );
      return (
        matchTitle ||
        matchIsbn ||
        matchDiscipline ||
        matchInstitution ||
        matchAuthor
      );
    });
  }, [books, searchQuery]);

  const toggleBook = (bookId: string) => {
    if (selectedBookIds.includes(bookId)) {
      onChange(selectedBookIds.filter((id) => id !== bookId));
    } else {
      onChange([...selectedBookIds, bookId]);
    }
  };

  const removeBook = (bookId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedBookIds.filter((id) => id !== bookId));
  };

  const clearAll = () => {
    onChange([]);
  };

  // Formatage propre des auteurs
  const formatAuthors = (b: Book) => {
    if (b.authors_details && b.authors_details.length > 0) {
      return b.authors_details
        .map((a) => `${a.first_name} ${a.last_name}`.trim())
        .join(", ");
    }
    return "Auteur Partenaire";
  };

  // Seuil d'affichage compact avant accordéon
  const MAX_COLLAPSED_TAGS = 4;
  const hasOverflowTags = selectedBooks.length > MAX_COLLAPSED_TAGS;
  const visibleSelectedBooks = isExpandedPreview
    ? selectedBooks
    : selectedBooks.slice(0, MAX_COLLAPSED_TAGS);

  return (
    <div ref={containerRef} className={`space-y-2.5 relative ${className}`}>
      {/* ── En-tête de contrôle : Compteur & Action rapide ──────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-navy flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-gold" />
            Sélection des Ouvrages du Bouquet
          </label>
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-mono font-bold bg-gold/15 text-navy border border-gold/30">
            <Check className="w-3 h-3 text-gold" />
            {selectedBookIds.length} sélectionné{selectedBookIds.length > 1 ? "s" : ""}
          </span>
        </div>

        {selectedBookIds.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-[11px] font-semibold text-foreground-muted hover:text-error transition-colors inline-flex items-center gap-1 cursor-pointer"
            title="Désélectionner tous les livres"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Tout désélectionner</span>
          </button>
        )}
      </div>

      {/* ── Déclencheur Combobox (Trigger) ─────────────────────────────────── */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className={`w-full p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 bg-background ${
          isOpen
            ? "border-navy ring-2 ring-navy/10 shadow-sm"
            : "border-border hover:border-gold shadow-2xs"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-xl bg-navy/5 flex items-center justify-center text-navy shrink-0">
            <BookOpen className="w-4 h-4 text-gold" />
          </div>

          <div className="min-w-0 flex-1">
            {selectedBookIds.length === 0 ? (
              <span className="text-xs text-foreground-muted truncate block">
                {placeholder}
              </span>
            ) : (
              <p className="text-xs font-semibold text-navy truncate">
                {selectedBookIds.length} ouvrage{selectedBookIds.length > 1 ? "s" : ""}{" "}
                inclus dans ce bouquet
                <span className="text-[10px] text-foreground-muted font-normal ml-2">
                  (Cliquer pour modifier la sélection)
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <ChevronDown
            className={`w-4 h-4 text-foreground-muted transition-transform duration-200 ${
              isOpen ? "rotate-180 text-navy" : ""
            }`}
          />
        </div>
      </div>

      {/* ── Menu Déroulant (Popover Flottant) ───────────────────────────────── */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1.5 p-3 rounded-2xl bg-background border border-border shadow-xl space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
          {/* Barre de Recherche intégrée avec icône & autofocus */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par titre, auteur, discipline ou ISBN..."
              className="w-full pl-8.5 pr-8 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy min-h-[38px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-navy cursor-pointer p-1"
                title="Effacer la recherche"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Compteur rapide de résultats */}
          <div className="flex items-center justify-between text-[10px] text-foreground-muted px-1">
            <span>
              {filteredBooks.length} ouvrage{filteredBooks.length > 1 ? "s" : ""} disponible{filteredBooks.length > 1 ? "s" : ""}
            </span>
            <span className="font-semibold text-navy">
              {selectedBookIds.length} coché{selectedBookIds.length > 1 ? "s" : ""}
            </span>
          </div>

          {/* Liste Scrollable des Livres avec Couvertures Réelles */}
          <div className="max-h-64 sm:max-h-72 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            {filteredBooks.length === 0 ? (
              <div className="py-6 text-center space-y-1">
                <BookOpen className="w-6 h-6 text-foreground-muted/50 mx-auto" />
                <p className="text-xs text-foreground-muted">
                  Aucun ouvrage ne correspond à « {searchQuery} ».
                </p>
              </div>
            ) : (
              filteredBooks.map((b) => {
                const isSelected = selectedBookIds.includes(b.id);
                const authors = formatAuthors(b);
                const cover = b.cover_url || b.cover_image;

                return (
                  <div
                    key={b.id}
                    onClick={() => toggleBook(b.id)}
                    className={`flex items-center justify-between gap-3 p-2 sm:p-2.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-gold/10 border-gold shadow-2xs"
                        : "bg-background-secondary border-border/80 hover:border-gold/50 hover:bg-background"
                    }`}
                  >
                    {/* Case à cocher & Couverture Réelle du Livre */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Checkbox stylisée */}
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center border shrink-0 transition-colors ${
                          isSelected
                            ? "bg-navy border-navy text-white"
                            : "border-border bg-background"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-gold" />}
                      </div>

                      {/* Couverture Réelle du Livre (Book Cover 3D format xs) */}
                      <div className="shrink-0 flex items-center justify-center">
                        <BookCover3D
                          title={b.title}
                          authors={authors}
                          discipline={b.discipline_detail?.name || b.institution_name}
                          coverUrl={cover}
                          size="xs"
                          interactive={false}
                        />
                      </div>

                      {/* Métadonnées du Livre */}
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <p className="font-serif font-bold text-xs text-navy leading-snug line-clamp-1" title={b.title}>
                          {b.title}
                        </p>
                        <p className="text-[10px] text-foreground-muted line-clamp-1">
                          {authors}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          {b.discipline_detail?.name && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-navy/5 text-navy font-semibold border border-border">
                              {b.discipline_detail.name}
                            </span>
                          )}
                          {b.institution_name && (
                            <span className="text-[9px] text-foreground-muted truncate max-w-[140px]">
                              {b.institution_name}
                            </span>
                          )}
                          {b.isbn && (
                            <span className="text-[9px] font-mono text-foreground-muted">
                              ISBN {b.isbn}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Prix & Statut à droite */}
                    <div className="text-right shrink-0">
                      {b.price ? (
                        <span className="font-mono font-bold text-xs text-navy block">
                          {b.price.toLocaleString("fr-FR")} {b.currency || "XOF"}
                        </span>
                      ) : null}
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider block ${
                          isSelected ? "text-gold font-bold" : "text-foreground-muted"
                        }`}
                      >
                        {isSelected ? "Inclus" : "Cliquer pour inclure"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── Aperçu Compact et Non-Encombrant des Ouvrages Sélectionnés ───────── */}
      {selectedBooks.length > 0 && (
        <div className="p-3 rounded-2xl bg-background-secondary border border-border space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-navy">
              Ouvrages inclus dans ce bouquet ({selectedBooks.length}) :
            </span>

            {hasOverflowTags && (
              <button
                type="button"
                onClick={() => setIsExpandedPreview(!isExpandedPreview)}
                className="text-xs font-semibold text-gold hover:text-gold-dark underline cursor-pointer"
              >
                {isExpandedPreview
                  ? "Réduire l'affichage"
                  : `+ ${selectedBooks.length - MAX_COLLAPSED_TAGS} autre${
                      selectedBooks.length - MAX_COLLAPSED_TAGS > 1 ? "s" : ""
                    } ouvrage${
                      selectedBooks.length - MAX_COLLAPSED_TAGS > 1 ? "s" : ""
                    }`}
              </button>
            )}
          </div>

          {/* Grille compacte de badges miniatures avec Book Cover */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
            {visibleSelectedBooks.map((b) => {
              const authors = formatAuthors(b);
              const cover = b.cover_url || b.cover_image;

              return (
                <div
                  key={b.id}
                  className="flex items-center justify-between gap-2 p-1.5 pr-2 rounded-xl bg-background border border-gold/40 shadow-2xs group"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {/* Miniature de couverture ultra-compacte */}
                    <div className="w-7 h-10 shrink-0 rounded overflow-hidden shadow-xs border border-border/80 bg-navy">
                      {cover ? (
                        <img
                          src={cover}
                          alt={b.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-0.5 text-[6px] text-gold font-serif font-bold text-center leading-tight">
                          {b.title.slice(0, 8)}
                        </div>
                      )}
                    </div>

                    {/* Titre & Auteur condensés */}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-navy truncate" title={b.title}>
                        {b.title}
                      </p>
                      <p className="text-[10px] text-foreground-muted truncate">
                        {authors}
                      </p>
                    </div>
                  </div>

                  {/* Bouton pour retirer directement sans ouvrir la combobox */}
                  <button
                    type="button"
                    onClick={(e) => removeBook(b.id, e)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-foreground-muted hover:text-error hover:bg-error/10 transition-colors shrink-0 cursor-pointer"
                    title={`Retirer « ${b.title} » du bouquet`}
                    aria-label={`Retirer « ${b.title} »`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
