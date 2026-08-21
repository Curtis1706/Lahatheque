"use client";

import React from "react";
import { Flame, Award, TrendingUp, CheckCircle2, Circle } from "lucide-react";
import type { StudentStudyStats } from "@/lib/types/student";
import type { HistoryStatsAPI } from "@/lib/services/student";

interface StudentKpiChartsProps {
  stats: StudentStudyStats | HistoryStatsAPI;
}

// ─── Carte 1 : Temps d'étude — barres hebdomadaires bespoke ─────────────────
// (remplace ActivityChartCard, composant générique partagé avec d'autres
// dashboards — ici on construit un rendu dédié, sans dépendance croisée.)

function WeeklyHoursCard({ stats }: { stats: StudentKpiChartsProps["stats"] }) {
  const maxHours = Math.max(1, ...stats.daily_activity.map((d) => d.hours));

  return (
    <div className="bg-background border border-border rounded-3xl p-5 space-y-4 shadow-xs flex flex-col justify-between h-full">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider">
            Temps d&apos;Étude
          </span>
          <div className="font-mono text-2xl font-semibold text-navy">
            {stats.weekly_hours}
            <span className="text-sm text-foreground-muted">h cette semaine</span>
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between gap-1.5 h-16 pt-2">
        {stats.daily_activity.map((d, idx) => {
          const heightPct = Math.max(6, (d.hours / maxHours) * 100);
          const isToday = idx === stats.daily_activity.length - 1;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full h-16 flex items-end rounded-md bg-background-secondary overflow-hidden">
                <div
                  className={`w-full rounded-t-sm transition-all ${
                    isToday ? "bg-gold" : "bg-navy/25"
                  }`}
                  style={{ height: `${heightPct}%` }}
                  title={`${d.day} : ${d.hours}h`}
                />
              </div>
              <span
                className={`text-[9px] font-mono uppercase ${
                  isToday ? "text-gold font-bold" : "text-foreground-muted"
                }`}
              >
                {d.day.slice(0, 3)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Carte 2 : Objectifs de la semaine — remplace les 3 anneaux vides ──────

function WeeklyGoalsCard({ stats }: { stats: StudentKpiChartsProps["stats"] }) {
  const goals = [
    { id: "1", title: "Chapitre 4 — Droit Constitutionnel", isCompleted: true },
    { id: "2", title: "Synthèse Économie & Gestion", isCompleted: false },
  ];
  const progress = stats.overall_progress;
  const hasProgress = progress > 0 || stats.books_completed_count > 0;

  return (
    <div className="bg-background border border-border rounded-3xl p-5 space-y-4 shadow-xs flex flex-col justify-between h-full">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider">
            Objectifs de la Semaine
          </span>
          <div className="font-mono text-2xl font-semibold text-navy">
            {stats.books_completed_count}
            <span className="text-sm text-foreground-muted"> ouvrage{stats.books_completed_count > 1 ? "s" : ""} terminé{stats.books_completed_count > 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      {hasProgress ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-foreground-muted">Progression globale</span>
            <span className="font-mono font-semibold text-navy">{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-background-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-gold transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}

      <div className="space-y-2 pt-1">
        {goals.map((goal) => (
          <div key={goal.id} className="flex items-center gap-2 text-[11px]">
            {goal.isCompleted ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-gold shrink-0" />
            ) : (
              <Circle className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
            )}
            <span
              className={
                goal.isCompleted
                  ? "text-foreground-muted line-through"
                  : "text-navy font-medium"
              }
            >
              {goal.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Carte 3 : Répartition par matière ──────────────────────────────────────

function DisciplineBreakdownCard({ stats }: { stats: StudentKpiChartsProps["stats"] }) {
  return (
    <div className="bg-background border border-border rounded-3xl p-5 space-y-4 shadow-xs flex flex-col justify-between h-full">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider">
            Répartition par Matière
          </span>
          <div className="text-xl font-semibold font-serif text-navy">
            {stats.discipline_breakdown?.length || 0} Discipline
            {(stats.discipline_breakdown?.length || 0) > 1 ? "s" : ""}
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-navy/5 text-navy border border-border shrink-0">
          <TrendingUp className="w-5 h-5 text-gold" />
        </div>
      </div>

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
  );
}

// ─── Carte 4 : Série de lecture (une seule occurrence dans toute la page) ──

function StreakCard({ stats }: { stats: StudentKpiChartsProps["stats"] }) {
  return (
    <div className="bg-background border border-border rounded-3xl p-5 space-y-4 shadow-xs flex flex-col justify-between h-full">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider">
            Série de Lecture
          </span>
          <div className="font-mono text-2xl font-semibold text-navy">
            {stats.current_streak_days}
            <span className="text-sm text-foreground-muted"> jour{stats.current_streak_days > 1 ? "s" : ""}</span>
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-gold/15 text-gold border border-gold/30 shrink-0">
          <Flame className="w-5 h-5 fill-current" />
        </div>
      </div>

      {stats.current_streak_days > 0 ? (
        <div className="flex items-center gap-2 pt-2 text-xs bg-background-secondary p-3 rounded-2xl border border-border">
          <Award className="w-5 h-5 text-gold shrink-0" />
          <span className="text-foreground-muted text-[11px]">
            Badge <strong className="text-navy font-semibold">Étudiant Assidu</strong> débloqué !
          </span>
        </div>
      ) : (
        <p className="text-[11px] text-foreground-muted pt-2">
          Lisez aujourd&apos;hui pour démarrer votre série.
        </p>
      )}
    </div>
  );
}

export function StudentKpiCharts({ stats }: StudentKpiChartsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
      <WeeklyHoursCard stats={stats} />
      <WeeklyGoalsCard stats={stats} />
      <DisciplineBreakdownCard stats={stats} />
      <StreakCard stats={stats} />
    </div>
  );
}
