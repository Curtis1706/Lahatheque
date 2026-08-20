"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { ProgressMetricCard } from "@/components/ui/progress-metric-card";
import { getChefKpis } from "@/lib/services/layout-artist";
import type { ChefMaquettisteKpi } from "@/lib/types/layout-artist";
import {
  ShieldCheck,
  CheckSquare,
  History,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

export default function ChefMaquettisteOverviewPage() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<ChefMaquettisteKpi | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getChefKpis();
        setKpis(data);
      } catch (err) {
        console.error("Erreur de chargement du dashboard chef maquettiste", err);
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
            Espace Chef Maquettiste • Validation Éditoriale
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif tracking-tight">
            Bonjour, {user?.first_name || "Chef Maquettiste"}
          </h1>
          <p className="text-xs sm:text-sm text-navy-light mt-1">
            Validez les dépôts des maquettistes pour déclencher la mise en ligne automatique sur la vitrine publique.
          </p>
        </div>

        <Link
          href="/chief-layout/validation"
          className="px-4 py-2.5 rounded-xl bg-gold text-navy font-bold text-xs hover:bg-gold-light transition-all flex items-center gap-2 shadow-sm shrink-0 min-h-[44px]"
        >
          <CheckSquare className="w-4 h-4" />
          Dépôts à Valider
        </Link>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/chief-layout/validation" className="block">
          <ProgressMetricCard
            title="Dépôts à Valider"
            total={`${kpis?.pendingValidationCount || 2} dossier${(kpis?.pendingValidationCount || 2) > 1 ? "s" : ""}`}
            percent="Action requise"
            trend="up"
            accent="gold"
            delta="+2 cette semaine"
            deltaLabel="à examiner"
            data={[
              { value: 1, date: "01 Juil" },
              { value: 1, date: "08 Juil" },
              { value: 2, date: "15 Juil" },
              { value: 2, date: "22 Juil" },
            ]}
          />
        </Link>

        <Link href="/chief-layout/history" className="block">
          <ProgressMetricCard
            title="Validés ce Mois"
            total={`${kpis?.validatedThisMonth || 1} livre${(kpis?.validatedThisMonth || 1) > 1 ? "s" : ""}`}
            percent="Mis en ligne"
            trend="up"
            accent="emerald"
            delta="+1 ce mois"
            deltaLabel="publié"
            data={[
              { value: 0, date: "01 Juil" },
              { value: 0, date: "08 Juil" },
              { value: 1, date: "15 Juil" },
              { value: 1, date: "22 Juil" },
            ]}
          />
        </Link>

        <Link href="/chief-layout/history" className="block">
          <ProgressMetricCard
            title="Renvoyés en Correction"
            total={`${kpis?.revisionRequestedThisMonth || 1} dossier${(kpis?.revisionRequestedThisMonth || 1) > 1 ? "s" : ""}`}
            percent="En retouche"
            trend="down"
            accent="rose"
            delta="Suivi maquettiste"
            deltaLabel="ce mois"
            data={[
              { value: 0, date: "01 Juil" },
              { value: 1, date: "08 Juil" },
              { value: 1, date: "15 Juil" },
              { value: 1, date: "22 Juil" },
            ]}
          />
        </Link>

        <ProgressMetricCard
          title="Délai Moyen de Traitement"
          total={`${kpis?.averageProcessingTimeHours || 18.5} h`}
          percent="-2h"
          trend="up"
          accent="emerald"
          delta="Dépôt → Décision"
          deltaLabel="réactivité"
          data={[
            { value: 24, date: "01 Juil" },
            { value: 22, date: "08 Juil" },
            { value: 19, date: "15 Juil" },
            { value: 18.5, date: "22 Juil" },
          ]}
        />
      </div>

      {/* Raccourcis & Actions Rapides */}
      <div className="p-6 rounded-3xl bg-background-secondary border border-border space-y-4 shadow-xs">
        <div className="pb-3 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold font-serif text-navy">Actions Rapides &amp; Gestion des Dépôts</h2>
            <p className="text-[11px] text-foreground-muted mt-0.5">Supervision globale des maquettistes</p>
          </div>
          <Link
            href="/chief-layout/validation"
            className="text-xs font-bold text-gold hover:text-gold-dark flex items-center gap-1"
          >
            Examiner la file d&apos;attente <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/chief-layout/validation"
            className="p-5 rounded-2xl bg-navy border border-navy-hover text-white hover:border-gold transition-all flex items-center justify-between group shadow-xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-3 rounded-xl bg-gold/20 text-gold shrink-0">
                <CheckSquare className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-white truncate">Dépôts en Attente de Validation</p>
                <p className="text-xs text-navy-light truncate">Examiner et publier sur la vitrine</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gold shrink-0 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/chief-layout/history"
            className="p-5 rounded-2xl bg-background border border-border hover:border-gold transition-all flex items-center justify-between group shadow-xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-3 rounded-xl bg-navy-light text-navy shrink-0">
                <History className="w-6 h-6 text-gold" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-navy truncate">Historique des Validations</p>
                <p className="text-xs text-foreground-muted truncate">Consulter les décisions antérieures</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-foreground-muted group-hover:text-gold shrink-0 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
