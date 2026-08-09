"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { History, BookOpen, Clock, FileText, ArrowUpRight, GraduationCap, Sparkles, CheckCircle2 } from "lucide-react";
import { getReadingHistory, getBorrowedBooks } from "@/lib/services/student";
import { StudentReadingHistory, StudentBookAccess } from "@/lib/types/student";
import { BookCover } from "@/components/features/student/book-cover";
import { EmptyState, EmptyIcon, EmptyTitle, EmptyDescription } from "@/components/ui/empty-state";

export default function StudentHistoryPage() {
  const [history, setHistory] = useState<StudentReadingHistory[]>([]);
  const [booksMap, setBooksMap] = useState<Record<string, StudentBookAccess>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [histData, borrowedData] = await Promise.all([
          getReadingHistory(),
          getBorrowedBooks()
        ]);
        setHistory(histData);

        const bMap: Record<string, StudentBookAccess> = {};
        borrowedData.forEach((b) => {
          bMap[b.id] = b;
        });
        setBooksMap(bMap);
      } catch (err) {
        console.error("Erreur lors du chargement de l'historique de lecture", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto w-full min-w-0">
      {/* Header */}
      <div className="space-y-2 border-b border-border pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy/5 text-navy text-xs font-bold uppercase tracking-wider border border-border">
          <GraduationCap className="w-4 h-4 text-gold" />
          <span>Journal d&apos;Étude Universitaire</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
          Historique de Lecture & Carnet de Notes
        </h1>
        <p className="text-xs sm:text-sm text-foreground-muted max-w-2xl">
          Suivez la chronologie de vos révisions, retrouvez les chapitres d&apos;ouvrages consultés et accédez à vos annotations personnelles.
        </p>
      </div>

      {loading ? (
        <div className="space-y-6 animate-pulse">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-32 bg-background-secondary rounded-2xl border border-border" />
          ))}
        </div>
      ) : history.length === 0 ? (
        <EmptyState>
          <EmptyIcon icon={History} />
          <EmptyTitle>Aucun historique de lecture enregistré</EmptyTitle>
          <EmptyDescription>Vos sessions d&apos;étude et notes de lecture apparaîtront ici automatiquement.</EmptyDescription>
        </EmptyState>
      ) : (
        <div className="relative pl-4 sm:pl-8 space-y-8 before:absolute before:left-2 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-border">
          {history.map((item, index) => {
            const matchedBook = booksMap[item.book_id] || {
              id: item.book_id,
              title: item.book_title,
              author: "Auteur Universitaire",
              discipline: "Droit & Sciences",
              institution: "UAC",
              format: "PDF",
              cover_bg: "bg-navy-dark",
              cover_color: "text-white",
              progress_percent: 50,
              isbn: "978-0000",
              edition_year: 2024,
              page_count: 300,
              is_favorite: false
            };

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: index * 0.1 }}
                className="relative flex flex-col sm:flex-row items-start gap-4 sm:gap-6 bg-background border border-border hover:border-gold/60 p-4 sm:p-6 rounded-2xl shadow-xs transition-all duration-200"
              >
                {/* Glowing Gold Timeline Node */}
                <div className="absolute -left-4 sm:-left-8 top-6 w-3 h-3 rounded-full bg-gold ring-4 ring-background border border-navy shadow-xs" />

                {/* 3D Book Cover Visual */}
                <div className="shrink-0 self-center sm:self-start">
                  <BookCover book={matchedBook} size="sm" />
                </div>

                {/* Event Metadata & Notes */}
                <div className="flex-1 space-y-3 min-w-0 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gold px-2 py-0.5 rounded bg-navy/5 border border-gold/30">
                        {matchedBook.discipline}
                      </span>
                      <h3 className="font-serif font-bold text-navy text-base sm:text-lg leading-snug truncate pt-1">
                        {item.book_title}
                      </h3>
                    </div>
                    <span className="text-[11px] text-foreground-muted font-medium flex items-center gap-1 shrink-0">
                      <Clock className="w-3.5 h-3.5 text-gold shrink-0" />
                      {item.read_at}
                    </span>
                  </div>

                  {/* Chapter info & Notes Badge */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-navy">
                      <BookOpen className="w-4 h-4 text-gold shrink-0" />
                      <span className="truncate">{item.chapter_title}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-foreground-muted">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-background-secondary px-2.5 py-1 rounded-md border border-border">
                        <FileText className="w-3.5 h-3.5 text-gold shrink-0" />
                        {item.notes_count} annotation(s) prise(s)
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-navy">
                        <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                        Session validée
                      </span>
                    </div>
                  </div>

                  {/* Action Link */}
                  <div className="pt-2 flex justify-end">
                    <Link
                      href={`/catalog/reader/${item.book_id}`}
                      className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors inline-flex items-center gap-1.5 min-h-[38px]"
                    >
                      Reprendre la lecture
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
