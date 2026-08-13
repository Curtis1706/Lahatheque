"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { KpiCard } from "@/components/ui/kpi-card";
import { getAuthorKpis, getAuthorSubmissions } from "@/lib/services/author";
import type { AuthorKpis, AuthorSubmission } from "@/lib/types/author";
import {
  PenTool,
  BookOpen,
  Eye,
  DollarSign,
  Download,
  PlusCircle,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Clock,
  CheckCircle2,
} from "lucide-react";

export default function AuthorOverviewPage() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<AuthorKpis | null>(null);
  const [submissions, setSubmissions] = useState<AuthorSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [kData, sData] = await Promise.all([
          getAuthorKpis(),
          getAuthorSubmissions(),
        ]);
        setKpis(kData);
        setSubmissions(sData.slice(0, 3));
      } catch (err) {
        console.error("Erreur de chargement du dashboard auteur", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 sm:space-y-8">
      {/* Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-navy border border-navy-hover text-white shadow-md">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-bold mb-2 uppercase tracking-wider">
            <PenTool className="w-3.5 h-3.5" />
            {kpis?.authorName || "Prof. Augustin CHAKIROU"}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif tracking-tight">
            Espace Auteur — Suivi des Parutions &amp; Droits 🖋️
          </h1>
          <p className="text-xs sm:text-sm text-navy-light mt-1">
            Consultez le bilan commercial de vos livres publiés, vos droits rétribués et déposez de nouveaux manuscrits pour étude.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/author/submissions/new"
            className="px-4 py-2.5 rounded-xl bg-gold text-navy font-bold text-xs hover:bg-gold-light transition-all flex items-center gap-2 shadow-sm min-h-[44px]"
          >
            <PlusCircle className="w-4 h-4" />
            Nouveau Dépôt de Manuscrit
          </Link>
        </div>
      </div>

      {/* 4 KPI Cards animées (KpiCard de components/ui/kpi-card.tsx) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/author/books" className="block">
          <KpiCard
            label="Ventes Période (Livres Publiés)"
            value={kpis?.totalSales || 2310}
            icon={BookOpen}
            trend={14}
            trendPeriod="ce trimestre"
            theme="gold"
            subtext={`${kpis?.publishedBooksCount || 2} ouvrages publiés`}
            sparkline={[1200, 1600, 2000, 2310]}
          />
        </Link>

        <Link href="/author/books" className="block">
          <KpiCard
            label="Téléchargements &amp; DRM"
            value={kpis?.totalDownloads || 4490}
            icon={Download}
            trend={9}
            theme="blue"
            subtext="Consultations autorisées LCP"
            sparkline={[2800, 3400, 4000, 4490]}
          />
        </Link>

        <Link href="/author/royalties" className="block">
          <KpiCard
            label="Revenus Générés (Ventes Brutes)"
            value={kpis?.totalRevenueGenerated || 23000000}
            formatValue={(v) => `${v.toLocaleString("fr-FR")} XOF`}
            icon={DollarSign}
            trend={11}
            theme="emerald"
            subtext="Ensemble des ventes"
            sparkline={[14000000, 18000000, 21000000, 23000000]}
          />
        </Link>

        <Link href="/author/royalties" className="block">
          <KpiCard
            label="Prochain Paiement Prévu"
            value={kpis?.nextPaymentAmount || 960000}
            formatValue={(v) => `${v.toLocaleString("fr-FR")} XOF`}
            icon={Sparkles}
            trend={0}
            theme="amber"
            subtext={`Versement le ${kpis?.nextPaymentDate || "05 Oct 2025"}`}
            sparkline={[870000, 870000, 960000, 960000]}
          />
        </Link>
      </div>

      {/* Aperçu des Dépôts de Manuscrits en Étude (Étape 1 vs Étape 2) */}
      <div className="p-6 rounded-3xl bg-background-secondary border border-border space-y-4 shadow-xs">
        <div className="pb-3 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold font-serif text-navy">Suivi des Dépôts de Manuscrits en Étude</h2>
            <p className="text-[11px] text-foreground-muted mt-0.5">Avancement des manuscrits soumis pour évaluation éditoriale et préparation catalogue</p>
          </div>
          <Link href="/author/submissions" className="text-xs font-bold text-gold hover:text-gold-dark flex items-center gap-1">
            Voir tous mes dépôts <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-3">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className="p-4 rounded-2xl bg-background border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-gold/15 text-gold text-[10px] font-mono font-bold uppercase">
                    {sub.version_type}
                  </span>
                  <span className="text-[11px] text-foreground-muted">Soumis le {sub.submitted_at}</span>
                </div>
                <h3 className="font-serif font-bold text-navy text-sm truncate">{sub.title}</h3>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="px-3 py-1 rounded-full bg-navy/10 text-navy font-bold text-xs">
                  {sub.status === "study_pending"
                    ? "Étape 1 — En étude éditoriale"
                    : sub.status === "accepted"
                    ? "Étape 2 — Accepté / En préparation"
                    : sub.status === "correction_requested"
                    ? "Correction demandée"
                    : "Publié"}
                </span>
                <Link
                  href={`/author/submissions/${sub.id}`}
                  className="p-2 rounded-xl text-foreground-muted hover:text-navy hover:bg-navy/5 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
