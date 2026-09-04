"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Layers,
  BookOpen,
  DollarSign,
  TrendingUp,
  ArrowRight,
  PlusCircle,
  Download,
  Building2,
  FileSpreadsheet,
  Users,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { ProgressMetricCard } from "@/components/ui/progress-metric-card";
import { FacultyStatsChart } from "@/components/features/university/faculty-stats-chart";
import { BouquetCard } from "@/components/features/university/bouquet-card";
import {
  getUniversityKpis,
  getUniversityBouquets,
  getUniversityFaculties,
  subscribeUniversityBouquet,
} from "@/lib/services/university";
import type {
  UniversityKpis,
  UniversityBouquet,
  UniversityFacultyData,
} from "@/lib/types/university";

// Générateur de timeline pour activer les barres bâtonnets sparklines de ProgressMetricCard (identique à l'admin)
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

export default function UniversityOverviewPage() {
  const [kpis, setKpis] = useState<UniversityKpis | null>(null);
  const [bouquets, setBouquets] = useState<UniversityBouquet[]>([]);
  const [faculties, setFaculties] = useState<UniversityFacultyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [kpiData, bqData, facData] = await Promise.all([
        getUniversityKpis(),
        getUniversityBouquets(),
        getUniversityFaculties(),
      ]);
      setKpis(kpiData);
      setBouquets(bqData);
      setFaculties(facData);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleSubscribe = async (bouquetId: string) => {
    const ok = await subscribeUniversityBouquet(bouquetId);
    if (ok) {
      setBouquets((prev) =>
        prev.map((b) =>
          b.id === bouquetId
            ? { ...b, status: "active", start_date: "2026-01-01", end_date: "2026-12-31" }
            : b
        )
      );
    }
    return ok;
  };

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
      {/* Header avec nom d'université dynamique */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4 text-gold" />
            Portail Université Partenaire
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            {kpis.institution_name
              ? `${kpis.institution_name} (${kpis.institution_code || "BJ"})`
              : "Université d'Abomey-Calavi (UAC)"}
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Supervision académique, gestion des bouquets documentaires et suivi des redevances conventionnées.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/university/purchases/new"
            className="px-4 py-2.5 rounded-xl bg-background border border-border hover:border-gold text-navy text-xs font-bold transition-colors inline-flex items-center gap-2 shadow-xs min-h-[44px]"
          >
            <ShoppingBag className="w-4 h-4 text-gold" />
            Passer Commande
          </Link>
          <Link
            href="/university/bouquets"
            className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 shadow-xs min-h-[44px]"
          >
            <Layers className="w-4 h-4 text-gold" />
            Souscrire un Bouquet
          </Link>
        </div>
      </div>

      {/* KPI Cards avec barres bâtonnets sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* KPI Étudiants Affiliés (Masqué à la demande client) */}
        {/*
        <ProgressMetricCard
          title="Étudiants Affiliés"
          total={kpis.affiliated_students_count.toLocaleString("fr-FR")}
          percent={kpis.affiliated_students_count > 0 ? "+8.4%" : "0%"}
          trend={kpis.affiliated_students_count > 0 ? "up" : "down"}
          accent="navy"
          delta="Actifs"
          deltaLabel="ce mois"
          defaultView="bar"
          data={getRollingTimeline(kpis.affiliated_students_count)}
        />
        */}

        <ProgressMetricCard
          title="Bouquets Souscrits"
          total={`${kpis.active_bouquets_count} Packs`}
          percent={kpis.active_bouquets_count > 0 ? `+${kpis.active_bouquets_count}` : "0"}
          trend={kpis.active_bouquets_count > 0 ? "up" : "down"}
          accent="gold"
          delta="Campus"
          deltaLabel="souscrits"
          defaultView="bar"
          data={getRollingTimeline(kpis.active_bouquets_count)}
        />

        {/* KPI Consultations Ce Mois (Masqué à la demande client) */}
        {/*
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
        */}

        <ProgressMetricCard
          title="Redevances Disponibles"
          total={`${kpis.total_royalties_available.toLocaleString("fr-FR")} ${kpis.currency || "XOF"}`}
          percent="Droits"
          trend="up"
          accent="gold"
          delta="Disponibles"
          deltaLabel="au virement"
          defaultView="bar"
          data={getRollingTimeline(kpis.total_royalties_available)}
        />
      </div>

      {/* Graphique Donut par Faculté (Masqué à la demande client) */}
      {/*
      <FacultyStatsChart
        facultyDistribution={kpis.faculty_distribution}
        totalConsultations={kpis.monthly_consultations_count}
      />
      */}

      {/* Bouquets Documentaires en Vedette */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-0.5">
              <Layers className="w-4 h-4 text-gold" />
              Ressources Documentaires Campus
            </div>
            <h2 className="font-serif text-xl font-bold text-navy">
              Bouquets Documentaires Souscrits &amp; Disponibles
            </h2>
          </div>
          <Link
            href="/university/bouquets"
            className="text-xs font-bold text-navy hover:text-gold inline-flex items-center gap-1 transition-colors"
          >
            <span>Voir tous les bouquets</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bouquets.slice(0, 2).map((bq) => (
            <BouquetCard
              key={bq.id}
              bouquet={bq}
              onSubscribe={handleSubscribe}
            />
          ))}
        </div>
      </div>

      {/* Raccourcis Rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        {/* Raccourci Affiliations Étudiants (Masqué à la demande client) */}
        {/*
        <Link
          href="/university/affiliations"
          className="p-5 rounded-2xl bg-background border border-border hover:border-gold transition-all shadow-xs flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-navy-light flex items-center justify-center text-navy group-hover:bg-gold/15 group-hover:text-navy transition-colors">
              <Users className="w-5 h-5 text-gold" />
            </div>
            <div>
              <p className="font-serif font-bold text-sm text-navy">Affiliations Étudiants</p>
              <p className="text-[11px] text-foreground-muted">Valider les matricules en attente</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-foreground-muted group-hover:text-gold transition-colors" />
        </Link>
        */}

        <Link
          href="/university/catalog"
          className="p-5 rounded-2xl bg-background border border-border hover:border-gold transition-all shadow-xs flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-navy-light flex items-center justify-center text-navy group-hover:bg-gold/15 group-hover:text-navy transition-colors">
              <BookOpen className="w-5 h-5 text-gold" />
            </div>
            <div>
              <p className="font-serif font-bold text-sm text-navy">Catalogue Affilié</p>
              <p className="text-[11px] text-foreground-muted">Consulter et prévisualiser</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-foreground-muted group-hover:text-gold transition-colors" />
        </Link>

        <Link
          href="/university/royalties"
          className="p-5 rounded-2xl bg-background border border-border hover:border-gold transition-all shadow-xs flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-navy-light flex items-center justify-center text-navy group-hover:bg-gold/15 group-hover:text-navy transition-colors">
              <DollarSign className="w-5 h-5 text-gold" />
            </div>
            <div>
              <p className="font-serif font-bold text-sm text-navy">Redevances Institutionnelles</p>
              <p className="text-[11px] text-foreground-muted">Relevés et demande de virement</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-foreground-muted group-hover:text-gold transition-colors" />
        </Link>
      </div>
    </div>
  );
}
