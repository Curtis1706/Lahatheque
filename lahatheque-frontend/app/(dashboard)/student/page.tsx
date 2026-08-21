"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import {
  getStudentOverview,
  getStudentBooks,
  getStudentHistoryStats,
  type StudentOverviewKPIs,
  type BookAPI,
  type HistoryStatsAPI,
} from "@/lib/services/student";
import { StudentKpiCharts } from "@/components/features/student/student-kpi-charts";
import {
  BookOpen,
  Search,
  Sparkles,
  ArrowRight,
  PackageCheck,
  ChevronRight,
  Flame,
  Building2,
  Play,
  BookMarked,
  Clock,
  History,
} from "lucide-react";

// ─── Skeleton Loader ─────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="p-5 rounded-3xl bg-background border border-border animate-pulse h-28" />
  );
}

// ─── Carte Livre Résumée ──────────────────────────────────────────────────────

function RecentBookCard({ book }: { book: BookAPI }) {
  const authorName =
    book.authors?.map((a) => a.full_name).join(", ") || "Auteur inconnu";

  return (
    <div className="group p-4 rounded-2xl bg-background border border-border hover:border-gold transition-all shadow-xs flex items-center gap-4">
      {/* Couverture placeholder */}
      <div className="shrink-0 w-12 h-16 rounded-lg bg-navy/10 border border-navy/20 flex items-center justify-center">
        <BookOpen className="w-5 h-5 text-navy/40" />
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-[11px] font-bold text-gold uppercase tracking-wider">
          {book.discipline_name || "Académique"}
        </p>
        <h3 className="font-serif font-bold text-navy text-sm leading-tight truncate">
          {book.title}
        </h3>
        <p className="text-[11px] text-foreground-muted truncate">
          Par {authorName}
        </p>
        {typeof book.progress_percent !== "undefined" && (
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-foreground-muted">
                Progression
              </span>
              <span className="text-[10px] font-bold text-navy">
                {book.progress_percent}%
              </span>
            </div>
            <div className="h-1 rounded-full bg-navy/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gold transition-all"
                style={{ width: `${book.progress_percent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <Link
        href={`/catalog/reader/${book.id}`}
        className="shrink-0 p-2 rounded-xl bg-navy/10 hover:bg-gold/20 transition-colors"
        title="Lire"
      >
        <Play className="w-4 h-4 text-navy" />
      </Link>
    </div>
  );
}

// ─── Page Principale ──────────────────────────────────────────────────────────

export default function StudentOverviewPage() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<StudentOverviewKPIs | null>(null);
  const [recentBooks, setRecentBooks] = useState<BookAPI[]>([]);
  const [historyStats, setHistoryStats] = useState<HistoryStatsAPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [kpisData, booksData, statsData] = await Promise.all([
          getStudentOverview(),
          getStudentBooks(),
          getStudentHistoryStats(),
        ]);
        setKpis(kpisData);
        setRecentBooks(booksData.slice(0, 3));
        setHistoryStats(statsData);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erreur de chargement";
        if (msg !== "SESSION_EXPIRED") setError(msg);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const currentReading = kpis?.currentReading;

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 sm:space-y-8">
      {/* ── Banner Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-navy border border-navy-hover text-white shadow-md">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-bold mb-2 uppercase tracking-wider">
            <BookMarked className="w-3.5 h-3.5" />
            Mon Espace Lecteur
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold font-serif tracking-tight">
            Bienvenue, {user?.first_name || "Cher Lecteur"}
          </h1>
          <p className="text-xs sm:text-sm text-navy-light mt-1">
            Reprenez votre lecture, profitez de la synthèse vocale intégrée et
            explorez le catalogue académique.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/student/catalog"
            className="px-4 py-2.5 rounded-xl bg-gold text-navy font-bold text-xs hover:bg-gold-light transition-all flex items-center gap-2 shadow-sm min-h-[44px]"
          >
            <Search className="w-4 h-4" />
            Explorer le Catalogue
          </Link>
        </div>
      </div>

      {/* ── Erreur ────────────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-2xl border border-error/30 bg-error/10 text-error text-sm">
          {error} — Vérifiez votre connexion ou reconnectez-vous.
        </div>
      )}

      {/* ── KPIs & Assiduité d'Étude 21st.dev (Premières KPIs) ──────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider">
            <History className="w-4 h-4 text-gold" />
            Statistiques &amp; Assiduité d&apos;Étude
          </div>
          <Link
            href="/student/history"
            className="text-xs font-bold text-navy hover:underline inline-flex items-center gap-1"
          >
            Détails complets
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : historyStats ? (
          <StudentKpiCharts stats={historyStats} />
        ) : null}
      </div>

      {/* ── Reprise de Lecture ─────────────────────────────────────────── */}
      {!loading && currentReading && (
        <div className="p-5 sm:p-6 rounded-3xl bg-background border border-gold shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4 min-w-0">
            <div className="shrink-0 w-14 h-20 rounded-xl bg-navy/10 border border-navy/20 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-navy/40" />
            </div>
            <div className="min-w-0 space-y-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gold/15 text-gold text-[10px] font-mono font-bold uppercase">
                Reprendre ({currentReading.progress_percent}%)
              </span>
              <h3 className="font-serif font-bold text-navy text-base sm:text-lg truncate">
                {currentReading.ouvrage.title}
              </h3>
              <p className="text-xs text-foreground-muted truncate">
                Par{" "}
                {currentReading.ouvrage.authors
                  ?.map((a) => a.full_name)
                  .join(", ")}
              </p>
              {currentReading.last_read_chapter && (
                <p className="text-xs text-navy font-semibold truncate">
                  {currentReading.last_read_chapter}
                </p>
              )}
            </div>
          </div>

          <Link
            href={`/catalog/reader/${currentReading.ouvrage.id}`}
            className="shrink-0 px-5 py-3 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 min-h-[44px] shadow-xs"
          >
            <Play className="w-4 h-4 text-gold fill-gold" />
            Reprendre la Lecture
          </Link>
        </div>
      )}

      {/* ── KPIs ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <Link href="/student/books" className="block group">
              <div className="p-5 rounded-3xl bg-background border border-border group-hover:border-gold transition-all space-y-2 shadow-xs h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-navy uppercase tracking-wider">
                    Ma Bibliothèque
                  </span>
                  <div className="p-2 rounded-xl bg-gold/15 text-gold">
                    <BookOpen className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="font-serif font-bold text-2xl text-navy">
                    {kpis?.totalBooksInLibrary ?? 0}
                  </p>
                  <p className="text-[11px] text-foreground-muted mt-0.5">
                    ouvrages
                  </p>
                </div>
              </div>
            </Link>

            <Link href="/student/university" className="block group">
              <div className="p-5 rounded-3xl bg-background border border-border group-hover:border-gold transition-all space-y-2 shadow-xs h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-navy uppercase tracking-wider">
                    Bouquets Campus
                  </span>
                  <div className="p-2 rounded-xl bg-gold/15 text-gold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="font-serif font-bold text-2xl text-navy">
                    {kpis?.unlockedBouquetsCount ?? 0}
                  </p>
                  <p className="text-[11px] text-foreground-muted mt-0.5">
                    bouquets actifs
                  </p>
                </div>
              </div>
            </Link>

            <Link href="/student/university" className="block group">
              <div className="p-5 rounded-3xl bg-background border border-border group-hover:border-gold transition-all space-y-2 shadow-xs h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-navy uppercase tracking-wider">
                    Mon Université
                  </span>
                  <div className="p-2 rounded-xl bg-navy/10">
                    <Building2 className="w-4 h-4 text-gold" />
                  </div>
                </div>
                <div>
                  {kpis?.hasUniversityAffiliation ? (
                    <>
                      <p className="font-serif font-bold text-sm text-navy truncate">
                        {kpis.institutionName}
                      </p>
                      <p className="text-[11px] text-success mt-0.5">
                        Affiliation active
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-serif font-bold text-sm text-navy">
                        Non rattaché
                      </p>
                      <p className="text-[11px] text-foreground-muted mt-0.5">
                        Optionnel
                      </p>
                    </>
                  )}
                </div>
              </div>
            </Link>

            <Link href="/student/history" className="block group">
              <div className="p-5 rounded-3xl bg-background border border-border group-hover:border-gold transition-all space-y-2 shadow-xs h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-navy uppercase tracking-wider">
                    Série de Lecture
                  </span>
                  <div className="p-2 rounded-xl bg-gold/15 text-gold">
                    <Flame className="w-4 h-4 fill-current" />
                  </div>
                </div>
                <div>
                  <p className="font-serif font-bold text-2xl text-navy">
                    {kpis?.readingStreakDays ?? 0}{" "}
                    <span className="text-base">jours</span>
                  </p>
                  <p className="text-[11px] text-foreground-muted mt-0.5">
                    <Clock className="w-3 h-3 inline mr-0.5" />
                    {kpis?.weeklyReadingHours ?? 0}h cette semaine
                  </p>
                </div>
              </div>
            </Link>
          </>
        )}
      </div>

      {/* ── Lectures Récentes ──────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-serif font-bold text-navy">
              Mes Ouvrages en Cours
            </h2>
            <p className="text-xs text-foreground-muted">
              Reprenez directement avec la liseuse protégée.
            </p>
          </div>
          <Link
            href="/student/books"
            className="text-xs font-bold text-navy hover:text-gold flex items-center gap-1 transition-colors"
          >
            Toute ma bibliothèque
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-2xl bg-background border border-border animate-pulse"
              />
            ))}
          </div>
        ) : recentBooks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentBooks.map((book) => (
              <RecentBookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 rounded-3xl border border-dashed border-border bg-background">
            <BookOpen className="w-10 h-10 text-foreground-muted mx-auto mb-3 opacity-50" />
            <p className="text-sm font-semibold text-navy">
              Votre bibliothèque est vide
            </p>
            <p className="text-xs text-foreground-muted mt-1">
              Explorez le catalogue pour acquérir vos premiers ouvrages.
            </p>
            <Link
              href="/student/catalog"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors min-h-[44px]"
            >
              <Search className="w-4 h-4" />
              Découvrir le Catalogue
            </Link>
          </div>
        )}
      </div>

      {/* ── Raccourcis ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/student/catalog"
          className="p-5 rounded-3xl bg-background border border-border hover:border-gold transition-all flex items-center justify-between shadow-xs group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-navy text-white group-hover:bg-gold group-hover:text-navy transition-colors">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-navy text-sm group-hover:text-gold transition-colors">
                Explorer le Catalogue
              </h4>
              <p className="text-xs text-foreground-muted">
                Consultez les 15 premières pages gratuitement.
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-foreground-muted group-hover:text-gold group-hover:translate-x-0.5 transition-all" />
        </Link>

        <Link
          href="/student/orders"
          className="p-5 rounded-3xl bg-background border border-border hover:border-gold transition-all flex items-center justify-between shadow-xs group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-navy text-white group-hover:bg-gold group-hover:text-navy transition-colors">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-navy text-sm group-hover:text-gold transition-colors">
                Mes Commandes
              </h4>
              <p className="text-xs text-foreground-muted">
                Suivez l&apos;expédition de vos livres papier.
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-foreground-muted group-hover:text-gold group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>
    </div>
  );
}
