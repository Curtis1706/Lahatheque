"use client";

import React from "react";
import { BookOpen, Flame, Award, TrendingUp, Sparkles, Clock, CheckCircle2 } from "lucide-react";
import type { StudentStudyStats } from "@/lib/types/student";
import type { HistoryStatsAPI } from "@/lib/services/student";
import { ActivityChartCard } from "@/components/ui/activity-chart-card";
import { ActivityCard } from "@/components/ui/activity-card";

interface StudentKpiChartsProps {
  stats: StudentStudyStats | HistoryStatsAPI;
}

export function StudentKpiCharts({ stats }: StudentKpiChartsProps) {
  const chartData = stats.daily_activity.map((d) => ({
    day: d.day,
    value: d.hours,
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
      {/* Card 1: 21st.dev ActivityChartCard */}
      <ActivityChartCard
        title="Temps d'Étude"
        totalValue={`${stats.weekly_hours}h`}
        data={chartData}
        className="col-span-1 border-border shadow-xs h-full"
      />

      {/* Card 2: 21st.dev ActivityCard */}
      <ActivityCard
        category="Objectifs d'Étude"
        title="Progression Globale"
        metrics={[
          { label: "Ouvrages", value: `${stats.books_completed_count || 0}`, trend: 100, unit: "lus" },
          { label: "Heures", value: `${stats.weekly_hours}`, trend: 85, unit: "hrs" },
          { label: "Progression", value: `${stats.overall_progress}%`, trend: stats.overall_progress, unit: "%" },
        ]}
        dailyGoals={[
          { id: "1", title: "Chapitre 4 Droit Constitutionnel", isCompleted: true },
          { id: "2", title: "Synthèse Économie & Gestion", isCompleted: false },
        ]}
        className="col-span-1 border-border shadow-xs h-full"
      />

      {/* Card 3: Discipline Distribution Card */}
      <div className="bg-background border border-border rounded-3xl p-5 space-y-4 shadow-xs flex flex-col justify-between h-full">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider">
              Répartition par Matière
            </span>
            <div className="text-xl font-bold font-serif text-navy">
              {stats.discipline_breakdown?.length || 0} Disciplines
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-navy/5 text-navy border border-border shrink-0">
            <TrendingUp className="w-5 h-5 text-gold" />
          </div>
        </div>

        {/* Stacked Progress Bar */}
        <div className="space-y-3 pt-1">
          <div className="w-full bg-background-secondary h-3 rounded-full flex overflow-hidden border border-border p-0.5 gap-0.5">
            {stats.discipline_breakdown?.map((item, idx) => (
              <div
                key={idx}
                className="h-full rounded-xs bg-gold"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: item.color || undefined,
                }}
                title={`${item.name} : ${item.percentage}%`}
              />
            ))}
          </div>
          <div className="flex flex-col gap-1.5 text-[11px] text-foreground-muted font-medium">
            {stats.discipline_breakdown?.slice(0, 3).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 truncate max-w-[70%]">
                  <span
                    className="w-2 h-2 rounded-full shrink-0 bg-gold"
                    style={{ backgroundColor: item.color || undefined }}
                  />
                  <span className="text-navy font-semibold truncate">{item.name}</span>
                </div>
                <span className="font-mono text-navy">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card 4: Streak & Assiduity Card */}
      <div className="bg-background border border-border rounded-3xl p-5 space-y-4 shadow-xs flex flex-col justify-between h-full">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider">
              Série de Lecture
            </span>
            <div className="text-xl font-bold font-serif text-navy">
              {stats.current_streak_days} jours consécutifs
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-gold/15 text-gold border border-gold/30 shrink-0">
            <Flame className="w-5 h-5 fill-current" />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 text-xs bg-background-secondary p-3 rounded-2xl border border-border">
          <Award className="w-5 h-5 text-gold shrink-0" />
          <span className="text-foreground-muted text-[11px]">
            Badge <strong className="text-navy font-semibold">Étudiant Assidu</strong> débloqué !
          </span>
        </div>
      </div>
    </div>
  );
}
