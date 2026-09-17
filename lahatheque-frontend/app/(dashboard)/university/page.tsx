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
  ShoppingBag,
  Sparkles,
  Building2,
  PackageCheck,
  ShieldCheck,
} from "lucide-react";
import { DonutChart, type DonutChartSegment } from "@/components/ui/donut-chart";
import { ProgressMetricCard } from "@/components/ui/progress-metric-card";
import { FacultyStatsChart } from "@/components/features/university/faculty-stats-chart";
import { BouquetCard } from "@/components/features/university/bouquet-card";
import { toast } from "sonner";
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

export default function UniversityOverviewPage() {
  const [kpis, setKpis] = useState<UniversityKpis | null>(null);
  const [bouquets, setBouquets] = useState<UniversityBouquet[]>([]);
  const [faculties, setFaculties] = useState<UniversityFacultyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [kpiData, bqData, facData] = await Promise.all([
          getUniversityKpis().catch((err) => {
            console.error("[UNIV OVERVIEW] Erreur chargement KPIs:", err);
            return null;
          }),
          getUniversityBouquets().catch((err) => {
            console.error("[UNIV OVERVIEW] Erreur chargement Bouquets:", err);
            return [];
          }),
          getUniversityFaculties().catch((err) => {
            console.error("[UNIV OVERVIEW] Erreur chargement Facultés:", err);
            return [];
          }),
        ]);
        if (kpiData) setKpis(kpiData);
        if (bqData) setBouquets(bqData);
        if (facData) setFaculties(facData);
        console.info("[UNIV KPIS]", new Date().toISOString(), "- Établissement chargé :", kpiData?.institution_code, "Type :", kpiData?.institution_type);
      } catch (err) {
        console.error("[UNIV OVERVIEW] Erreur critique chargement données:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSubscribe = async (bouquetId: string, period: "monthly" | "annual" = "annual") => {
    try {
      const res = await subscribeUniversityBouquet(bouquetId, period);
      if (res.success) {
        if (res.checkout_url) {
          toast.info("Redirection vers la passerelle de paiement sécurisée...");
          window.location.href = res.checkout_url;
          return true;
        }
        if (res.subscription_id) {
          toast.success("Souscription activée avec succès.");
          window.location.href = `/university/bouquets/success?subscription_id=${res.subscription_id}`;
          return true;
        }
        toast.success("Souscription enregistrée avec succès.");
        const bqData = await getUniversityBouquets();
        if (bqData) setBouquets(bqData);
        return true;
      } else {
        toast.error(res.error || "Échec de l'initialisation de la souscription.");
        return false;
      }
    } catch (err: any) {
      toast.error("Une erreur réseau est survenue lors de la souscription.");
      return false;
    }
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

  // ── Détermine le type depuis les KPIs (source de vérité backend) ──
  const institutionType = kpis.institution_type ?? "partner"; // conservateur : partenaire si inconnu
  const isClient = institutionType === "client";
  const isPartner = institutionType === "partner";

  // ── Université Cliente : expérience campus épurée ──
  if (isClient) {
    const accessibleBooks = (kpis as any).accessible_books_count ?? 0;
    const paperOrders = (kpis as any).paper_orders_count ?? 0;

    return (
      <div className="p-4 sm:p-6 md:p-8 w-full space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
              <Building2 className="w-4 h-4 text-gold" />
              Espace Université Cliente
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
              {kpis.institution_name
                ? `${kpis.institution_name} (${kpis.institution_code || ""})`
                : "Votre Université"}
            </h1>
            <p className="text-xs text-foreground-muted mt-1">
              Accès au catalogue numérique, suivi de vos abonnements campus et commandes d&apos;ouvrages papier.
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

        {/* 4 KPI Cards Campus */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ProgressMetricCard
            title="Bouquets Souscrits"
            total={`${kpis.active_bouquets_count} Packs`}
            percent={kpis.active_bouquets_count > 0 ? `+${kpis.active_bouquets_count}` : "0"}
            trend={kpis.active_bouquets_count > 0 ? "up" : "down"}
            accent="gold"
            delta="Campus"
            deltaLabel="souscrits"
          />
          <ProgressMetricCard
            title="Ouvrages Accessibles"
            total={`${accessibleBooks} Titres`}
            percent="Numérique"
            trend="up"
            accent="navy"
            delta="Abonnements campus"
            deltaLabel="actifs"
          />
          <ProgressMetricCard
            title="Lectures Campus"
            total={`${kpis.monthly_consultations_count}`}
            percent={`${kpis.consultations_trend_percent > 0 ? "+" : ""}${kpis.consultations_trend_percent}%`}
            trend={kpis.consultations_trend_percent >= 0 ? "up" : "down"}
            accent="emerald"
            delta="Ce mois"
            deltaLabel="sessions actives"
            defaultView="bar"
            data={kpis.consultations_timeline}
          />
          <ProgressMetricCard
            title="Commandes Papier"
            total={`${paperOrders}`}
            percent="Institutionnelles"
            trend="up"
            accent="gold"
            delta="Commandes"
            deltaLabel="passées"
          />
        </div>

        {/* Offres de bouquets disponibles à souscrire */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-0.5">
                <Layers className="w-4 h-4 text-gold" />
                Ressources Documentaires Campus
              </div>
              <h2 className="font-serif text-xl font-bold text-navy">
                Bouquets Documentaires Disponibles
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
            {bouquets
              .filter((b) => (b.bouquet_type as string) !== "general" && !b.title.toLowerCase().includes("général") && !b.title.toLowerCase().includes("general"))
              .slice(0, 2)
              .map((bq) => (
                <BouquetCard key={bq.id} bouquet={bq} onSubscribe={handleSubscribe} />
              ))}
          </div>
        </div>

        {/* Raccourcis Rapides */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <Link
            href="/university/bouquets"
            className="p-5 rounded-2xl bg-background border border-border hover:border-gold transition-all shadow-xs flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-navy-light flex items-center justify-center group-hover:bg-gold/15 transition-colors">
                <Layers className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="font-serif font-bold text-sm text-navy">Bouquets Documentaires</p>
                <p className="text-[11px] text-foreground-muted">Gérer et souscrire vos collections campus</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-foreground-muted group-hover:text-gold transition-colors" />
          </Link>
          <Link
            href="/university/purchases"
            className="p-5 rounded-2xl bg-background border border-border hover:border-gold transition-all shadow-xs flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-navy-light flex items-center justify-center group-hover:bg-gold/15 transition-colors">
                <PackageCheck className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="font-serif font-bold text-sm text-navy">Commandes Institutionnelles</p>
                <p className="text-[11px] text-foreground-muted">Livres papier pour votre campus</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-foreground-muted group-hover:text-gold transition-colors" />
          </Link>
        </div>
      </div>
    );
  }

  // ── Université Partenaire : expérience redevances complète ──
  const donutSegments: DonutChartSegment[] = kpis?.revenue_split
    ? [
        {
          label: `Votre établissement (${kpis.revenue_split.university_percent}%)`,
          value: kpis.revenue_split.university_amount,
          color: "var(--navy)",
          percentage: kpis.revenue_split.university_percent,
        },
        {
          label: `LAHAThèque (${kpis.revenue_split.laha_percent}%)`,
          value: kpis.revenue_split.laha_amount,
          color: "var(--gold)",
          percentage: kpis.revenue_split.laha_percent,
        },
      ]
    : [];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-8 max-w-7xl mx-auto">
      {/* Header Partenaire */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-gold" />
            Portail Université Partenaire
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            {kpis.institution_name
              ? `${kpis.institution_name} (${kpis.institution_code || "BJ"})`
              : "Université d'Abomey-Calavi (UAC)"}
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Supervision académique et suivi des redevances conventionnées avec LAHA Éditions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/university/royalties"
            className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 shadow-xs min-h-[44px]"
          >
            <DollarSign className="w-4 h-4 text-gold" />
            Mes Redevances
          </Link>
        </div>
      </div>

      {/* 4 KPI Cards Partenaire */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ProgressMetricCard
          title="Vos Ouvrages Déposés"
          total={`${kpis.catalog_books_count != null ? kpis.catalog_books_count : bouquets.reduce((acc, b) => acc + (b.my_books_count ?? 0), 0)} Ouvrages`}
          percent="Inclus"
          trend="up"
          accent="navy"
          delta="Catalogue partagé"
          deltaLabel="multi-établissements"
        />
        <ProgressMetricCard
          title="Part d'Audience"
          total={`${kpis.audience_share_percent != null ? kpis.audience_share_percent : 0} %`}
          percent="Usage réel"
          trend="up"
          accent="emerald"
          delta="Consultations"
          deltaLabel="au prorata officiel"
        />
        <ProgressMetricCard
          title="Lectures Enregistrées"
          total={`${kpis.monthly_consultations_count}`}
          percent={`${kpis.consultations_trend_percent > 0 ? "+" : ""}${kpis.consultations_trend_percent}%`}
          trend={kpis.consultations_trend_percent >= 0 ? "up" : "down"}
          accent="gold"
          delta="Ce mois"
          deltaLabel="sessions actives"
          defaultView="bar"
          data={kpis.consultations_timeline}
        />
        <ProgressMetricCard
          title="Redevances Disponibles"
          total={`${kpis.total_royalties_available.toLocaleString("fr-FR")} ${kpis.currency || "XOF"}`}
          percent="Taux 15%"
          trend="up"
          accent="gold"
          delta="Disponibles"
          deltaLabel="au virement"
        />
      </div>

      {/* DonutChart Répartition des Revenus */}
      {kpis?.revenue_split && kpis.revenue_split.total_ca > 0 && (
        <div className="p-5 sm:p-6 rounded-2xl border border-border bg-background-secondary shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
            <div>
              <h3 className="text-sm font-bold text-navy uppercase tracking-wider mb-0.5">
                Répartition des Revenus
              </h3>
              <p className="text-[11px] text-foreground-muted">
                Transparence sur la répartition entre votre établissement et LAHAThèque.
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[11px] text-foreground-muted block">CA Total des Ventes</span>
              <p className="text-sm font-bold font-mono text-navy">
                {kpis.revenue_split.total_ca.toLocaleString("fr-FR")} {kpis.revenue_split.currency || "XOF"}
              </p>
            </div>
          </div>
          <div className="my-6 flex flex-col md:flex-row items-center justify-around gap-6">
            <DonutChart
              data={donutSegments}
              size={190}
              strokeWidth={22}
              centerContent={
                <div className="text-center">
                  <p className="text-base sm:text-lg font-bold text-navy font-mono">
                    {kpis.revenue_split.total_ca.toLocaleString("fr-FR")}
                  </p>
                  <p className="text-[10px] text-foreground-muted font-medium">FCFA Total</p>
                </div>
              }
            />
            <div className="w-full md:w-auto space-y-3">
              <div className="flex items-center justify-between gap-6 p-3.5 rounded-xl bg-background border border-border min-w-[280px]">
                <div className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-navy shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-navy">Votre établissement</p>
                    <p className="text-[10px] text-foreground-muted">Redevance reversée</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold font-mono text-navy block">
                    {kpis.revenue_split.university_amount.toLocaleString("fr-FR")} FCFA
                  </span>
                  <p className="text-[10px] font-bold text-navy/70">
                    {kpis.revenue_split.university_percent} %
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-6 p-3.5 rounded-xl bg-background border border-border min-w-[280px]">
                <div className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-gold shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-navy">LAHAThèque</p>
                    <p className="text-[10px] text-foreground-muted">Plateforme &amp; infrastructure</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold font-mono text-gold block">
                    {kpis.revenue_split.laha_amount.toLocaleString("fr-FR")} FCFA
                  </span>
                  <p className="text-[10px] font-bold text-gold/80">
                    {kpis.revenue_split.laha_percent} %
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {kpis?.revenue_split?.total_ca === 0 && (
        <div className="p-4 rounded-2xl border border-border bg-background-secondary">
          <h3 className="text-sm font-bold text-navy uppercase tracking-wider mb-1">
            Répartition des Revenus
          </h3>
          <p className="text-xs text-foreground-muted italic">
            Aucune donnée de répartition disponible pour l&apos;instant — apparaîtra après le premier relevé de redevances généré pour votre établissement.
          </p>
        </div>
      )}

      {/* Raccourcis Rapides Partenaire */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <Link
          href="/university/royalties"
          className="p-5 rounded-2xl bg-background border border-border hover:border-gold transition-all shadow-xs flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-navy-light flex items-center justify-center group-hover:bg-gold/15 transition-colors">
              <DollarSign className="w-5 h-5 text-gold" />
            </div>
            <div>
              <p className="font-serif font-bold text-sm text-navy">Redevances Institutionnelles</p>
              <p className="text-[11px] text-foreground-muted">Relevés et demande de virement bancaire</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-foreground-muted group-hover:text-gold transition-colors" />
        </Link>
        <Link
          href="/university/profile"
          className="p-5 rounded-2xl bg-background border border-border hover:border-gold transition-all shadow-xs flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-navy-light flex items-center justify-center group-hover:bg-gold/15 transition-colors">
              <Building2 className="w-5 h-5 text-gold" />
            </div>
            <div>
              <p className="font-serif font-bold text-sm text-navy">Profil & Coordonnées Bancaires</p>
              <p className="text-[11px] text-foreground-muted">Coordonnées de virement et paramètres</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-foreground-muted group-hover:text-gold transition-colors" />
        </Link>
      </div>
    </div>
  );
}
