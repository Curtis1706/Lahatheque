"use client";

import React, { useState } from "react";
import { GraduationCap, BookOpen } from "lucide-react";
import { ClientBookAccess } from "@/lib/types/student";
import { cn } from "@/lib/utils";

interface BookCoverProps {
  book: Partial<ClientBookAccess> & {
    title: string;
    id?: string;
    author?: string;
    authors?: Array<{ full_name?: string; first_name?: string; last_name?: string }>;
    discipline?: string;
    discipline_name?: string;
    cover_url?: string;
    edition_year?: number;
    publication_date?: string;
  };
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

export function BookCover({ book, className, size = "md" }: BookCoverProps) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    xs: "w-12 h-16 text-[7px]",
    sm: "w-16 h-22 text-[8px]",
    md: "w-20 h-28 sm:w-24 sm:h-32 text-[9px] sm:text-[10px]",
    lg: "w-32 h-44 sm:w-40 sm:h-56 text-xs",
    xl: "w-44 h-60 sm:w-52 sm:h-72 text-sm",
  };

  const coverUrl = book.cover_url || (book.id ? `/api/bff/catalog/books/${book.id}/cover/` : "");
  const hasImageCover = Boolean(coverUrl) && !imageError;
  const discipline = book.discipline || book.discipline_name || "ACADÉMIQUE";
  const authorName =
    book.author ||
    book.authors?.map((a) => a.full_name || `${a.first_name || ""} ${a.last_name || ""}`.trim()).join(", ") ||
    "Auteur académique";

  const year = book.edition_year || (book.publication_date ? new Date(book.publication_date).getFullYear() : 2026);

  return (
    <div
      className={cn(
        "relative rounded-r-xl rounded-l-xs overflow-hidden shadow-md flex flex-col justify-between select-none transition-transform group-hover:scale-[1.02] shrink-0 border border-border bg-navy-dark text-white",
        sizeClasses[size],
        className
      )}
    >
      {/* Reliure tranche livre sur la gauche */}
      <div className="absolute top-0 bottom-0 left-0 w-2 bg-navy-dark/90 border-r border-border/80 z-20 pointer-events-none" />

      {hasImageCover ? (
        <img
          src={coverUrl}
          alt={book.title}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover absolute inset-0 z-10"
          loading="lazy"
        />
      ) : (
        <div className="flex flex-col justify-between h-full p-2.5 sm:p-3 relative z-10 bg-navy">
          {/* Discipline en haut */}
          <div className="pl-1.5 space-y-0.5 relative z-10">
            <div className="flex items-center justify-between gap-1">
              <span className="font-mono text-[7px] sm:text-[8px] uppercase tracking-widest text-gold font-bold truncate max-w-[80%]">
                {discipline.split(" ")[0] || "ACADÉMIQUE"}
              </span>
              <GraduationCap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gold shrink-0" />
            </div>
            <div className="h-0.5 w-5 bg-gold rounded" />
          </div>

          {/* Titre & Auteur */}
          <div className="pl-1.5 space-y-0.5 my-auto relative z-10">
            <h4 className="font-serif font-bold text-white leading-tight line-clamp-3">
              {book.title}
            </h4>
            <p className="text-[8px] sm:text-[9px] text-foreground-muted truncate">
              {authorName}
            </p>
          </div>

          {/* Édition & Icône */}
          <div className="pl-1.5 pt-1 border-t border-navy-hover flex items-center justify-between text-[7px] sm:text-[8px] text-foreground-muted relative z-20">
            <span>Éd. {year}</span>
            <BookOpen className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-gold" />
          </div>
        </div>
      )}
    </div>
  );
}
