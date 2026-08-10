"use client";

import React from "react";
import { BookOpen, DollarSign, Download, TrendingUp, Calendar, ShieldCheck } from "lucide-react";
import { AuthorStats } from "@/lib/types/author";
import { ActivityChartCard } from "@/components/ui/activity-chart-card";
import { ActivityCard } from "@/components/ui/activity-card";

interface AuthorKpiChartsProps {
  stats: AuthorStats;
}

export function AuthorKpiCharts({ stats }: AuthorKpiChartsProps) {
  const chartData = stats.monthly_sales.map((m) => ({
    day: m.month,
    value: m.sales,
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
      {/* Card 1: 21st.dev ActivityChartCard (par ravikatiyar162) */}
      <ActivityChartCard
        title="Ventes Mensuelles"
        totalValue={`${stats.total_sales} ex.`}
        data={chartData}
        className="col-span-1 border-border shadow-xs h-full"
      />

      {/* Card 2: 21st.dev ActivityCard (par kokonutd) */}
      <ActivityCard
        category="Droits d'Auteur"
        title="Revenus & Performance"
        metrics={[
          { label: "Revenus", value: `${(stats.total_revenue / 1000).toFixed(0)}k`, trend: 100, unit: "FCFA" },
          { label: "Télécharg.", value: `${stats.total_downloads}`, trend: 85, unit: "lectures" },
          { label: "Solde dû", value: `${(stats.pending_payout / 1000).toFixed(0)}k`, trend: 90, unit: "FCFA" },
        ]}
        dailyGoals={[
          { id: "1", title: "Rapport de Ventes Juillet 2026", isCompleted: true },
          { id: "2", title: "Paiement Trimestriel Prochain", isCompleted: false },
        ]}
        className="col-span-1 border-border shadow-xs h-full"
      />

      {/* Card 3: Répartition des Ventes par Ouvrage */}
      <div className="bg-background border border-border rounded-2xl p-5 space-y-4 shadow-xs flex flex-col justify-between h-full">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider">Top Ouvrages Vendu</span>
            <div className="text-xl font-bold font-serif text-navy">2 Livres Publiés</div>
          </div>
          <div className="p-2.5 rounded-xl bg-navy/5 text-navy border border-border shrink-0">
            <TrendingUp className="w-5 h-5 text-gold" />
          </div>
        </div>

        <div className="space-y-2.5 pt-1 text-xs">
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="font-semibold text-navy truncate max-w-[170px]">Droit Foncier au Bénin</span>
              <span className="text-foreground-muted">245 ex. (67%)</span>
            </div>
            <div className="w-full bg-background-secondary h-2 rounded-full overflow-hidden border border-border">
              <div className="bg-navy h-full rounded-full w-[67%]" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="font-semibold text-navy truncate max-w-[170px]">Institutions Politiques</span>
              <span className="text-foreground-muted">120 ex. (33%)</span>
            </div>
            <div className="w-full bg-background-secondary h-2 rounded-full overflow-hidden border border-border">
              <div className="bg-emerald-700 h-full rounded-full w-[33%]" />
            </div>
          </div>
        </div>
      </div>

      {/* Card 4: Prochain Versement Prévu */}
      <div className="bg-background border border-border rounded-2xl p-5 space-y-4 shadow-xs flex flex-col justify-between h-full">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider">Prochain Versement</span>
            <div className="text-xl font-bold font-serif text-navy">{stats.pending_payout.toLocaleString("fr-FR")} FCFA</div>
          </div>
          <div className="p-2.5 rounded-xl bg-gold/10 text-gold border border-gold/30 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 text-xs bg-background-secondary p-3 rounded-xl border border-border">
          <Calendar className="w-4 h-4 text-gold shrink-0" />
          <span className="text-foreground-muted text-[11px]">
            Versement prévu le <strong className="text-navy font-semibold">{stats.next_payout_date}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
