"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAuthorBooks, getAuthorStats } from "@/lib/services/author";
import { AuthorBook, AuthorStats } from "@/lib/types/author";
import { BookOpen, ArrowLeft, Search, Lock } from "lucide-react";
import { AuthorKpiCharts } from "@/components/features/author/author-kpi-charts";
import { BookCard } from "@/components/features/student/book-card";
import { BookListItem } from "@/components/features/student/book-list-item";
import { ViewToggle, ViewMode } from "@/components/features/student/view-toggle";
import { EmptyState, EmptyIcon, EmptyTitle, EmptyDescription } from "@/components/ui/empty-state";
import { StudentBookAccess } from "@/lib/types/student";

export default function AuthorBooksPage() {
  const [books, setBooks] = useState<AuthorBook[]>([]);
  const [stats, setStats] = useState<AuthorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadBooks() {
      try {
        setLoading(true);
        const [booksData, statsData] = await Promise.all([
          getAuthorBooks(),
          getAuthorStats()
        ]);
        setBooks(booksData);
        setStats(statsData);
      } catch (err) {
        console.error("Erreur de chargement des livres auteur", err);
      } finally {
        setLoading(false);
      }
    }
    loadBooks();
  }, []);

  const filteredBooks = books.filter((b) =>
    searchQuery === "" ||
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.discipline.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full min-w-0">
      {/* 1. VISUALISATIONS DE DONNÉES ET KPIS 21st.dev EN PREMIER */}
      {!loading && stats ? (
        <AuthorKpiCharts stats={stats} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="bg-background border border-border p-5 rounded-2xl animate-pulse space-y-3 h-40" />
          ))}
        </div>
      )}

      {/* 2. EN-TÊTE DE PAGE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <Link href="/author" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour au tableau de bord
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold">
            <BookOpen className="w-4 h-4" />
            <span>Catalogue d&apos;Auteur • Ouvrages Publiés</span>
          </div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-navy">
            Mes Livres Publiés & Statistiques
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted max-w-2xl">
            Consultez le nombre de ventes, les téléchargements et les revenus générés par vos ouvrages universitaires.
          </p>
        </div>

        <ViewToggle mode={viewMode} onChange={setViewMode} className="self-end md:self-auto" />
      </div>

      {/* Note d'information sur la gestion exclusive des prix/métadonnées */}
      <div className="bg-navy/5 border border-gold/30 p-4 rounded-2xl flex items-start gap-3 text-xs text-foreground-muted">
        <Lock className="w-4 h-4 text-gold shrink-0 mt-0.5" />
        <div>
          <strong className="text-navy font-semibold block">Gestion des Métadonnées & Prix réservée à l&apos;Édition</strong>
          Conformément au cahier des charges LAHAThèque (section 4.1), la fixation des prix de vente et la classification académique relèvent de l&apos;Administrateur et du Maquettiste.
        </div>
      </div>

      {/* Barre de Recherche */}
      <div className="bg-background border border-border p-3.5 rounded-2xl flex items-center gap-3 shadow-xs">
        <Search className="w-5 h-5 text-foreground-muted shrink-0 ml-1" />
        <input
          type="text"
          placeholder="Rechercher par titre de livre ou discipline..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-sm focus:outline-none text-foreground placeholder:text-foreground-muted min-h-[40px]"
        />
      </div>

      {/* Liste des Livres Publiés */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          <div className="bg-background-secondary h-64 rounded-2xl border border-border" />
          <div className="bg-background-secondary h-64 rounded-2xl border border-border" />
        </div>
      ) : filteredBooks.length === 0 ? (
        <EmptyState>
          <EmptyIcon icon={BookOpen} />
          <EmptyTitle>Aucun livre trouvé</EmptyTitle>
          <EmptyDescription>Aucun ouvrage ne correspond à votre recherche actuelle.</EmptyDescription>
        </EmptyState>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((b) => {
            const bookAccess: StudentBookAccess = {
              id: b.id,
              title: b.title,
              author: b.author,
              discipline: b.discipline,
              institution: b.institution,
              format: b.format,
              cover_bg: b.cover_bg,
              cover_color: b.cover_color,
              progress_percent: 100,
              isbn: b.isbn,
              edition_year: b.edition_year,
              page_count: 380,
              is_favorite: false
            };
            return <BookCard key={b.id} book={bookAccess} />;
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBooks.map((b) => {
            const bookAccess: StudentBookAccess = {
              id: b.id,
              title: b.title,
              author: b.author,
              discipline: b.discipline,
              institution: b.institution,
              format: b.format,
              cover_bg: b.cover_bg,
              cover_color: b.cover_color,
              progress_percent: 100,
              isbn: b.isbn,
              edition_year: b.edition_year,
              page_count: 380,
              is_favorite: false
            };
            return <BookListItem key={b.id} book={bookAccess} />;
          })}
        </div>
      )}
    </div>
  );
}
