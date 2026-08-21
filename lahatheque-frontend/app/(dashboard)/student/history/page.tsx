"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  History,
  ArrowLeft,
  BookOpen,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import {
  getStudentHistoryStats,
  type HistoryStatsAPI,
} from "@/lib/services/student";
import { StudentKpiCharts } from "@/components/features/student/student-kpi-charts";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonBlock({ h = "h-32" }: { h?: string }) {
  return (
    <div className={`${h} rounded-3xl bg-background border border-border animate-pulse`} />
  );
}

// ─── Page Principale ──────────────────────────────────────────────────────────

export default function StudentHistoryPage() {
  const [stats, setStats] = useState<HistoryStatsAPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const data = await getStudentHistoryStats();
        setStats(data);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Erreur de chargement des statistiques"
        );
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/student" className="hover:text-navy">
          Mon Espace
        </Link>
        <span>/</span>
        <span className="text-navy font-semibold">Historique &amp; Statistiques</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-5">
        <Link
          href="/student"
          className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour
        </Link>
        <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
          <History className="w-4 h-4 text-gold" />
          Suivi Pédagogique &amp; Assiduité
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
          Historique &amp; Statistiques d&apos;Étude
        </h1>
        <p className="text-xs text-foreground-muted mt-1">
          Votre assiduité, vos heures d&apos;étude active et vos sessions de lecture récentes.
        </p>
      </div>

      {/* ── Erreur ────────────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-2xl border border-error/30 bg-error/10 text-error text-sm">
          {error}
        </div>
      )}

      {/* ── KPIs & Graphiques 21st.dev ────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} h="h-44" />
          ))}
        </div>
      ) : stats ? (
        <StudentKpiCharts stats={stats} />
      ) : null}

      {/* ── Timeline des Sessions Récentes ─────────────────────────────── */}
      {!loading && stats && stats.recent_sessions_timeline && stats.recent_sessions_timeline.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-bold text-navy text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold" />
              Sessions Récentes de Lecture
            </h2>
            <Link
              href="/student/books"
              className="text-xs font-bold text-navy hover:text-gold flex items-center gap-1 transition-colors"
            >
              Ma bibliothèque
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {stats.recent_sessions_timeline.map((session) => (
              <div
                key={session.id}
                className="p-4 rounded-2xl border border-border bg-background hover:border-gold/60 transition-all flex items-center justify-between gap-4 shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0 p-2.5 rounded-xl bg-navy/10 text-navy">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gold uppercase tracking-wider">
                      {session.ouvrage_discipline || "Académique"}
                    </p>
                    <p className="font-serif font-bold text-navy text-sm truncate">
                      {session.ouvrage_title}
                    </p>
                    <p className="text-[11px] text-foreground-muted">
                      {new Date(session.session_date).toLocaleDateString(
                        "fr-FR",
                        { day: "numeric", month: "long", year: "numeric" }
                      )}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-4 text-right">
                  <div>
                    <p className="text-xs font-bold text-navy font-mono">
                      {session.duration_minutes} min
                    </p>
                    <p className="text-[10px] text-foreground-muted">
                      {session.pages_read} pages lues
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* État vide */}
      {!loading && !error && stats && (!stats.recent_sessions_timeline || stats.recent_sessions_timeline.length === 0) && (
        <div className="py-16 rounded-3xl bg-background border border-dashed border-border text-center space-y-3">
          <History className="w-10 h-10 text-foreground-muted mx-auto opacity-50" />
          <h3 className="font-serif font-bold text-navy text-lg">
            Aucune session enregistrée
          </h3>
          <p className="text-xs text-foreground-muted max-w-sm mx-auto">
            Vos sessions de lecture apparaîtront ici automatiquement dès votre première
            session sur la liseuse.
          </p>
          <Link
            href="/student/books"
            className="inline-flex mt-2 items-center gap-2 px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors min-h-[44px]"
          >
            Commencer à lire
          </Link>
        </div>
      )}
    </div>
  );
}
