"use client";

import React from "react";
import { GraduationCap, BookOpen } from "lucide-react";
import { StudentBookAccess } from "@/lib/types/student";
import { cn } from "@/lib/utils";

interface BookCoverProps {
  book: StudentBookAccess & { cover_url?: string };
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function BookCover({ book, className, size = "md" }: BookCoverProps) {
  const sizeClasses = {
    sm: "w-16 h-24 text-[8px]",
    md: "w-24 h-32 sm:w-28 sm:h-40 text-[9px] sm:text-[10px]",
    lg: "w-28 h-36 sm:w-36 sm:h-48 lg:w-40 lg:h-52 text-xs",
  };

  const hasImageCover = Boolean(book.cover_url);

  return (
    <div
      className={cn(
        "relative rounded-r-xl rounded-l-xs overflow-hidden shadow-md flex flex-col justify-between select-none transition-transform group-hover:scale-[1.02] shrink-0 border border-navy/20",
        book.cover_bg || "bg-navy-dark",
        book.cover_color || "text-white",
        sizeClasses[size],
        className
      )}
    >
      {/* 3D Book Spine Effect on the left */}
      <div className="absolute top-0 bottom-0 left-0 w-2.5 bg-black/40 border-r border-white/10 z-20 pointer-events-none" />

      {/* 3D Drop Shadow overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/10 pointer-events-none z-20" />

      {hasImageCover ? (
        <img
          src={book.cover_url}
          alt={book.title}
          className="w-full h-full object-cover absolute inset-0 z-10"
        />
      ) : (
        <div className="flex flex-col justify-between h-full p-2.5 sm:p-3 relative z-10">
          {/* Decorative Top Crest & Discipline */}
          <div className="pl-2 space-y-0.5 relative z-10">
            <div className="flex items-center justify-between gap-1">
              <span className="font-mono text-[8px] uppercase tracking-widest text-gold font-bold truncate max-w-[80%]">
                {book.discipline?.split(" ")[0] || "ACADÉMIQUE"}
              </span>
              <GraduationCap className="w-3 h-3 text-gold/80 shrink-0" />
            </div>
            <div className="h-0.5 w-5 bg-gold/40 rounded" />
          </div>

          {/* Center Title & Author */}
          <div className="pl-2 space-y-1 my-auto relative z-10">
            <h4 className="font-serif font-bold text-white leading-tight line-clamp-3">
              {book.title}
            </h4>
            <p className="text-[9px] text-white/70 truncate">
              {book.author}
            </p>
          </div>

          {/* Bottom Edition & Icon */}
          <div className="pl-2 pt-1 border-t border-white/10 flex items-center justify-between text-[8px] text-white/60 relative z-20">
            <span>Éd. {book.edition_year || 2026}</span>
            <BookOpen className="w-2.5 h-2.5 text-gold" />
          </div>
        </div>
      )}
    </div>
  );
}
