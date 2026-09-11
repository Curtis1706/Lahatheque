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
  History,
  Headphones,
} from "lucide-react";
import { useAudioPlayer } from "@/components/features/audio/audio-player-context";
import { RecentAudioWidget } from "@/components/features/student/recent-audio-widget";
import { cn } from "@/lib/utils";
import {
  getPersonalizedRecommendations,
  type RecommendedBook,
} from "@/lib/services/catalog";

// ─── Skeleton Loader ─────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="p-5 rounded-3xl bg-background border border-border animate-pulse h-28" />
  );
}

// ─── Carte Livre Résumée ──────────────────────────────────────────────────────

function RecentBookCard({ book }: { book: BookAPI }) {
  const { playBook } = useAudioPlayer();
  const authorName =
    book.authors?.map((a) => a.full_name).join(", ") || "Auteur inconnu";
  const isAudioOwned = Boolean(
    book.is_audio_owned || (book as any).has_audio_access
  );
  const isDigitalOwned = Boolean(
    book.is_owned || (book as any).has_digital_access
  );
  const isAudioOnly = isAudioOwned && !isDigitalOwned;

  return (
    <div className="group p-4 rounded-2xl bg-background border border-border hover:border-gold transition-all shadow-xs flex items-center gap-4">
      {isDigitalOwned ? (
        <Link href={`/catalog/reader/${book.id}`} className="shrink-0" title={`Lire ${book.title}`}>
          <BookCover book={book} size="xs" />
        </Link>
      ) : isAudioOwned ? (
        <button
          type="button"
          onClick={() => playBook(book.id)}
          className="shrink-0 cursor-pointer"
          title={`Écouter ${book.title}`}
        >
          <BookCover book={book} size="xs" />
        </button>
      ) : (
        <div className="shrink-0">
          <BookCover book={book} size="xs" />
        </div>
      )}

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-[11px] font-bold text-gold uppercase tracking-wider">
            {book.discipline_name || "Académique"}
          </p>
          {isAudioOwned && isDigitalOwned ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-gold/15 text-navy border border-gold/30">
              <Headphones className="w-2.5 h-2.5 text-gold" />
              Num. &amp; Audio
            </span>
          ) : isAudioOwned ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-gold/15 text-navy border border-gold/30">
              <Headphones className="w-2.5 h-2.5 text-gold" />
              Audio
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-navy/5 text-navy border border-border">
              <BookOpen className="w-2.5 h-2.5 text-gold" />
              Numérique
            </span>
          )}
        </div>
        {isDigitalOwned ? (
          <Link href={`/catalog/reader/${book.id}`}>
            <h3 className="font-serif font-bold text-navy text-sm leading-tight truncate group-hover:text-gold transition-colors">
              {book.title}
            </h3>
          </Link>
        ) : isAudioOwned ? (
          <button
            type="button"
            onClick={() => playBook(book.id)}
            className="text-left w-full block cursor-pointer"
          >
            <h3 className="font-serif font-bold text-navy text-sm leading-tight truncate hover:text-gold transition-colors">
              {book.title}
            </h3>
          </button>
        ) : (
          <h3 className="font-serif font-bold text-navy text-sm leading-tight truncate">
            {book.title}
          </h3>
        )}
        <p className="text-[11px] text-foreground-muted truncate">
          Par {authorName}
        </p>
        {isDigitalOwned && typeof book.progress_percent === "number" && (
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

      <div className="flex items-center gap-1.5 shrink-0">
        {isAudioOwned && (
          <button
            type="button"
            onClick={() => playBook(book.id)}
            className={cn(
              "p-2.5 rounded-xl border transition-colors cursor-pointer",
              !isDigitalOwned
                ? "bg-navy text-white hover:bg-navy-hover border-navy"
                : "bg-gold/15 hover:bg-gold/25 text-navy border-gold/40"
            )}
            title="Écouter la version audio"
          >
            <Headphones className="w-4 h-4 text-gold" />
          </button>
        )}
        {isDigitalOwned && (
          <Link
            href={`/catalog/reader/${book.id}`}
            className="p-2.5 rounded-xl bg-navy/10 hover:bg-gold/20 transition-colors"
            title="Continuer la lecture"
          >
            <Play className="w-4 h-4 text-navy" />
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Carte Hero Dominante : Reprise de Lecture ou Invitation ─────────────────

function ReadingHeroCard({
  currentReading,
}: {
  currentReading: StudentOverviewKPIs["currentReading"];
}) {
  const { playBook } = useAudioPlayer();

  if (currentReading) {
    const isAudioOwned = Boolean(
      (currentReading.ouvrage as any).is_audio_owned ||
      (currentReading.ouvrage as any).has_audio_access
    );
    const isAudioOnly = isAudioOwned && (currentReading.ouvrage as any).is_digital_available === false;
    const heroHref = isAudioOnly ? `/listen/${currentReading.ouvrage.id}` : `/catalog/reader/${currentReading.ouvrage.id}`;

    return (
      <div className="book-ribbon p-7 sm:p-8 rounded-3xl bg-background border-2 border-gold/70 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-5 min-w-0">
          <Link href={heroHref} className="shrink-0" title={isAudioOnly ? `Continuer l'écoute de ${currentReading.ouvrage.title}` : `Continuer ${currentReading.ouvrage.title}`}>
            <BookCover book={currentReading.ouvrage} size="md" />
          </Link>
          <div className="min-w-0 space-y-2">
            <div className="section-ribbon-badge">
              {isAudioOnly ? <Headphones className="w-3 h-3 text-gold" /> : <Play className="w-3 h-3 fill-current" />}
              <span>{isAudioOnly ? "Reprendre l'écoute" : "Reprendre la lecture"} · {currentReading.progress_percent}%</span>
            </div>
            <Link href={heroHref}>
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

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {isAudioOwned && !isAudioOnly && (
            <button
              type="button"
              onClick={() => playBook(currentReading.ouvrage.id)}
              className="px-5 py-3.5 rounded-2xl bg-gold/20 hover:bg-gold/30 text-navy text-xs font-bold border border-gold/40 transition-colors inline-flex items-center gap-2 min-h-[48px] shadow-xs cursor-pointer"
              title="Écouter la version audio"
            >
              <Headphones className="w-4 h-4 text-gold" />
              <span>Écouter en audio</span>
            </button>
          )}

          {isAudioOnly ? (
            <button
              type="button"
              onClick={() => playBook(currentReading.ouvrage.id)}
              className="px-6 py-3.5 rounded-2xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2.5 min-h-[48px] shadow-sm cursor-pointer"
            >
              <Headphones className="w-4 h-4 text-gold" />
              <span>Continuer mon écoute</span>
            </button>
          ) : (
            <Link
              href={`/catalog/reader/${currentReading.ouvrage.id}`}
              className="px-6 py-3.5 rounded-2xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2.5 min-h-[48px] shadow-sm cursor-pointer"
            >
              <Play className="w-4 h-4 text-gold fill-gold" />
              <span>Continuer ma lecture</span>
            </Link>
          )}
        </div>
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
  const [recommendations, setRecommendations] = useState<RecommendedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [kpisData, booksData, statsData, recsData] = await Promise.all([
          getStudentOverview(),
          getStudentBooks(),
          getStudentHistoryStats(),
          getPersonalizedRecommendations(),
        ]);
        setKpis(kpisData);
        setRecentBooks(booksData.slice(0, 3));
        setHistoryStats(statsData);
        setRecommendations(recsData);
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
            <BookOpen className="w-3.5 h-3.5" />
            <span>Mon Espace Lecteur</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold font-serif tracking-tight">
            Bienvenue, {displayName}
          </h1>
          <p className="text-xs sm:text-sm text-navy-light">
            Reprenez votre lecture, profitez de la synthèse vocale intégrée et explorez le catalogue académique.
          </p>
        </div>

        {/* Bloc Affiliation Campus (Masqué à la demande client) */}
        {/*
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
        */}
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

      {/* ── Widget Audio : Écoutes en cours ── */}
      <RecentAudioWidget />

      {/* ── Statistiques & Assiduité d'Étude (Masqué / Mis en commentaire à la demande client) ── */}
      {/*
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
      */}

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
              href="/student/books"
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
              href="/student/orders"
              className="group p-4 rounded-2xl bg-background border border-border hover:border-gold transition-all shadow-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-navy/10 text-navy group-hover:bg-gold/20 transition-colors">
                  <PackageCheck className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <p className="font-serif font-bold text-navy text-xs">
                    Mes Commandes
                  </p>
                  <p className="text-[10px] text-foreground-muted">
                    Suivi d&apos;expédition d&apos;exemplaires
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-foreground-muted group-hover:text-navy transition-colors" />
            </Link>

            <Link
              href="/student/books"
              className="group p-4 rounded-2xl bg-background border border-border hover:border-gold transition-all shadow-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gold/15 text-navy group-hover:bg-gold/25 transition-colors">
                  <Headphones className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <p className="font-serif font-bold text-navy text-xs">
                    Livres Audio
                  </p>
                  <p className="text-[10px] text-foreground-muted">
                    Lecteur immersif et reprise d&apos;écoute
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-foreground-muted group-hover:text-navy transition-colors" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Recommandé pour vous (Bibliothèque Intelligente) ── */}
      {recommendations.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-bold text-navy text-lg flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold" />
              Recommandé pour vous
            </h2>
            <Link
              href="/student/catalog"
              className="text-xs font-semibold text-navy hover:text-gold transition-colors inline-flex items-center gap-1"
            >
              Explorer le catalogue
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {recommendations.slice(0, 8).map((book) => (
              <Link
                key={book.id}
                href={`/catalog/reader/${book.id}`}
                className="group p-4 rounded-2xl bg-background border border-border hover:border-gold transition-all shadow-xs flex items-center gap-3.5"
              >
                <BookCover
                  book={{
                    id: book.id,
                    title: book.title,
                    cover_url: book.cover_url || undefined,
                    discipline: book.discipline || undefined,
                  }}
                  size="xs"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <span className="text-[10px] font-bold text-gold uppercase tracking-wider block truncate">
                    {book.discipline || "Académique"}
                  </span>
                  <h3 className="font-serif font-bold text-navy text-xs sm:text-sm leading-tight line-clamp-2 group-hover:text-gold transition-colors">
                    {book.title}
                  </h3>
                  {book.price_digital !== null && book.price_digital !== undefined && (
                    <p className="text-[11px] font-mono font-semibold text-foreground-muted">
                      {book.price_digital.toLocaleString("fr-FR")} XOF
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
