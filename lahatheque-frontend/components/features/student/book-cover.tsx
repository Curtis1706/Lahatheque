"use client";

import React from "react";
import { GraduationCap, BookOpen } from "lucide-react";
import { ClientBookAccess } from "@/lib/types/student";
import { cn } from "@/lib/utils";

interface BookCoverProps {
  book: Partial<ClientBookAccess> & {
    title: string;
    author?: string;
    discipline?: string;
    discipline_name?: string;
    cover_url?: string;
    edition_year?: number;
  };
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function BookCover({ book, className, size = "md" }: BookCoverProps) {
  const sizeClasses = {
    sm: "w-16 h-22 text-[8px]",
    md: "w-24 h-32 sm:w-28 sm:h-38 text-[9px] sm:text-[10px]",
    lg: "w-32 h-44 sm:w-40 sm:h-56 text-xs",
    xl: "w-44 h-60 sm:w-52 sm:h-72 text-sm",
  };

  const hasImageCover = Boolean(book.cover_url);
  const discipline = book.discipline || book.discipline_name || "ACADÉMIQUE";
  const authorName = book.author || "Auteur";

  return (
    <div
      className={cn(
        "relative rounded-r-xl rounded-l-xs overflow-hidden shadow-md flex flex-col justify-between select-none transition-transform group-hover:scale-[1.02] shrink-0 border border-border bg-navy-dark text-white",
        sizeClasses[size],
        className
      )}
    >
      {/* Reliure tranche livre sur la gauche */}
      <div className="absolute top-0 bottom-0 left-0 w-2.5 bg-navy-dark border-r border-border z-20 pointer-events-none" />

      {hasImageCover ? (
        <img
          src={book.cover_url}
          alt={book.title}
          className="w-full h-full object-cover absolute inset-0 z-10"
        />
      ) : (
        <div className="flex flex-col justify-between h-full p-3 relative z-10 bg-navy">
          {/* Discipline en haut */}
          <div className="pl-2 space-y-0.5 relative z-10">
            <div className="flex items-center justify-between gap-1">
              <span className="font-mono text-[8px] uppercase tracking-widest text-gold font-bold truncate max-w-[80%]">
                {discipline.split(" ")[0] || "ACADÉMIQUE"}
              </span>
              <GraduationCap className="w-3 h-3 text-gold shrink-0" />
            </div>
            <div className="h-0.5 w-6 bg-gold rounded" />
          </div>

          {/* Titre & Auteur */}
          <div className="pl-2 space-y-1 my-auto relative z-10">
            <h4 className="font-serif font-bold text-white leading-tight line-clamp-3">
              {book.title}
            </h4>
            <p className="text-[9px] text-foreground-muted truncate">
              {authorName}
            </p>
          </div>

          {/* Édition & Icône */}
          <div className="pl-2 pt-1 border-t border-navy-hover flex items-center justify-between text-[8px] text-foreground-muted relative z-20">
            <span>Éd. {book.edition_year || 2026}</span>
            <BookOpen className="w-2.5 h-2.5 text-gold" />
          </div>
        </div>
      )}
    </div>
  );
}
