"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, Search, Filter, GraduationCap } from "lucide-react";
import { getBorrowedBooks } from "@/lib/services/student";
import { StudentBookAccess } from "@/lib/types/student";
import { BookCard } from "@/components/features/student/book-card";
import { BookListItem } from "@/components/features/student/book-list-item";
import { ViewToggle, ViewMode } from "@/components/features/student/view-toggle";
import { EmptyState, EmptyIcon, EmptyTitle, EmptyDescription } from "@/components/ui/empty-state";

export default function StudentBooksPage() {
  const [books, setBooks] = useState<StudentBookAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  useEffect(() => {
    async function loadBooks() {
      try {
        setLoading(true);
        const data = await getBorrowedBooks();
        setBooks(data);
      } catch (err) {
        console.error("Erreur lors du chargement des livres", err);
      } finally {
        setLoading(false);
      }
    }
    loadBooks();
  }, []);

  const disciplines = Array.from(new Set(books.map((b) => b.discipline)));

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.institution.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDiscipline = selectedDiscipline === "all" || book.discipline === selectedDiscipline;
    return matchesSearch && matchesDiscipline;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold">
            <GraduationCap className="w-4 h-4" />
            <span>Bibliothèque Universitaire</span>
          </div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-navy">
            Mes Ouvrages & Manuels de Cours
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted">
            Accédez à l&apos;ensemble de vos livres universitaires souscrits via votre établissement.
          </p>
        </div>

        <Link
          href="/student/catalog"
          className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 self-start md:self-auto shrink-0 min-h-[44px]"
        >
          <BookOpen className="w-4 h-4" />
          Explorer le catalogue universitaire
        </Link>
      </div>

      {/* Barre de Recherche, Filtres & Toggle Grille/Liste */}
      <div className="bg-background border border-border p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between shadow-xs">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <input
            type="text"
            placeholder="Rechercher un ouvrage, auteur, discipline..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background-secondary border border-border text-sm focus:outline-none focus:border-gold transition-colors text-foreground min-h-[44px]"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs text-foreground-muted font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Discipline :</span>
            <select
              value={selectedDiscipline}
              onChange={(e) => setSelectedDiscipline(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-background-secondary border border-border text-xs font-medium text-foreground focus:outline-none focus:border-gold min-h-[44px]"
            >
              <option value="all">Toutes les disciplines</option>
              {disciplines.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {/* Grille ou Liste d'ouvrages Mobile-First */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="bg-background-secondary h-64 rounded-2xl border border-border" />
          ))}
        </div>
      ) : filteredBooks.length === 0 ? (
        <EmptyState>
          <EmptyIcon icon={BookOpen} />
          <EmptyTitle>Aucun ouvrage ne correspond à votre recherche</EmptyTitle>
          <EmptyDescription>Essayez de réinitialiser vos filtres ou effectuez une recherche différente.</EmptyDescription>
        </EmptyState>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBooks.map((book) => (
            <BookListItem key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
