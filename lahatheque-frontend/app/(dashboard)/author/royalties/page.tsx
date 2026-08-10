"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRoyaltyStatements, getAuthorStats } from "@/lib/services/author";
import { RoyaltyStatement, AuthorStats } from "@/lib/types/author";
import { 
  DollarSign, 
  ArrowLeft, 
  Download, 
  Lock, 
  FileCheck, 
  Calendar, 
  CheckCircle2, 
  Clock
} from "lucide-react";
import { AuthorKpiCharts } from "@/components/features/author/author-kpi-charts";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, EmptyIcon, EmptyTitle, EmptyDescription } from "@/components/ui/empty-state";

export default function AuthorRoyaltiesPage() {
  const [statements, setStatements] = useState<RoyaltyStatement[]>([]);
  const [stats, setStats] = useState<AuthorStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [stmts, statsData] = await Promise.all([
          getRoyaltyStatements(),
          getAuthorStats()
        ]);
        setStatements(stmts);
        setStats(statsData);
      } catch (err) {
        console.error("Erreur de chargement des redevances", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
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
            <DollarSign className="w-4 h-4" />
            <span>Droits d&apos;Auteur & Relevés de Versements</span>
          </div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-navy">
            Droits Acquis & Historique de Paiement
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted max-w-2xl">
            Suivez le détail de vos redevances d&apos;auteur générées par les ventes et téléchargez vos relevés officiels de droits.
          </p>
        </div>
      </div>

      {/* Rappel du cadre contractuel géré par le Juriste (Section 3.4) */}
      <div className="bg-navy/5 border border-gold/30 p-4 rounded-2xl flex items-start gap-3 text-xs text-foreground-muted">
        <Lock className="w-4 h-4 text-gold shrink-0 mt-0.5" />
        <div>
          <strong className="text-navy font-semibold block">Cadre Contractuel & Pourcentages de Droits</strong>
          Conformément au cahier des charges LAHAThèque (section 4.1 & 3.4), les pourcentages de droits sont contractuellement définis et validés par le Juriste. Les versements sont automatiquement calculés et crédités selon les rapports de ventes officiels.
        </div>
      </div>

      {/* 3. TABLEAU DES RELEVÉS DE VERSEMENTS AVEC JUSTIFICATIFS EXPORTABLES PDF (Section 3.4 & 13) */}
      <div className="space-y-4">
        <h2 className="font-serif font-bold text-navy text-xl flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-gold" />
          Historique des Relevés de Droits ({statements.length})
        </h2>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="bg-background-secondary h-20 rounded-2xl border border-border" />
            <div className="bg-background-secondary h-20 rounded-2xl border border-border" />
          </div>
        ) : statements.length === 0 ? (
          <EmptyState>
            <EmptyIcon icon={DollarSign} />
            <EmptyTitle>Aucun relevé de droits généré</EmptyTitle>
            <EmptyDescription>Vos relevés de versements apparaîtront automatiquement à la clôture de chaque période de ventes.</EmptyDescription>
          </EmptyState>
        ) : (
          <div className="space-y-4">
            {statements.map((stmt) => (
              <div key={stmt.id} className="bg-background border border-border p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={stmt.status} />
                    <span className="text-xs font-bold text-navy">{stmt.statement_period}</span>
                  </div>
                  <h3 className="font-serif font-bold text-navy text-base line-clamp-1">
                    {stmt.book_title}
                  </h3>
                  <p className="text-xs text-foreground-muted">
                    {stmt.sales_count} ventes • Taux de droits contractuel : <strong className="text-navy">{stmt.royalty_rate_percent}%</strong>
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                  <div className="text-right">
                    <span className="font-serif text-lg font-bold text-navy block">
                      {stmt.amount.toLocaleString("fr-FR")} {stmt.currency}
                    </span>
                    <span className="text-[10px] text-foreground-muted">
                      {stmt.payout_date ? `Payé le ${new Date(stmt.payout_date).toLocaleDateString("fr-FR")}` : "En cours de traitement"}
                    </span>
                  </div>

                  <Link
                    href={`/author/royalties/${stmt.id}`}
                    className="p-2.5 rounded-xl bg-background-secondary border border-border text-navy hover:border-gold transition-colors flex items-center gap-1 text-xs font-semibold"
                    title="Voir le détail et le relevé PDF"
                  >
                    <Download className="w-4 h-4 text-gold" />
                    <span className="hidden md:inline">Relevé PDF</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
