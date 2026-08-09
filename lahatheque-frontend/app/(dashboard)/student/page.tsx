"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  GraduationCap, 
  BookOpen, 
  Bookmark, 
  Clock, 
  Building2, 
  ArrowUpRight, 
  CheckCircle2
} from "lucide-react";
import { getBorrowedBooks, getFavoriteBooks } from "@/lib/services/student";
import { StudentBookAccess } from "@/lib/types/student";
import { KpiGrid } from "@/components/ui/kpi-card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState, EmptyIcon, EmptyTitle, EmptyDescription } from "@/components/ui/empty-state";

export default function StudentDashboardPage() {
  const [borrowedBooks, setBorrowedBooks] = useState<StudentBookAccess[]>([]);
  const [favoriteBooks, setFavoriteBooks] = useState<StudentBookAccess[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [borrowed, favorites] = await Promise.all([
          getBorrowedBooks(),
          getFavoriteBooks()
        ]);
        setBorrowedBooks(borrowed);
        setFavoriteBooks(favorites);
      } catch (err) {
        console.error("Erreur de chargement du dashboard étudiant", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Banner Welcome Student */}
        <div className="bg-navy-dark text-white rounded-3xl p-6 sm:p-8 border border-navy/30 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy text-gold text-xs font-bold uppercase tracking-wider border border-gold/20">
              <GraduationCap className="w-3.5 h-3.5" />
              Espace Étudiant • Licence Droit
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold">
              Bienvenue sur votre portail d'étude
            </h1>
            <p className="text-xs sm:text-sm text-white/80 max-w-xl">
              Consultez vos manuels universitaires souscrits, gérez vos favoris et accédez au lecteur numérique protégé.
            </p>
          </div>

          <div className="bg-navy/80 p-4 rounded-2xl border border-gold/20 space-y-2 text-xs z-10 w-full md:w-auto">
            <div className="flex items-center gap-2 text-gold font-bold">
              <Building2 className="w-4 h-4" />
              Université d'Abomey-Calavi (UAC)
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              Matricule : 1029384-UAC (Validé)
            </div>
          </div>
        </div>

        {/* KPI Cards — Statistiques rapides */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="bg-background border border-border p-5 rounded-2xl animate-pulse space-y-3 h-36">
                <div className="w-10 h-10 rounded-xl bg-background-secondary" />
                <div className="h-7 w-20 bg-background-secondary rounded" />
                <div className="h-3.5 w-28 bg-background-secondary rounded" />
              </div>
            ))}
          </div>
        ) : (
          <KpiGrid
            cols={3}
            cards={[
              {
                label: "Ouvrages actifs",
                value: borrowedBooks.length,
                icon: BookOpen,
                trend: 2,
                sparkline: [40, 50, 45, 60, 55, 70, 65],
              },
              {
                label: "Favoris enregistrés",
                value: favoriteBooks.length,
                icon: Bookmark,
                trend: 5,
                sparkline: [20, 30, 35, 30, 45, 50, 55],
              },
              {
                label: "Jours avant échéance",
                value: 14,
                formatValue: (v) => `${v} jours`,
                icon: Clock,
              },
            ]}
          />
        )}

        {/* Onglets Emprunts / Favoris */}
        <Tabs defaultValue="borrowed" className="space-y-6">
          <TabsList>
            <TabsTrigger value="borrowed" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Mes Emprunts ({loading ? "..." : borrowedBooks.length})
            </TabsTrigger>
            <TabsTrigger value="favorites" className="gap-2">
              <Bookmark className="w-4 h-4" />
              Mes Favoris ({loading ? "..." : favoriteBooks.length})
            </TabsTrigger>
          </TabsList>

          {/* Squelette de chargement */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
              <div className="bg-background-secondary h-44 rounded-2xl border border-border" />
              <div className="bg-background-secondary h-44 rounded-2xl border border-border" />
            </div>
          ) : (
            <>
              {/* Contenu Emprunts */}
              <TabsContent value="borrowed">
                {borrowedBooks.length === 0 ? (
                  <EmptyState>
                    <EmptyIcon icon={BookOpen} />
                    <EmptyTitle>Aucun emprunt actif</EmptyTitle>
                    <EmptyDescription>Consultez le catalogue pour emprunter vos premiers ouvrages.</EmptyDescription>
                  </EmptyState>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {borrowedBooks.map((book) => (
                      <div key={book.id} className="bg-background-secondary p-6 rounded-2xl border border-border space-y-4 flex flex-col justify-between hover:border-gold transition-colors">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gold">
                              {book.discipline}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-navy-light text-navy">
                              {book.format}
                            </span>
                          </div>
                          <h3 className="font-serif font-bold text-navy text-lg leading-snug">
                            {book.title}
                          </h3>
                          <p className="text-xs text-foreground-muted font-medium">
                            {book.author}
                          </p>
                          <p className="text-xs text-navy font-semibold flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-gold" />
                            {book.institution}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-border flex items-center justify-between text-xs">
                          <span className="text-foreground-muted flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-gold" />
                            Valide encore {book.expiresInDays} jours
                          </span>
                          <Link
                            href={`/catalog/reader/${book.id}`}
                            className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors flex items-center gap-1.5"
                          >
                            Lire maintenant
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
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
                    <EmptyDescription>Ajoutez des ouvrages à vos favoris depuis le catalogue pour les retrouver ici.</EmptyDescription>
                  </EmptyState>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {favoriteBooks.map((book) => (
                      <div key={book.id} className="bg-background-secondary p-6 rounded-2xl border border-border space-y-4 flex flex-col justify-between hover:border-gold transition-colors">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gold">
                              {book.discipline}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-navy-light text-navy">
                              {book.format}
                            </span>
                          </div>
                          <h3 className="font-serif font-bold text-navy text-lg leading-snug">
                            {book.title}
                          </h3>
                          <p className="text-xs text-foreground-muted font-medium">
                            {book.author}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-border flex items-center justify-between text-xs">
                          <Link
                            href={`/catalog/${book.id}`}
                            className="text-gold font-bold hover:underline"
                          >
                            Voir la notice
                          </Link>
                          <Link
                            href={`/catalog/reader/${book.id}`}
                            className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors flex items-center gap-1.5"
                          >
                            Consulter l&apos;extrait
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>

      </div>
    </div>
  );
}
