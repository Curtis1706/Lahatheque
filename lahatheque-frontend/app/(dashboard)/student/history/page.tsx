"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  History,
  ArrowLeft,
  BookOpen,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import {
  getStudentHistoryStats,
  type HistoryStatsAPI,
} from "@/lib/services/student";
import { StudentKpiCharts } from "@/components/features/student/student-kpi-charts";
import { BookCover } from "@/components/features/student/book-cover";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonBlock({ h = "h-32" }: { h?: string }) {
  return (
    <div className={`${h} rounded-3xl bg-background border border-border animate-pulse`} />
  );
}

// ─── Type pour la DataTable des Sessions ──────────────────────────────────────

type SessionRow = HistoryStatsAPI["recent_sessions_timeline"][0];

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

  const allSessions: SessionRow[] = useMemo(
    () => stats?.recent_sessions_timeline || [],
    [stats]
  );

  // Colonnes DataTable
  const columns: DataTableColumn<SessionRow>[] = [
    {
      key: "session_date",
      header: "Date de session",
      cell: (row) => (
        <span className="text-foreground-muted font-medium text-xs">
          {formatDate(row.session_date)}
        </span>
      ),
    },
    {
      key: "ouvrage_title",
      header: "Ouvrage étudié",
      cell: (row) => (
        <div className="flex items-center gap-3 min-w-[240px]">
          <Link
            href={row.ouvrage_id ? `/catalog/reader/${row.ouvrage_id}` : "/student/books"}
            className="shrink-0"
            title={row.ouvrage_title}
          >
            <BookCover
              book={{
                id: row.ouvrage_id || row.id,
                title: row.ouvrage_title,
                discipline: row.ouvrage_discipline,
                cover_url: row.ouvrage_cover_url,
              }}
              size="xs"
            />
          </Link>
          <div className="min-w-0">
            <Link
              href={row.ouvrage_id ? `/catalog/reader/${row.ouvrage_id}` : "/student/books"}
              className="font-serif font-bold text-navy text-xs truncate max-w-[220px] hover:text-gold transition-colors block"
            >
              {row.ouvrage_title}
            </Link>
            <p className="text-[10px] text-foreground-muted">
              Session #{String(row.id).slice(0, 8)}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "ouvrage_discipline",
      header: "Matière / Discipline",
      cell: (row) => (
        <span className="text-[10px] font-bold uppercase tracking-wider text-gold px-2.5 py-0.5 rounded-md bg-navy/5 border border-gold/30">
          {row.ouvrage_discipline || "Général"}
        </span>
      ),
    },
    {
      key: "duration_minutes",
      header: "Temps d'étude",
      cell: (row) => (
        <div className="flex items-center gap-1.5 font-mono font-bold text-navy text-xs">
          <Clock className="w-3.5 h-3.5 text-gold shrink-0" />
          <span>{row.duration_minutes} min</span>
        </div>
      ),
    },
    {
      key: "pages_read",
      header: "Pages lues",
      cell: (row) => (
        <span className="font-mono text-navy font-semibold text-xs">
          {row.pages_read} page{row.pages_read > 1 ? "s" : ""}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Action",
      className: "text-right",
      cell: (row) => (
        <Link
          href={row.ouvrage_id ? `/catalog/reader/${row.ouvrage_id}` : "/student/books"}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy hover:bg-navy-hover text-white text-[11px] font-bold transition-colors shadow-xs"
        >
          <span>Reprendre</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-gold" />
        </Link>
      ),
    },
  ];

  // Carte responsive mobile pour chaque session
  const renderMobileCard = (row: SessionRow) => (
    <div className="p-4 rounded-3xl border border-border bg-background space-y-3 shadow-xs">
      <div className="flex items-center gap-3.5">
        <Link
          href={row.ouvrage_id ? `/catalog/reader/${row.ouvrage_id}` : "/student/books"}
          className="shrink-0"
        >
          <BookCover
            book={{
              id: row.ouvrage_id || row.id,
              title: row.ouvrage_title,
              discipline: row.ouvrage_discipline,
              cover_url: row.ouvrage_cover_url,
            }}
            size="xs"
          />
        </Link>
        <div className="min-w-0 flex-1 space-y-0.5">
          <span className="text-[10px] font-bold text-gold uppercase tracking-wider block">
            {row.ouvrage_discipline || "Académique"}
          </span>
          <p className="font-serif font-bold text-navy text-xs sm:text-sm truncate">
            {row.ouvrage_title}
          </p>
          <p className="text-[10px] text-foreground-muted">
            {formatDate(row.session_date)}
          </p>
        </div>
      </div>

      <div className="pt-2 border-t border-border flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-mono font-bold text-navy">
          <Clock className="w-3.5 h-3.5 text-gold" />
          <span>{row.duration_minutes} min &bull; {row.pages_read} pages</span>
        </div>

        <Link
          href={row.ouvrage_id ? `/catalog/reader/${row.ouvrage_id}` : "/student/books"}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover"
        >
          <span>Lire</span>
          <ArrowUpRight className="w-3 h-3 text-gold" />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto min-w-0 pr-14 sm:pr-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/student" className="hover:text-navy transition-colors">
          Mon Espace
        </Link>
        <span>/</span>
        <span className="text-navy font-semibold">Historique &amp; Statistiques</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/student"
            className="inline-flex items-center gap-1.5 text-xs text-navy font-bold hover:underline mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour à l&apos;espace étudiant</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
            <History className="w-4 h-4 text-gold" />
            <span>Suivi Pédagogique &amp; Assiduité</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-navy">
            Historique &amp; Statistiques d&apos;Étude
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-1.5 max-w-2xl leading-relaxed">
            Consultez votre assiduité, vos heures d&apos;étude active et vos sessions de lecture récentes.
          </p>
        </div>

        <Link
          href="/student/books"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold transition-colors shrink-0 shadow-xs"
        >
          <span>Ma bibliothèque</span>
          <ArrowUpRight className="w-4 h-4 text-gold" />
        </Link>
      </div>

      {/* ── Erreur ────────────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-2xl border border-error/30 bg-error/10 text-error text-xs sm:text-sm font-medium">
          {error}
        </div>
      )}

      {/* ── KPIs & Graphiques Dynamiques ──────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} h="h-44" />
          ))}
        </div>
      ) : stats ? (
        <StudentKpiCharts stats={stats} />
      ) : null}

      {/* ── DataTable Officielle des Sessions Récentes ────────────────── */}
      <div className="space-y-4 pt-2">
        <DataTable<SessionRow>
          data={allSessions}
          columns={columns}
          rowKey="id"
          loading={loading}
          searchPlaceholder="Rechercher une session par titre d'ouvrage ou matière..."
          filterKey="ouvrage_discipline"
          filterPlaceholder="Toutes disciplines"
          pageSize={10}
          pageSizeOptions={[10, 20, 50]}
          mobileCard={renderMobileCard}
          emptyState={
            <div className="py-20 px-6 rounded-3xl bg-background border border-dashed border-border text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-navy/5 flex items-center justify-center mx-auto text-foreground-muted">
                <History className="w-7 h-7 opacity-60" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="font-serif font-bold text-navy text-lg">
                  Aucune session enregistrée
                </h3>
                <p className="text-xs text-foreground-muted leading-relaxed">
                  Vos sessions de lecture apparaîtront ici automatiquement dès vos premières lectures sur la liseuse.
                </p>
              </div>
              <Link
                href="/student/books"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors min-h-[44px] shadow-xs cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-gold" />
                <span>Ouvrir ma bibliothèque</span>
              </Link>
            </div>
          }
        />
      </div>
    </div>
  );
}
