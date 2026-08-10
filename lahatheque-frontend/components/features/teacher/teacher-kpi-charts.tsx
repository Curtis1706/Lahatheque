"use client";

import React from "react";
import { GraduationCap, BookOpen, CheckCircle, TrendingUp, Award } from "lucide-react";
import { TeacherStats } from "@/lib/types/teacher";
import { ActivityChartCard } from "@/components/ui/activity-chart-card";
import { ActivityCard } from "@/components/ui/activity-card";

interface TeacherKpiChartsProps {
  stats: TeacherStats;
}

export function TeacherKpiCharts({ stats }: TeacherKpiChartsProps) {
  const chartData = stats.weekly_student_reading_hours.map((d) => ({
    day: d.day,
    value: d.hours,
  }));

  const totalWeeklyHours = stats.weekly_student_reading_hours.reduce((acc, curr) => acc + curr.hours, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
      {/* Card 1: 21st.dev ActivityChartCard (par ravikatiyar162) */}
      <ActivityChartCard
        title="Lectures Étudiantes"
        totalValue={`${Math.round(totalWeeklyHours)}h`}
        data={chartData}
        className="col-span-1 border-border shadow-xs h-full"
      />

      {/* Card 2: 21st.dev ActivityCard (par kokonutd) */}
      <ActivityCard
        category="Cohortes Inscrites"
        title="Engagements Pédagogiques"
        metrics={[
          { label: "Étudiants", value: `${stats.total_students}`, trend: 100, unit: "actifs" },
          { label: "Manuels", value: `${stats.prescribed_books_count}`, trend: 85, unit: "prescrits" },
          { label: "Spécimens", value: `${stats.approved_specimens_count}`, trend: 90, unit: "validés" },
        ]}
        dailyGoals={[
          { id: "1", title: "Prescription Droit DRO101", isCompleted: true },
          { id: "2", title: "Évaluation Spécimen Économie", isCompleted: true },
        ]}
        className="col-span-1 border-border shadow-xs h-full"
      />

      {/* Card 3: Répartition par Cours */}
      <div className="bg-background border border-border rounded-2xl p-5 space-y-4 shadow-xs flex flex-col justify-between h-full">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider">Lectures par Cours</span>
            <div className="text-xl font-bold font-serif text-navy">3 Cours Actifs</div>
          </div>
          <div className="p-2.5 rounded-xl bg-navy/5 text-navy border border-border shrink-0">
            <TrendingUp className="w-5 h-5 text-gold" />
          </div>
        </div>

        {/* Course progress distribution */}
        <div className="space-y-2.5 pt-1 text-xs">
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="font-semibold text-navy">DRO101 - Droit Const.</span>
              <span className="text-foreground-muted">142 étudiants</span>
            </div>
            <div className="w-full bg-background-secondary h-2 rounded-full overflow-hidden border border-border">
              <div className="bg-navy h-full rounded-full w-[68%]" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="font-semibold text-navy">ECO202 - Économie</span>
              <span className="text-foreground-muted">98 étudiants</span>
            </div>
            <div className="w-full bg-background-secondary h-2 rounded-full overflow-hidden border border-border">
              <div className="bg-emerald-700 h-full rounded-full w-[45%]" />
            </div>
          </div>
        </div>
      </div>

      {/* Card 4: Taux de Consultation des Manuels */}
      <div className="bg-background border border-border rounded-2xl p-5 space-y-4 shadow-xs flex flex-col justify-between h-full">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider">Taux d&apos;Adoption</span>
            <div className="text-xl font-bold font-serif text-navy">82% d&apos;Assiduité</div>
          </div>
          <div className="p-2.5 rounded-xl bg-gold/10 text-gold border border-gold/30 shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 text-xs bg-background-secondary p-3 rounded-xl border border-border">
          <Award className="w-5 h-5 text-gold shrink-0" />
          <span className="text-foreground-muted text-[11px]">
            Badge <strong className="text-navy font-semibold">Enseignant Prescripteur</strong> actif
          </span>
        </div>
      </div>
    </div>
  );
}
