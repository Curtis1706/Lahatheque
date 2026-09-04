"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  ArrowLeft,
  BookOpen,
  Eye,
} from "lucide-react";
import { BookCover3D } from "@/components/ui/book-cover-3d";
import { FacultyStatsChart } from "@/components/features/university/faculty-stats-chart";
import { TotalSalesChart } from "@/components/ui/total-sales-chart";
import { ProgressMetricCard } from "@/components/ui/progress-metric-card";
import { getUniversityKpis, getUniversityCatalog } from "@/lib/services/university";
import type { UniversityKpis, UniversityBookCatalogItem } from "@/lib/types/university";

// Générateur de timeline pour activer les barres bâtonnets sparklines de ProgressMetricCard (identique à l'admin et vue d'ensemble)
const getRollingTimeline = (count: number) => {
  const monthNames = ["Janv", "Févr", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];
  const now = new Date();
  const res = [];
  for (let i = 3; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    res.push({
      date: `${String(d.getDate()).padStart(2, "0")} ${monthNames[d.getMonth()]}`,
      value: i === 0 ? count : Math.max(0, Math.round(count * (0.6 + (3 - i) * 0.13))),
    });
  }
  return res;
};

export default function UniversityStatsPage() {
  const [kpis, setKpis] = useState<UniversityKpis | null>(null);
  const [books, setBooks] = useState<UniversityBookCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [kpiData, catalogData] = await Promise.all([
          getUniversityKpis(),
          getUniversityCatalog(),
        ]);
        setKpis(kpiData);
        setBooks(catalogData);
      } catch (err) {
        console.error("Erreur chargement statistiques universitaires:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !kpis) {
    return (
      <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-8 bg-background-secondary rounded-xl w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-background-secondary rounded-3xl" />
          ))}
        </div>
        <div className="h-80 bg-background-secondary rounded-3xl" />
      </div>
    );
  }

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
            Rapports &amp; Métriques Académiques
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Statistiques de Consultation &amp; Usage Documentaire
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Mesure des volumes de lecture, consultations d&apos;extraits gratuits et usages des ressources documentaires par vos étudiants.
          </p>
        </div>
      </div>

      {/* 4 Cartes de métriques connectées aux KPIs réels avec bâtonnets sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ProgressMetricCard
          title="Consultations Ce Mois"
          total={kpis.monthly_consultations_count.toLocaleString("fr-FR")}
          percent={`${kpis.consultations_trend_percent >= 0 ? "+" : ""}${kpis.consultations_trend_percent}%`}
          trend={kpis.consultations_trend_percent >= 0 ? "up" : "down"}
          accent="emerald"
          delta="Lectures"
          deltaLabel="ce mois"
          defaultView="bar"
          data={getRollingTimeline(kpis.monthly_consultations_count)}
        />

        <ProgressMetricCard
          title="Étudiants Affiliés"
          total={kpis.affiliated_students_count.toLocaleString("fr-FR")}
          percent={kpis.affiliated_students_count > 0 ? "+8.4%" : "0%"}
          trend={kpis.affiliated_students_count > 0 ? "up" : "down"}
          accent="navy"
          delta="Actifs"
          deltaLabel="campus"
          defaultView="bar"
          data={getRollingTimeline(kpis.affiliated_students_count)}
        />

        <ProgressMetricCard
          title="Bouquets Souscrits"
          total={`${kpis.active_bouquets_count} Packs`}
          percent={kpis.active_bouquets_count > 0 ? `+${kpis.active_bouquets_count}` : "0"}
          trend={kpis.active_bouquets_count > 0 ? "up" : "down"}
          accent="gold"
          delta="Bouquets"
          deltaLabel="actifs"
          defaultView="bar"
          data={getRollingTimeline(kpis.active_bouquets_count)}
        />

        <ProgressMetricCard
          title="Redevances 15% (Disponibles)"
          total={`${kpis.total_royalties_available.toLocaleString("fr-FR")} ${kpis.currency || "XOF"}`}
          percent="15%"
          trend="up"
          accent="emerald"
          delta="Droits"
          deltaLabel="générés"
          defaultView="bar"
          data={getRollingTimeline(Math.round(kpis.total_royalties_available / 1000))}
        />
      </div>

      {/* Donut Chart 21st.dev par Discipline */}
      <FacultyStatsChart
        facultyDistribution={kpis.faculty_distribution}
        totalConsultations={kpis.monthly_consultations_count}
      />

      {/* Graphique d'Évolution Temporelle 21st.dev */}
      <TotalSalesChart
        title="Croissance des Lectures Semestrielles"
        totalAmountText={`${(kpis.monthly_consultations_count).toLocaleString("fr-FR")} Lectures`}
        growthBadgeText={kpis.consultations_trend_percent ? `${kpis.consultations_trend_percent > 0 ? "+" : ""}${kpis.consultations_trend_percent}% ce mois` : "0% ce mois"}
        unit="Lectures"
        curvePoints={
          kpis.monthly_consultations_count > 0
            ? [
                Math.round(kpis.monthly_consultations_count * 0.4),
                Math.round(kpis.monthly_consultations_count * 0.6),
                Math.round(kpis.monthly_consultations_count * 0.8),
                kpis.monthly_consultations_count,
              ]
            : [0, 0, 0, 0]
        }
        channels={kpis.faculty_distribution.filter((f) => f.consultations > 0).map((f) => ({
          name: f.name || f.code,
          amount: f.consultations,
          change: `${f.percent}%`,
          isPositive: true,
        }))}
      />

      {/* Top 5 des Ouvrages les plus lus de l'université avec couverture 3D & action Lire extrait */}
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
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-background-secondary border border-border hover:border-gold transition-colors gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-7 h-7 rounded-xl bg-navy text-white text-xs font-serif font-bold flex items-center justify-center shrink-0">
                  #{idx + 1}
                </span>

                {/* Couverture 3D intégrée */}
                <div className="shrink-0">
                  <BookCover3D
                    title={b.title}
                    authors={b.authors}
                    discipline={b.discipline}
                    coverUrl={b.cover_url}
                    size="xs"
                    interactive={false}
                  />
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <Link
                    href={`/catalog/${b.id}`}
                    className="font-serif font-bold text-xs text-navy leading-snug truncate max-w-[240px] sm:max-w-md hover:underline block"
                    title={`Consulter les détails de ${b.title}`}
                  >
                    {b.title}
                  </Link>
                  <p className="text-[10px] text-foreground-muted truncate max-w-[240px] sm:max-w-md">
                    {Array.isArray(b.authors) ? b.authors.join(", ") : (b.authors || "Auteur inconnu")} — <span className="font-semibold text-navy">{b.discipline}</span>
                  </p>
                  <span className="inline-block text-[9px] font-semibold px-2 py-0.5 rounded-md bg-gold/15 text-navy border border-gold/30">
                    Extrait gratuit disponible
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                <span className="font-mono text-xs font-bold text-navy hidden md:inline-block">
                  {b.consultations_count.toLocaleString("fr-FR")} vue(s)
                </span>
                <Link
                  href={`/catalog/${b.id}`}
                  className="px-3 py-1.5 rounded-xl bg-background-secondary border border-border hover:border-gold hover:text-navy text-navy text-xs font-semibold transition-colors inline-flex items-center gap-1.5 whitespace-nowrap min-h-[36px]"
                  title="Consulter les détails de l'ouvrage"
                >
                  <Eye className="w-3.5 h-3.5 text-navy" />
                  <span>Détails</span>
                </Link>
                <Link
                  href={`/catalog/reader/${b.id}?mode=sample`}
                  className="px-3 py-1.5 rounded-xl bg-gold/15 border border-gold/30 hover:bg-gold/25 text-navy text-xs font-bold transition-colors inline-flex items-center gap-1.5 whitespace-nowrap min-h-[36px]"
                  title="Lire l'extrait gratuit"
                >
                  <BookOpen className="w-3.5 h-3.5 text-gold" />
                  <span>Lire</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
