"use client";

import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
  itemLabel?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [6, 9, 12, 24],
  className,
  itemLabel = "ouvrages",
}: PaginationProps) {
  if (totalPages <= 1 && (!totalItems || totalItems <= (pageSize || 9))) {
    return null;
  }

  // Calcul des numéros de page visibles avec ellipses
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const delta = 1; // Nombre de pages autour de la page active

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    pages.push(1);

    if (currentPage - delta > 2) {
      pages.push("ellipsis");
    }

    const start = Math.max(2, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage + delta < totalPages - 1) {
      pages.push("ellipsis");
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();
  const startItem = pageSize ? (currentPage - 1) * pageSize + 1 : 1;
  const endItem = pageSize && totalItems ? Math.min(currentPage * pageSize, totalItems) : undefined;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border w-full select-none",
        className
      )}
    >
      {/* Compteur & taille de page */}
      <div className="flex items-center gap-3 text-xs text-foreground-muted order-2 sm:order-1">
        {totalItems !== undefined && (
          <p className="font-medium">
            Affichage de <strong className="text-navy">{startItem}</strong> à{" "}
            <strong className="text-navy">{endItem || totalItems}</strong> sur{" "}
            <strong className="text-navy">{totalItems}</strong> {itemLabel}
          </p>
        )}

        {onPageSizeChange && pageSize && (
          <div className="hidden md:flex items-center gap-1.5 ml-2 pl-3 border-l border-border">
            <span className="text-[11px] font-medium text-foreground-muted">Par page :</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-background-secondary border border-border text-navy text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-gold font-bold cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Contrôles de navigation */}
      <div className="flex items-center gap-1.5 order-1 sm:order-2">
        {/* Première page (Desktop) */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          className="hidden sm:inline-flex p-2 rounded-xl border border-border bg-background hover:bg-background-secondary disabled:opacity-30 disabled:pointer-events-none text-navy transition-colors min-h-[44px] min-w-[44px] items-center justify-center cursor-pointer"
          title="Première page"
          aria-label="Première page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Page précédente */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-border bg-background hover:bg-background-secondary disabled:opacity-30 disabled:pointer-events-none text-navy text-xs font-bold transition-colors min-h-[44px] cursor-pointer"
          title="Page précédente"
          aria-label="Page précédente"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Précédent</span>
        </button>

        {/* Indicateur mobile simple */}
        <span className="inline-flex sm:hidden px-3 py-2 text-xs font-bold text-navy bg-background-secondary border border-border rounded-xl min-h-[44px] items-center">
          {currentPage} / {totalPages}
        </span>

        {/* Numéros de page (sm+) */}
        <div className="hidden sm:flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === "ellipsis") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1 text-xs text-foreground-muted font-bold select-none"
                >
                  &hellip;
                </span>
              );
            }

            const isCurrent = p === currentPage;
            return (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => onPageChange(p)}
                className={cn(
                  "min-w-[44px] min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer",
                  isCurrent
                    ? "bg-navy text-white border border-navy shadow-xs scale-105"
                    : "bg-background text-navy border border-border hover:bg-background-secondary hover:border-gold/60"
                )}
                aria-current={isCurrent ? "page" : undefined}
                aria-label={`Page ${p}`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Page suivante */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-border bg-background hover:bg-background-secondary disabled:opacity-30 disabled:pointer-events-none text-navy text-xs font-bold transition-colors min-h-[44px] cursor-pointer"
          title="Page suivante"
          aria-label="Page suivante"
        >
          <span className="hidden sm:inline">Suivant</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Dernière page (Desktop) */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          className="hidden sm:inline-flex p-2 rounded-xl border border-border bg-background hover:bg-background-secondary disabled:opacity-30 disabled:pointer-events-none text-navy transition-colors min-h-[44px] min-w-[44px] items-center justify-center cursor-pointer"
          title="Dernière page"
          aria-label="Dernière page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
