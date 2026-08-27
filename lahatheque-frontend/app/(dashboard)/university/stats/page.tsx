"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  ArrowLeft,
  Building2,
  BookOpen,
  Clock,
  Download,
  Users,
  Layers,
  GraduationCap,
} from "lucide-react";
import { FacultyStatsChart } from "@/components/features/university/faculty-stats-chart";
import { TotalSalesChart } from "@/components/ui/total-sales-chart";
import { ProgressMetricCard } from "@/components/ui/progress-metric-card";
import { getUniversityKpis, getUniversityCatalog } from "@/lib/services/university";
import type { UniversityKpis, UniversityBookCatalogItem } from "@/lib/types/university";

export default function UniversityStatsPage() {
  const [kpis, setKpis] = useState<UniversityKpis | null>(null);
  const [books, setBooks] = useState<UniversityBookCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [kpiData, catalogData] = await Promise.all([
        getUniversityKpis(),
        getUniversityCatalog(),
      ]);
      setKpis(kpiData);
      setBooks(catalogData);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading || !kpis) {
    return (
      <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-8 bg-background-secondary rounded-xl w-1/3" />
        <div className="h-80 bg-background-secondary rounded-3xl" />
      </div>
    );
  }

  // Monthly activity chart sample
  const monthlyData = [
    { label: "Mars", value: 31200 },
    { label: "Avril", value: 34500 },
    { label: "Mai", value: 38900 },
    { label: "Juin", value: 41200 },
    { label: "Juillet", value: 36800 },
    { label: "Août", value: 42180 },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-8 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/university" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Statistiques d&apos;Usage</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/university" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4 text-gold" />
            Rapports &amp; Métriques Académiques (Section 4.1.6)
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Statistiques de Consultation par Faculté &amp; Discipline
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Mesure des volumes de lecture, pages consultées et écoutes audio par les étudiants de votre établissement.
          </p>
        </div>
      </div>

      {/* 3 Cartes de métriques */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ProgressMetricCard
          title="Total Consultations Ce Mois"
          total={kpis.monthly_consultations_count.toLocaleString("fr-FR")}
          percent="+14.2%"
          delta="Vues"
          trend="up"
          accent="emerald"
          data={[
            { date: "M1", value: 31200 },
            { date: "M2", value: 34500 },
            { date: "M3", value: 38900 },
            { date: "M4", value: 42180 },
          ]}
        />

        <ProgressMetricCard
          title="Temps Moyen de Lecture"
          total="48 min / jour"
          percent="+8.5%"
          delta="Par étudiant"
          trend="up"
          accent="navy"
          data={[
            { date: "M1", value: 35 },
            { date: "M2", value: 40 },
            { date: "M3", value: 44 },
            { date: "M4", value: 48 },
          ]}
        />

        <ProgressMetricCard
          title="Taux d'Engagement Faculté"
          total="78.4%"
          percent="+5.1%"
          delta="Actif"
          trend="up"
          accent="gold"
          data={[
            { date: "M1", value: 65 },
            { date: "M2", value: 70 },
            { date: "M3", value: 74 },
            { date: "M4", value: 78 },
          ]}
        />
      </div>

      {/* Donut Chart 21st.dev par Faculté */}
      <FacultyStatsChart
        facultyDistribution={kpis.faculty_distribution}
        totalConsultations={kpis.monthly_consultations_count}
      />

      {/* Graphique d'Évolution Temporelle 21st.dev */}
      <TotalSalesChart
        title="Croissance des Lectures Semestrielles"
        totalAmountText={`${(kpis.monthly_consultations_count * 6).toLocaleString("fr-FR")} Lectures`}
        growthBadgeText="+18.4% ce semestre"
        channels={kpis.faculty_distribution.map((f) => ({
          name: f.code,
          amount: f.consultations,
          change: `+${f.percent}%`,
          isPositive: true,
        }))}
      />

      {/* Top 5 des Ouvrages les plus lus de l'université */}
      <div className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-gold" />
              Palmarès Campus
            </span>
            <h3 className="font-serif text-lg font-bold text-navy">
              Top 5 des Ouvrages les Plus Consultés par vos Étudiants
            </h3>
          </div>
        </div>

        <div className="space-y-3">
          {books.slice(0, 5).map((b, idx) => (
            <div
              key={b.id}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-background-secondary border border-border hover:border-gold transition-colors gap-3"
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-navy text-white text-xs font-serif font-bold flex items-center justify-center shrink-0">
                  #{idx + 1}
                </span>
                <div>
                  <p className="font-serif font-bold text-xs text-navy leading-snug">
                    {b.title}
                  </p>
                  <p className="text-[10px] text-foreground-muted">
                    {Array.isArray(b.authors) ? b.authors.join(", ") : (b.authors || "Auteur inconnu")} — <span className="font-semibold text-navy">{b.faculty_code}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono text-xs font-bold text-navy">
                  {b.consultations_count.toLocaleString("fr-FR")} vue(s)
                </span>
                <Link
                  href={`/catalog/reader/${b.id}`}
                  className="px-2.5 py-1.5 rounded-xl bg-gold/15 border border-gold/30 hover:bg-gold/25 text-navy text-[10px] font-bold transition-colors inline-flex items-center gap-1"
                >
                  <BookOpen className="w-3 h-3 text-gold" />
                  <span>Liseuse</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
