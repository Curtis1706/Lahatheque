"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bookmark, Clock, ArrowUpRight, CheckCircle2, Sparkles } from "lucide-react";
import { StudentBookAccess } from "@/lib/types/student";
import { BookCover } from "./book-cover";
import { cn } from "@/lib/utils";

interface BookCardProps {
  book: StudentBookAccess;
  onToggleFavorite?: (id: string) => void;
  className?: string;
}

export function BookCard({ book, onToggleFavorite, className }: BookCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "group bg-background border border-border hover:border-gold/60 rounded-2xl p-4 sm:p-5 transition-all duration-200 flex flex-col sm:flex-row gap-4 sm:gap-5 justify-between shadow-xs w-full min-w-0 overflow-hidden",
        className
      )}
    >
      {/* 3D Book Cover Visual (Centered on mobile) */}
      <div className="flex justify-center sm:justify-start shrink-0">
        <BookCover book={book} size="md" />
      </div>

      {/* Book Metadata & Actions */}
      <div className="flex-1 flex flex-col justify-between space-y-3 min-w-0">
        <div className="space-y-2">
          {/* Top Discipline & Favorite */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gold px-2.5 py-0.5 rounded-md bg-navy/5 border border-gold/30 truncate max-w-[80%]">
              {book.discipline}
            </span>
            {onToggleFavorite && (
              <button
                onClick={() => onToggleFavorite(book.id)}
                title={book.is_favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                className={cn(
                  "p-1 rounded-full transition-colors shrink-0",
                  book.is_favorite ? "text-gold" : "text-foreground-muted hover:text-gold"
                )}
              >
                <Bookmark className="w-4 h-4 fill-current" />
              </button>
            )}
          </div>

          {/* Title & Author */}
          <div className="space-y-0.5">
            <h3 className="font-serif font-bold text-navy text-base lg:text-lg leading-snug group-hover:text-gold transition-colors line-clamp-2">
              {book.title}
            </h3>
            <p className="text-xs text-foreground-muted font-medium truncate">
              Par <span className="text-navy font-semibold">{book.author}</span> • {book.page_count} pages
            </p>
          </div>

          {/* Institution & Recommendation */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-navy font-medium bg-background-secondary px-2 py-0.5 rounded-lg border border-border truncate max-w-full">
              <CheckCircle2 className="w-3 h-3 text-gold shrink-0" />
              <span className="truncate">{book.institution}</span>
            </span>
            {book.is_recommended && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-navy bg-gold/15 px-2 py-0.5 rounded-md border border-gold/30 shrink-0">
                <Sparkles className="w-3 h-3 text-gold" />
                Recommandé {book.course_code}
              </span>
            )}
          </div>

          {/* Reading Progress Bar */}
          {book.progress_percent !== undefined && (
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-foreground-muted font-medium">Progression</span>
                <span className="font-bold text-navy">{book.progress_percent}%</span>
              </div>
              <div className="w-full bg-background-secondary h-2 rounded-full overflow-hidden border border-border">
                <div
                  className="bg-navy h-full rounded-full transition-all duration-300"
                  style={{ width: `${book.progress_percent}%` }}
                />
              </div>
              {book.last_read_chapter && (
                <p className="text-[11px] text-foreground-muted truncate italic">
                  {book.last_read_chapter}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-border flex items-center justify-between gap-2 text-xs flex-wrap">
          {book.expiresInDays !== undefined ? (
            <span className="text-foreground-muted flex items-center gap-1 text-[11px] shrink-0">
              <Clock className="w-3.5 h-3.5 text-gold shrink-0" />
              {book.expiresInDays}j restants
            </span>
          ) : (
            <span className="text-[11px] text-foreground-muted shrink-0">ISBN: {book.isbn}</span>
          )}

          <Link
            href={`/catalog/reader/${book.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors shadow-xs ml-auto min-h-[38px]"
          >
            Lire l&apos;ouvrage
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
