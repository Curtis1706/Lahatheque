"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  Bookmark, 
  ArrowUpRight, 
  Sparkles, 
  Search, 
  Play
} from "lucide-react";
import { getBorrowedBooks, getFavoriteBooks, getRecommendedBooks, getStudyStats } from "@/lib/services/student";
import { StudentBookAccess, StudentStudyStats } from "@/lib/types/student";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState, EmptyIcon, EmptyTitle, EmptyDescription } from "@/components/ui/empty-state";
import { BookCard } from "@/components/features/student/book-card";
import { BookListItem } from "@/components/features/student/book-list-item";
import { BookCover } from "@/components/features/student/book-cover";
import { StudentKpiCharts } from "@/components/features/student/student-kpi-charts";
import { ReadingProgress } from "@/components/ui/reading-progress";
import { ViewToggle, ViewMode } from "@/components/features/student/view-toggle";

export default function StudentDashboardPage() {
  const [borrowedBooks, setBorrowedBooks] = useState<StudentBookAccess[]>([]);
  const [favoriteBooks, setFavoriteBooks] = useState<StudentBookAccess[]>([]);
  const [recommendedBooks, setRecommendedBooks] = useState<StudentBookAccess[]>([]);
  const [stats, setStats] = useState<StudentStudyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [borrowed, favorites, recommended, studyStats] = await Promise.all([
          getBorrowedBooks(),
          getFavoriteBooks(),
          getRecommendedBooks(),
          getStudyStats()
        ]);
        setBorrowedBooks(borrowed);
        setFavoriteBooks(favorites);
        setRecommendedBooks(recommended);
        setStats(studyStats);
      } catch (err) {
        console.error("Erreur de chargement du dashboard étudiant", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const activeBook = borrowedBooks.find((b) => b.progress_percent > 0) || borrowedBooks[0];

  const filteredBorrowed = borrowedBooks.filter((book) =>
    searchQuery === "" ||
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.discipline.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background text-foreground py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-8 max-w-7xl mx-auto w-full min-w-0"
    >
      {/* 1. LES KPIS EN PREMIER (Data Visualization Charts par 21st.dev) */}
      {!loading && stats ? (
        <StudentKpiCharts stats={stats} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="bg-background border border-border p-5 rounded-2xl animate-pulse space-y-3 h-40" />
          ))}
        </div>
      )}

      {/* 2. SECTION CONTINUER LA LECTURE (Hero Reader Card avec Couverture 3D & 21st.dev ReadingProgress) */}
      {!loading && activeBook && (
        <div className="bg-navy-dark rounded-3xl p-5 sm:p-8 text-white border border-navy-hover shadow-md relative overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6 w-full lg:w-auto">
            <div className="self-center sm:self-start shrink-0">
              <BookCover book={activeBook} size="lg" />
            </div>

            <div className="space-y-3 max-w-xl min-w-0 w-full">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 text-gold text-xs font-bold uppercase tracking-wider border border-gold/30">
                <Play className="w-3.5 h-3.5 fill-current" />
                Reprendre la lecture
              </div>
              <h2 className="font-serif font-bold text-lg sm:text-xl lg:text-2xl leading-snug">
                {activeBook.title}
              </h2>
              <p className="text-xs sm:text-sm text-white/80">
                Auteur : <span className="text-gold font-semibold">{activeBook.author}</span> • {activeBook.institution}
              </p>
              {activeBook.last_read_chapter && (
                <div className="bg-navy p-3 rounded-xl border border-navy-hover text-xs space-y-1">
                  <span className="text-gold font-medium">Dernière position :</span>
                  <p className="font-semibold text-white truncate">{activeBook.last_read_chapter}</p>
                </div>
              )}
            </div>
          </div>

          <div className="w-full lg:w-80 bg-navy p-4 sm:p-5 rounded-2xl border border-navy-hover space-y-4 shrink-0">
            <div className="space-y-2">
              <span className="text-xs text-white/70 font-medium">Progression d&apos;étude</span>
              <ReadingProgress 
                steps={100}
                words={activeBook.page_count * 250}
                label="Progression du manuel"
              />
            </div>

            <Link
              href={`/catalog/reader/${activeBook.id}`}
              className="w-full py-3 px-4 rounded-xl bg-gold text-navy font-bold text-xs hover:bg-gold/90 transition-colors flex items-center justify-center gap-2 shadow-xs min-h-[44px]"
            >
              Ouvrir le manuel numérique
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* 3. BARRE DE RECHERCHE RAPIDE & TOGGLE GRILLE / LISTE */}
      <div className="bg-background border border-border p-4 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2 shrink-0" />
          <input
            type="text"
            placeholder="Rechercher parmi vos manuels d'étude (ex: Droit, Économie, Prof. Agossou...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-transparent text-sm focus:outline-none text-foreground placeholder:text-foreground-muted min-h-[40px]"
          />
        </div>

        {/* View Toggle (Grille vs Liste) */}
        <ViewToggle mode={viewMode} onChange={setViewMode} className="self-end sm:self-auto" />
      </div>

      {/* 4. ONGLETS DES COLLECTIONS D'OUVRAGES */}
      <Tabs defaultValue="borrowed" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="borrowed" className="gap-2 min-h-[44px]">
            <BookOpen className="w-4 h-4" />
            Mes Manuels & Ouvrages ({loading ? "..." : borrowedBooks.length})
          </TabsTrigger>
          <TabsTrigger value="recommended" className="gap-2 min-h-[44px]">
            <Sparkles className="w-4 h-4" />
            Recommandations Profs ({loading ? "..." : recommendedBooks.length})
          </TabsTrigger>
          <TabsTrigger value="favorites" className="gap-2 min-h-[44px]">
            <Bookmark className="w-4 h-4" />
            Mes Favoris ({loading ? "..." : favoriteBooks.length})
          </TabsTrigger>
        </TabsList>

        {/* Squelette de chargement */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            <div className="bg-background-secondary h-64 rounded-2xl border border-border" />
            <div className="bg-background-secondary h-64 rounded-2xl border border-border" />
            <div className="bg-background-secondary h-64 rounded-2xl border border-border" />
          </div>
        ) : (
          <>
            {/* Contenu Manuels Souscrits (Vue Grille ou Vue Liste) */}
            <TabsContent value="borrowed">
              {filteredBorrowed.length === 0 ? (
                <EmptyState>
                  <EmptyIcon icon={BookOpen} />
                  <EmptyTitle>Aucun ouvrage ne correspond à votre recherche</EmptyTitle>
                  <EmptyDescription>Consultez le catalogue de votre établissement pour souscrire à de nouveaux manuels.</EmptyDescription>
                </EmptyState>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredBorrowed.map((book) => (
                    <BookCard key={book.id} book={book} />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredBorrowed.map((book) => (
                    <BookListItem key={book.id} book={book} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Contenu Recommandations Enseignants */}
            <TabsContent value="recommended">
              {recommendedBooks.length === 0 ? (
                <EmptyState>
                  <EmptyIcon icon={Sparkles} />
                  <EmptyTitle>Aucune recommandation récente</EmptyTitle>
                  <EmptyDescription>Vos enseignants partageront ici les ouvrages recommandés pour vos cours.</EmptyDescription>
                </EmptyState>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendedBooks.map((book) => (
                    <BookCard key={book.id} book={book} />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {recommendedBooks.map((book) => (
                    <BookListItem key={book.id} book={book} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Contenu Favoris */}
            <TabsContent value="favorites">
              {favoriteBooks.length === 0 ? (
                <EmptyState>
                  <EmptyIcon icon={Bookmark} />
                  <EmptyTitle>Aucun favori enregistré</EmptyTitle>
                  <EmptyDescription>Ajoutez des ouvrages à vos favoris depuis le catalogue pour les consulter plus tard.</EmptyDescription>
                </EmptyState>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favoriteBooks.map((book) => (
                    <BookCard key={book.id} book={book} />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {favoriteBooks.map((book) => (
                    <BookListItem key={book.id} book={book} />
                  ))}
                </div>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </motion.div>
  );
}
