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
  Plus,
  FileUp,
  BookOpen,
} from "lucide-react";

// Générateur de timeline dynamique basée sur la date réelle
const getRollingTimeline = (count: number) => {
  const monthNames = ["Janv", "Févr", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];
  const now = new Date();
  const res = [];
  for (let i = 3; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    res.push({
      date: `${String(d.getDate()).padStart(2, "0")} ${monthNames[d.getMonth()]}`,
      value: i === 0 ? count : Math.max(0, count - i),
    });
  }
  return res;
};

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
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 sm:space-y-8 animate-in fade-in duration-300">
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
            Déposez des ouvrages certifiés avec validation directe ou supervisez les épreuves soumises par les maquettistes.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <Link
            href="/chief-layout/catalog"
            className="px-4 py-2.5 rounded-xl bg-background border border-border text-navy font-bold text-xs hover:border-gold hover:text-gold transition-all flex items-center gap-2 shadow-xs shrink-0 min-h-[44px]"
          >
            <BookOpen className="w-4 h-4 text-gold" />
            Catalogue des Ouvrages
          </Link>

          <Link
            href="/chief-layout/deposit"
            className="px-4 py-2.5 rounded-xl bg-gold text-navy font-bold text-xs hover:bg-gold-light transition-all flex items-center gap-2 shadow-sm shrink-0 min-h-[44px]"
          >
            <Plus className="w-4 h-4 text-navy" />
            Déposer un Ouvrage
          </Link>

          <Link
            href="/chief-layout/validation"
            className="px-4 py-2.5 rounded-xl bg-navy-hover text-white font-bold text-xs hover:bg-navy-light/20 transition-all flex items-center gap-2 border border-border shrink-0 min-h-[44px]"
          >
            <CheckSquare className="w-4 h-4 text-gold" />
            Dépôts à Valider
          </Link>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/chief-layout/validation" className="block">
          <ProgressMetricCard
            title="Dépôts à Valider"
            total={`${kpis?.pendingValidationCount ?? 0} dossier${(kpis?.pendingValidationCount ?? 0) > 1 ? "s" : ""}`}
            percent="Action requise"
            trend="up"
            accent="gold"
            delta="À examiner"
            deltaLabel="cette semaine"
            data={kpis?.timelines?.pending || getRollingTimeline(kpis?.pendingValidationCount ?? 0)}
          />
        </Link>

        <Link href="/chief-layout/catalog" className="block">
          <ProgressMetricCard
            title="Validés ce Mois"
            total={`${kpis?.validatedThisMonth ?? 0} livre${(kpis?.validatedThisMonth ?? 0) > 1 ? "s" : ""}`}
            percent="Mis en ligne"
            trend="up"
            accent="emerald"
            delta="Publié"
            deltaLabel="ce mois"
            data={kpis?.timelines?.published || getRollingTimeline(kpis?.validatedThisMonth ?? 0)}
          />
        </Link>

        <Link href="/chief-layout/history" className="block">
          <ProgressMetricCard
            title="Renvoyés en Correction"
            total={`${kpis?.revisionRequestedThisMonth ?? 0} dossier${(kpis?.revisionRequestedThisMonth ?? 0) > 1 ? "s" : ""}`}
            percent="En retouche"
            trend="down"
            accent="rose"
            delta="Suivi maquettiste"
            deltaLabel="ce mois"
            data={kpis?.timelines?.rejected || getRollingTimeline(kpis?.revisionRequestedThisMonth ?? 0)}
          />
        </Link>

        <ProgressMetricCard
          title="Délai Moyen de Traitement"
          total={`${kpis?.averageProcessingTimeHours ?? 4.5} h`}
          percent="-2h"
          trend="up"
          accent="emerald"
          delta="Dépôt → Décision"
          deltaLabel="réactivité"
          data={getRollingTimeline(Math.round(kpis?.averageProcessingTimeHours ?? 4.5))}
        />
      </div>

      {/* Raccourcis & Actions Rapides */}
      <div className="p-6 rounded-3xl bg-background-secondary border border-border space-y-4 shadow-xs">
        <div className="pb-3 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold font-serif text-navy">Actions Rapides &amp; Gestion des Dépôts</h2>
            <p className="text-[11px] text-foreground-muted mt-0.5">Dépôt certifié, catalogue &amp; supervision éditoriale</p>
          </div>
          <Link
            href="/chief-layout/catalog"
            className="text-xs font-bold text-gold hover:text-gold-dark flex items-center gap-1"
          >
            Voir tout le catalogue <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/chief-layout/catalog"
            className="p-5 rounded-2xl bg-background border border-border hover:border-gold transition-all flex items-center justify-between group shadow-xs cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gold/15 text-gold">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-navy">Catalogue des Ouvrages</p>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Modifier les attributs, tarifs et disponibilité papier
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-foreground-muted group-hover:text-gold group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            href="/chief-layout/deposit"
            className="p-5 rounded-2xl bg-gold/10 border border-gold/40 hover:bg-gold/20 transition-all flex items-center justify-between group shadow-xs cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gold text-navy font-bold">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-sm text-navy">Déposer un Ouvrage</p>
                  <span className="text-[9px] font-bold uppercase bg-gold text-navy px-1.5 py-0.5 rounded">Direct</span>
                </div>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Publication immédiate sans étape d&apos;approbation
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gold group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/chief-layout/validation"
            className="p-5 rounded-2xl bg-navy border border-navy-hover text-white hover:border-gold transition-all flex items-center justify-between group shadow-sm cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gold/20 text-gold">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-white">File de Validation</p>
                <p className="text-xs text-white/70 mt-0.5">
                  Examiner les PDF/EPUB, classifier et valider
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gold group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/chief-layout/history"
            className="p-5 rounded-2xl bg-background border border-border hover:border-gold transition-all flex items-center justify-between group shadow-xs cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-navy-light text-navy">
                <History className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-navy">Historique</p>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Consulter tous les ouvrages validés et retouches
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-foreground-muted group-hover:text-gold group-hover:translate-x-1 transition-all" />
          </Link>
        </div>
      </div>
    </div>
  );
}
