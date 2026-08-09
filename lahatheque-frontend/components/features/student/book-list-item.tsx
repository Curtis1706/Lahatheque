"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bookmark, Clock, ArrowUpRight, CheckCircle2, Sparkles, BookOpen } from "lucide-react";
import { StudentBookAccess } from "@/lib/types/student";
import { BookCover } from "./book-cover";
import { cn } from "@/lib/utils";

interface BookListItemProps {
  book: StudentBookAccess;
  onToggleFavorite?: (id: string) => void;
  className?: string;
}

export function BookListItem({ book, onToggleFavorite, className }: BookListItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "group bg-background border border-border hover:border-gold/60 rounded-2xl p-4 transition-all duration-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs w-full min-w-0",
        className
      )}
    >
      {/* Left: 3D Book Cover & Book Details */}
      <div className="flex items-center gap-4 min-w-0 w-full md:w-auto flex-1">
        <BookCover book={book} size="sm" />

        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gold px-2 py-0.5 rounded-md bg-navy/5 border border-gold/30 shrink-0">
              {book.discipline}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-navy font-medium bg-background-secondary px-2 py-0.5 rounded-md border border-border truncate">
              <CheckCircle2 className="w-3 h-3 text-gold shrink-0" />
              {book.institution}
            </span>
            {book.is_recommended && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-navy bg-gold/15 px-2 py-0.5 rounded-md border border-gold/30 shrink-0">
                <Sparkles className="w-3 h-3 text-gold" />
                Recommandé
              </span>
            )}
          </div>

          <h3 className="font-serif font-bold text-navy text-base lg:text-lg leading-snug group-hover:text-gold transition-colors line-clamp-1">
            {book.title}
          </h3>
          <p className="text-xs text-foreground-muted font-medium truncate">
            Par <span className="text-navy font-semibold">{book.author}</span> • {book.page_count} pages • Édition {book.edition_year}
          </p>
        </div>
      </div>

      {/* Middle: Progress info (hidden on small mobile, visible on sm) */}
      <div className="w-full md:w-48 space-y-1 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-border">
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
          <p className="text-[10px] text-foreground-muted truncate italic">
            {book.last_read_chapter}
          </p>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 self-end md:self-center shrink-0 w-full md:w-auto justify-end border-t md:border-t-0 pt-2 md:pt-0 border-border">
        {onToggleFavorite && (
          <button
            onClick={() => onToggleFavorite(book.id)}
            title={book.is_favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            className={cn(
              "p-2 rounded-xl border border-border transition-colors",
              book.is_favorite ? "text-gold bg-gold/10 border-gold/30" : "text-foreground-muted hover:text-gold"
            )}
          >
            <Bookmark className="w-4 h-4 fill-current" />
          </button>
        )}

        <Link
          href={`/catalog/reader/${book.id}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors shadow-xs min-h-[40px]"
        >
          Lire l&apos;ouvrage
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </motion.div>
  );
}
