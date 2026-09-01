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
import { BookCover } from "@/components/features/student/book-cover";
import {
  BookOpen,
  Search,
  ArrowRight,
  PackageCheck,
  ChevronRight,
  Sparkles,
  Building2,
  Play,
  BookMarked,
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
      <Link href={`/catalog/reader/${book.id}`} className="shrink-0" title={`Lire ${book.title}`}>
        <BookCover book={book} size="xs" />
      </Link>

      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-[11px] font-bold text-gold uppercase tracking-wider">
          {book.discipline_name || "Académique"}
        </p>
        <Link href={`/catalog/reader/${book.id}`}>
          <h3 className="font-serif font-bold text-navy text-sm leading-tight truncate group-hover:text-gold transition-colors">
            {book.title}
          </h3>
        </Link>
        <p className="text-[11px] text-foreground-muted truncate">
          Par {authorName}
        </p>
        {typeof book.progress_percent !== "undefined" && (
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-foreground-muted">
                Progression
              </span>
              <span className="text-[10px] font-mono font-bold text-navy">
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
        className="shrink-0 p-2.5 rounded-xl bg-navy/10 hover:bg-gold/20 transition-colors"
        title="Continuer la lecture"
      >
        <Play className="w-4 h-4 text-navy" />
      </Link>
    </div>
  );
}

// ─── Carte Hero Dominante : Reprise de Lecture ou Invitation ─────────────────

function ReadingHeroCard({
  currentReading,
}: {
  currentReading: StudentOverviewKPIs["currentReading"];
}) {
  if (currentReading) {
    return (
      <div className="book-ribbon p-7 sm:p-8 rounded-3xl bg-background border-2 border-gold/70 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-5 min-w-0">
          <Link href={`/catalog/reader/${currentReading.ouvrage.id}`} className="shrink-0" title={`Continuer ${currentReading.ouvrage.title}`}>
            <BookCover book={currentReading.ouvrage} size="md" />
          </Link>
          <div className="min-w-0 space-y-2">
            <div className="section-ribbon-badge">
              <Play className="w-3 h-3 fill-current" />
              <span>Reprendre la lecture · {currentReading.progress_percent}%</span>
            </div>
            <Link href={`/catalog/reader/${currentReading.ouvrage.id}`}>
              <h3 className="font-serif font-bold text-navy text-xl sm:text-2xl truncate hover:text-gold transition-colors">
                {currentReading.ouvrage.title}
              </h3>
            </Link>
            <p className="text-xs sm:text-sm text-foreground-muted truncate">
              Par {currentReading.ouvrage.authors?.map((a) => a.full_name).join(", ")}
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
          className="shrink-0 px-6 py-3.5 rounded-2xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2.5 min-h-[48px] shadow-sm cursor-pointer"
        >
          <Play className="w-4 h-4 text-gold fill-gold" />
          <span>Continuer ma lecture</span>
        </Link>
      </div>
    );
  }

  // État vide : invitation dominante (reliure objet-livre sans hachures pointillées)
  return (
    <div className="book-ribbon p-7 sm:p-8 rounded-3xl bg-background border-2 border-gold/70 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
      <div className="flex items-center gap-5 min-w-0">
        <div className="shrink-0 w-20 h-28 rounded-2xl bg-gradient-to-br from-navy-dark via-navy to-navy-hover border border-gold/40 flex flex-col items-center justify-center p-3 shadow-md relative overflow-hidden">
          <div className="absolute inset-0 bg-gold/10 opacity-30" />
          <BookOpen className="w-9 h-9 text-gold relative z-10" />
          <span className="text-[9px] font-mono text-gold-light mt-1.5 uppercase font-bold relative z-10 tracking-widest">LAHA</span>
        </div>
        <div className="min-w-0 space-y-2">
          <div className="section-ribbon-badge">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Bibliothèque Académique</span>
          </div>
          <h3 className="font-serif font-bold text-navy text-xl sm:text-2xl">
            Prêt pour votre première lecture ?
          </h3>
          <p className="text-xs sm:text-sm text-foreground-muted max-w-lg">
            Explorez le catalogue académique et commencez avec la liseuse protégée — extrait gratuit disponible sur chaque ouvrage.
          </p>
        </div>
      </div>

      <Link
        href="/student/catalog"
        className="shrink-0 px-6 py-3.5 rounded-2xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2.5 min-h-[48px] shadow-sm cursor-pointer"
      >
        <Search className="w-4 h-4 text-gold" />
        <span>Explorer le Catalogue</span>
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

  const displayName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.first_name || user?.email?.split("@")[0] || "Lecteur";

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 sm:space-y-8 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* ── Bandeau d'accueil Navy ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-3xl bg-navy border border-navy-hover text-white shadow-md">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-bold uppercase tracking-wider">
            <BookMarked className="w-3.5 h-3.5" />
            <span>Mon Espace Lecteur</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold font-serif tracking-tight">
            Bienvenue, {displayName}
          </h1>
          <p className="text-xs sm:text-sm text-navy-light">
            Reprenez votre lecture, profitez de la synthèse vocale intégrée et explorez le catalogue académique.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {kpis?.affiliation ? (
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/10 border border-white/20 text-xs">
              <Building2 className="w-4 h-4 text-gold shrink-0" />
              <div>
                <p className="font-serif font-bold text-white leading-tight">
                  {kpis.affiliation.institution_name}
                </p>
                <p className="text-[10px] text-navy-light font-mono">
                  {kpis.affiliation.level}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/10 border border-white/15 text-xs text-navy-light font-mono">
              <Building2 className="w-4 h-4 text-gold shrink-0" />
              <span>Campus LAHAThèque</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Erreur ────────────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-2xl border border-error/30 bg-error/10 text-error text-sm">
          {error} — Vérifiez votre connexion ou reconnectez-vous.
        </div>
      )}

      {/* ── Carte Hero Dominante : Reprise de Lecture ── */}
      {loading ? (
        <div className="h-32 rounded-3xl bg-background border border-border animate-pulse" />
      ) : (
        <ReadingHeroCard currentReading={kpis?.currentReading ?? null} />
      )}

      {/* ── Statistiques & Assiduité d'Étude (Grille Bespoke) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif font-bold text-navy text-lg flex items-center gap-2">
            <History className="w-4 h-4 text-gold" />
            Statistiques &amp; Temps d&apos;Étude
          </h2>
          <Link
            href="/student/history"
            className="text-xs font-semibold text-navy hover:text-gold transition-colors inline-flex items-center gap-1"
          >
            Historique complet
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <StudentKpiCharts
            stats={
              historyStats || {
                weekly_hours: kpis?.stats?.weekly_hours || kpis?.weeklyReadingHours || 0,
                books_completed_count: kpis?.stats?.books_completed_count || 0,
                current_streak_days: kpis?.stats?.current_streak_days || kpis?.readingStreakDays || 0,
                overall_progress: kpis?.stats?.overall_progress || 0,
                total_pages_read: 0,
                recent_sessions_timeline: [],
                daily_activity: [
                  { day: "Lun", hours: 1.5, date: "" },
                  { day: "Mar", hours: 2.0, date: "" },
                  { day: "Mer", hours: 0.8, date: "" },
                  { day: "Jeu", hours: 2.5, date: "" },
                  { day: "Ven", hours: 1.2, date: "" },
                  { day: "Sam", hours: 3.0, date: "" },
                  { day: "Dim", hours: 1.8, date: "" },
                ],
                discipline_breakdown: [
                  { name: "Droit Privé", percentage: 45, color: "var(--navy)" },
                  { name: "Sciences Politiques", percentage: 30, color: "var(--gold)" },
                  { name: "Économie", percentage: 25, color: "var(--navy-hover)" },
                ],
              }
            }
          />
        )}
      </div>

      {/* ── Filet fin séparateur (Tranche dorée) ── */}
      <div className="gilt-divider my-2" />

      {/* ── Lectures Récentes & Accès Rapides ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne Gauche : Derniers Ouvrages consultés */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-bold text-navy text-lg flex items-center gap-2">
              <History className="w-4 h-4 text-gold" />
              Lectures Récentes
            </h2>
            <Link
              href="/student/library"
              className="text-xs font-semibold text-navy hover:text-gold transition-colors inline-flex items-center gap-1"
            >
              Ma Bibliothèque ({kpis?.stats?.total_books_read ?? kpis?.totalBooksInLibrary ?? recentBooks.length})
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : recentBooks.length > 0 ? (
            <div className="space-y-3">
              {recentBooks.map((book) => (
                <RecentBookCard key={book.id} book={book} />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-3xl bg-background border border-dashed border-border space-y-2">
              <BookOpen className="w-8 h-8 text-foreground-muted mx-auto opacity-50" />
              <p className="text-xs font-semibold text-navy">
                Aucune lecture récente enregistrée.
              </p>
              <p className="text-[11px] text-foreground-muted">
                Parcourez le catalogue pour ajouter votre premier ouvrage.
              </p>
            </div>
          )}
        </div>

        {/* Colonne Droite : Accès Rapides / Ressources */}
        <div className="space-y-4">
          <h2 className="font-serif font-bold text-navy text-lg flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-gold" />
            Ressources &amp; Outils
          </h2>

          <div className="space-y-3">
            <Link
              href="/student/catalog"
              className="group p-4 rounded-2xl bg-background border border-border hover:border-gold transition-all shadow-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-navy/10 text-navy group-hover:bg-gold/20 transition-colors">
                  <Search className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <p className="font-serif font-bold text-navy text-xs">
                    Catalogue Académique
                  </p>
                  <p className="text-[10px] text-foreground-muted">
                    Rechercher par discipline ou université
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-foreground-muted group-hover:text-navy transition-colors" />
            </Link>

            <Link
              href="/student/annotations"
              className="group p-4 rounded-2xl bg-background border border-border hover:border-gold transition-all shadow-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-navy/10 text-navy group-hover:bg-gold/20 transition-colors">
                  <BookMarked className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <p className="font-serif font-bold text-navy text-xs">
                    Mes Surlignages &amp; Notes
                  </p>
                  <p className="text-[10px] text-foreground-muted">
                    Citations et fiches enregistrées
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-foreground-muted group-hover:text-navy transition-colors" />
            </Link>

            <Link
              href="/student/orders"
              className="group p-4 rounded-2xl bg-background border border-border hover:border-gold transition-all shadow-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-navy/10 text-navy group-hover:bg-gold/20 transition-colors">
                  <PackageCheck className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <p className="font-serif font-bold text-navy text-xs">
                    Mes Commandes Papier
                  </p>
                  <p className="text-[10px] text-foreground-muted">
                    Suivi d&apos;expédition d&apos;exemplaires
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-foreground-muted group-hover:text-navy transition-colors" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
