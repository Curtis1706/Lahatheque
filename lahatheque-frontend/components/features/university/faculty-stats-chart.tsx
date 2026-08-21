"use client";

import React from "react";
import { DonutChart, DonutChartSegment } from "@/components/ui/donut-chart";
import { Building2, BookOpen, Clock, TrendingUp } from "lucide-react";

interface FacultyStatsChartProps {
  facultyDistribution: {
    code: string;
    name: string;
    consultations: number;
    percent: number;
    color: string;
  }[];
  totalConsultations: number;
}

export function FacultyStatsChart({
  facultyDistribution,
  totalConsultations,
}: FacultyStatsChartProps) {
  const donutSegments: DonutChartSegment[] = facultyDistribution.map((fac) => ({
    value: fac.consultations,
    label: `${fac.code} - ${fac.name}`,
    color: fac.color,
    percentage: fac.percent,
  }));

  return (
    <div className="p-6 rounded-3xl bg-background border border-border space-y-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4 text-gold" />
            Répartition par Faculté / UFR
          </div>
          <h3 className="font-serif text-lg font-bold text-navy">
            Usage Académique des Facultés
          </h3>
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full w-fit">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>+14.2% ce mois</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Donut Chart 21st.dev */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-4">
          <DonutChart
            data={donutSegments}
            size={220}
            strokeWidth={26}
            centerContent={
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wider font-bold text-foreground-muted">Total Vues</p>
                <p className="text-xl font-serif font-bold text-navy leading-none">
                  {totalConsultations.toLocaleString("fr-FR")}
                </p>
                <p className="text-[9px] text-gold font-semibold mt-0.5">Lectures Campus</p>
              </div>
            }
          />
        </div>

        {/* Légende & Barres d'usage */}
        <div className="lg:col-span-7 space-y-3">
          {facultyDistribution.map((fac) => (
            <div
              key={fac.code}
              className="p-3 rounded-2xl bg-background-secondary border border-border flex flex-col gap-1.5 hover:border-gold/50 transition-colors"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: fac.color }}
                  />
                  <span className="font-bold text-navy">{fac.code}</span>
                  <span className="text-foreground-muted text-[11px] truncate max-w-[180px] sm:max-w-[240px]">
                    — {fac.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-xs font-bold text-navy">
                    {fac.consultations.toLocaleString("fr-FR")}
                  </span>
                  <span className="text-[11px] font-bold text-gold">
                    ({fac.percent}%)
                  </span>
                </div>
              </div>

              {/* Barre de progression */}
              <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${fac.percent}%`,
                    backgroundColor: fac.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
