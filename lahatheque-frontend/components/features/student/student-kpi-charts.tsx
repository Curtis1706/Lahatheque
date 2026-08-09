"use client";

import React from "react";
import { BookOpen, Flame, Award, TrendingUp } from "lucide-react";
import { StudentStudyStats } from "@/lib/types/student";
import { ActivityChartCard } from "@/components/ui/activity-chart-card";
import { ActivityCard } from "@/components/ui/activity-card";

interface StudentKpiChartsProps {
  stats: StudentStudyStats;
}

export function StudentKpiCharts({ stats }: StudentKpiChartsProps) {
  const chartData = stats.daily_activity.map((d) => ({
    day: d.day,
    value: d.hours,
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Card 1: 21st.dev ActivityChartCard (par ravikatiyar162) */}
      <ActivityChartCard
        title="Temps d'Étude"
        totalValue={`${stats.weekly_hours}h`}
        data={chartData}
        className="col-span-1 border-border shadow-xs"
      />

      {/* Card 2: 21st.dev ActivityCard (par kokonutd) */}
      <ActivityCard
        category="Rings d'Objectifs"
        title="Progression d'Étude"
        metrics={[
          { label: "Manuels", value: "4", trend: 100, unit: "lus" },
          { label: "Heures", value: `${stats.weekly_hours}`, trend: 85, unit: "hrs" },
          { label: "Progrès", value: `${stats.overall_progress}%`, trend: stats.overall_progress, unit: "fait" },
        ]}
        dailyGoals={[
          { id: "1", title: "Chapitre 4 Droit Constitutionnel", isCompleted: true },
          { id: "2", title: "Synthèse Économie UCAD", isCompleted: false },
        ]}
      />

      {/* Card 3: Discipline Distribution Card */}
      <div className="bg-background border border-border rounded-2xl p-5 space-y-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider">Répartition des Matières</span>
            <div className="text-xl font-bold font-serif text-navy">3 Disciplines</div>
          </div>
          <div className="p-2.5 rounded-xl bg-navy/5 text-navy border border-border">
            <TrendingUp className="w-5 h-5 text-gold" />
          </div>
        </div>

        {/* Stacked Progress Bar */}
        <div className="space-y-2 pt-1">
          <div className="w-full bg-background-secondary h-3 rounded-full flex overflow-hidden border border-border p-0.5 gap-0.5">
            {stats.discipline_breakdown.map((item, idx) => (
              <div
                key={idx}
                className={`${item.color} h-full rounded-xs`}
                style={{ width: `${item.percentage}%` }}
                title={`${item.name} : ${item.percentage}%`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-[10px] text-foreground-muted font-medium pt-1">
            {stats.discipline_breakdown.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${item.color}`} />
                <span>{item.name} ({item.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card 4: Streak & Assiduity Card */}
      <div className="bg-background border border-border rounded-2xl p-5 space-y-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider">Série de Lecture</span>
            <div className="text-xl font-bold font-serif text-navy">{stats.current_streak_days} jours consécutifs</div>
          </div>
          <div className="p-2.5 rounded-xl bg-gold/10 text-gold border border-gold/30">
            <Flame className="w-5 h-5 fill-current" />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1 text-xs">
          <Award className="w-4 h-4 text-gold shrink-0" />
          <span className="text-foreground-muted text-[11px]">
            Badge <strong className="text-navy font-semibold">Étudiant Assidu</strong> débloqué !
          </span>
        </div>
      </div>
    </div>
  );
}
