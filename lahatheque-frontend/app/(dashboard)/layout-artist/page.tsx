"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { ProgressMetricCard } from "@/components/ui/progress-metric-card";
import { getMaquettisteKpis } from "@/lib/services/layout-artist";
import type { MaquettisteKpi } from "@/lib/types/layout-artist";
import {
  BookOpen,
  PlusCircle,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  Sparkles,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

export default function MaquettisteOverviewPage() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<MaquettisteKpi | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const kpiData = await getMaquettisteKpis();
        setKpis(kpiData);
      } catch (err) {
        console.error("Erreur de chargement du dashboard maquettiste", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 sm:space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-navy border border-navy-hover text-white shadow-md">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-bold mb-2 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Espace Maquettiste • Création du Catalogue
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif tracking-tight">
            Bonjour, {user?.first_name || "Maquettiste"} 👋
          </h1>
          <p className="text-xs sm:text-sm text-navy-light mt-1">
            Déposez les ouvrages, classifiez-les avec l&apos;aide de l&apos;IA et préparez les publications.
          </p>
        </div>

        <Link
          href="/layout-artist/deposits/new"
          className="px-4 py-2.5 rounded-xl bg-gold text-navy font-bold text-xs hover:bg-gold-light transition-all flex items-center gap-2 shadow-sm shrink-0 min-h-[44px]"
        >
          <PlusCircle className="w-4 h-4" />
          Nouveau Dépôt
        </Link>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/layout-artist/deposits?status=draft" className="block">
          <ProgressMetricCard
            title="Dépôts en Brouillon"
            total={`${kpis?.draftCount || 1} ouvrage${(kpis?.draftCount || 1) > 1 ? "s" : ""}`}
            percent="En cours"
            trend="up"
            accent="neutral"
            delta="+1 cette semaine"
            deltaLabel="à finaliser"
            data={[
              { value: 0, date: "01 Juil" },
              { value: 1, date: "08 Juil" },
              { value: 1, date: "15 Juil" },
              { value: 1, date: "22 Juil" },
            ]}
          />
        </Link>

        <Link href="/layout-artist/deposits?status=pending_validation" className="block">
          <ProgressMetricCard
            title="En Attente de Validation"
            total={`${kpis?.pendingValidationCount || 1} dépôt${(kpis?.pendingValidationCount || 1) > 1 ? "s" : ""}`}
            percent="Transmis"
            trend="up"
            accent="gold"
            delta="Chef Maquettiste"
            deltaLabel="en étude"
            data={[
              { value: 0, date: "01 Juil" },
              { value: 0, date: "08 Juil" },
              { value: 1, date: "15 Juil" },
              { value: 1, date: "22 Juil" },
            ]}
          />
        </Link>

        <Link href="/layout-artist/deposits?status=revision_requested" className="block">
          <ProgressMetricCard
            title="Corrections Demandées"
            total={`${kpis?.revisionRequestedCount || 1} dossier${(kpis?.revisionRequestedCount || 1) > 1 ? "s" : ""}`}
            percent="Action requise"
            trend="down"
            accent="rose"
            delta="Commentaire chef"
            deltaLabel="à traiter"
            data={[
              { value: 0, date: "01 Juil" },
              { value: 1, date: "08 Juil" },
              { value: 1, date: "15 Juil" },
              { value: 1, date: "22 Juil" },
            ]}
          />
        </Link>

        <Link href="/layout-artist/deposits?status=published" className="block">
          <ProgressMetricCard
            title="Publiés sur la Vitrine"
            total={`${kpis?.publishedCount || 1} livre${(kpis?.publishedCount || 1) > 1 ? "s" : ""}`}
            percent="En ligne"
            trend="up"
            accent="emerald"
            delta="+1 ce mois"
            deltaLabel="validé"
            data={[
              { value: 0, date: "01 Juil" },
              { value: 0, date: "08 Juil" },
              { value: 1, date: "15 Juil" },
              { value: 1, date: "22 Juil" },
            ]}
          />
        </Link>
      </div>

      {/* Actions Rapides */}
      <div className="p-6 rounded-3xl bg-background-secondary border border-border space-y-4 shadow-xs">
        <div className="pb-3 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold font-serif text-navy">Actions Rapides &amp; Raccourcis</h2>
            <p className="text-[11px] text-foreground-muted mt-0.5">Accès direct à la gestion du catalogue</p>
          </div>
          <Link
            href="/layout-artist/deposits"
            className="text-xs font-bold text-gold hover:text-gold-dark flex items-center gap-1"
          >
            Tous mes dépôts <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              label: "Nouveau Dépôt",
              desc: "Déposer un PDF/EPUB et classifier avec l'IA",
              icon: PlusCircle,
              href: "/layout-artist/deposits/new",
              primary: true,
            },
            {
              label: "Mes Dépôts Personnels",
              desc: "Consulter l'historique et l'avancement des validations",
              icon: BookOpen,
              href: "/layout-artist/deposits",
            },
            {
              label: "Corrections URGENTES",
              desc: "Voir les demandes de retouche du Chef Maquettiste",
              icon: AlertCircle,
              href: "/layout-artist/deposits?status=revision_requested",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between group shadow-xs ${
                item.primary
                  ? "bg-navy border-navy-hover text-white hover:border-gold"
                  : "bg-background border-border hover:border-gold text-foreground"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`p-2.5 rounded-xl shrink-0 ${
                    item.primary ? "bg-gold/20 text-gold" : "bg-navy-light text-navy"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p
                    className={`font-bold text-xs truncate ${
                      item.primary ? "text-white" : "text-navy"
                    }`}
                  >
                    {item.label}
                  </p>
                  <p className="text-[10px] text-foreground-muted truncate">{item.desc}</p>
                </div>
              </div>
              <ChevronRight
                className={`w-4 h-4 shrink-0 transition-colors ${
                  item.primary ? "text-gold" : "text-foreground-muted group-hover:text-gold"
                }`}
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
