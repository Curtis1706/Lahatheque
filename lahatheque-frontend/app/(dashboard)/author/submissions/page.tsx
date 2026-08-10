"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAuthorSubmissions, getAuthorStats } from "@/lib/services/author";
import { AuthorSubmission, AuthorStats } from "@/lib/types/author";
import { 
  PenTool, 
  Plus, 
  ArrowLeft, 
  Clock, 
  AlertTriangle, 
  ArrowUpRight
} from "lucide-react";
import { AuthorKpiCharts } from "@/components/features/author/author-kpi-charts";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, EmptyIcon, EmptyTitle, EmptyDescription } from "@/components/ui/empty-state";

export default function AuthorSubmissionsPage() {
  const [submissions, setSubmissions] = useState<AuthorSubmission[]>([]);
  const [stats, setStats] = useState<AuthorStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSubmissions() {
      try {
        setLoading(true);
        const [subsData, statsData] = await Promise.all([
          getAuthorSubmissions(),
          getAuthorStats()
        ]);
        setSubmissions(subsData);
        setStats(statsData);
      } catch (err) {
        console.error("Erreur de chargement des dépôts", err);
      } finally {
        setLoading(false);
      }
    }
    loadSubmissions();
  }, []);

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
            <PenTool className="w-4 h-4" />
            <span>Suivi des Manuscrits & Dépôts</span>
          </div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-navy">
            Mes Dépôts de Manuscrits
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted max-w-2xl">
            Suivez le statut de validation de vos projets de livres soumis au comité d&apos;édition LAHA Éditions.
          </p>
        </div>

        <Link
          href="/author/submissions/new"
          className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 self-start md:self-auto shrink-0 min-h-[44px]"
        >
          <Plus className="w-4 h-4 text-gold" />
          Déposer un Nouveau Manuscrit
        </Link>
      </div>

      {/* 3. LISTE DES DÉPÔTS */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          <div className="bg-background-secondary h-48 rounded-2xl border border-border" />
          <div className="bg-background-secondary h-48 rounded-2xl border border-border" />
        </div>
      ) : submissions.length === 0 ? (
        <EmptyState>
          <EmptyIcon icon={PenTool} />
          <EmptyTitle>Aucun manuscrit actuellement soumis</EmptyTitle>
          <EmptyDescription>Soumettez votre premier manuscrit pour étude avant finalisation et publication.</EmptyDescription>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {submissions.map((sub) => (
            <div key={sub.id} className="bg-background border border-border p-6 rounded-3xl space-y-4 shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <StatusBadge status={sub.status} />
                  <span className="text-[11px] font-bold text-gold uppercase tracking-wider bg-navy/5 px-2 py-0.5 rounded border border-gold/20">
                    {sub.version_type}
                  </span>
                </div>

                <h2 className="font-serif font-bold text-navy text-lg leading-snug">
                  {sub.title}
                </h2>

                {sub.summary && (
                  <p className="text-xs text-foreground-muted line-clamp-3">
                    {sub.summary}
                  </p>
                )}
              </div>

              {sub.status === "changes_requested" && sub.feedback_history && sub.feedback_history.length > 0 && (
                <div className="p-3 rounded-2xl bg-warning/10 border border-warning/30 text-warning text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Remarques de l&apos;équipe éditoriale</span>
                  </div>
                  <p className="text-[11px] italic">
                    &ldquo;{sub.feedback_history[0].message}&rdquo;
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-foreground-muted">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gold" />
                  Déposé le {new Date(sub.submitted_at).toLocaleDateString("fr-FR")}
                </span>
                <Link href={`/author/submissions/${sub.id}`} className="text-navy font-bold hover:underline flex items-center gap-1">
                  Fiche & Suivi
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
