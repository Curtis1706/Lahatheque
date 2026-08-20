"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { KpiCard } from "@/components/ui/kpi-card";
import { getUniversityKpis } from "@/lib/services/librarian";
import type { UniversityKpis } from "@/lib/types/librarian";
import {
  GraduationCap,
  BookOpen,
  Eye,
  DollarSign,
  Sparkles,
  ChevronRight,
  ArrowRight,
  FileBarChart,
  PackageCheck,
  Building2,
  Percent,
} from "lucide-react";

export default function UniversityOverviewPage() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<UniversityKpis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getUniversityKpis();
        setKpis(data);
      } catch (err) {
        console.error("Erreur de chargement du dashboard université", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 sm:space-y-8">
      {/* Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-navy border border-navy-hover text-white shadow-md">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-bold mb-2 uppercase tracking-wider">
            <GraduationCap className="w-3.5 h-3.5" />
            {kpis?.institutionName || "Université d'Abomey-Calavi (UAC)"}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif tracking-tight">
            Espace Université — Tableau de Bord Institutionnel
          </h1>
          <p className="text-xs sm:text-sm text-navy-light mt-1">
            Suivez les ventes et l&apos;utilisation des ressources par faculté, gérez les bouquets et votre redevance de 15%.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/librarian/bouquets"
            className="px-3.5 py-2.5 rounded-xl bg-navy-dark text-white font-bold text-xs hover:bg-navy-hover border border-navy-hover transition-all flex items-center gap-2 shadow-sm min-h-[44px]"
          >
            <Sparkles className="w-4 h-4 text-gold" />
            Bouquets Documentaires
          </Link>
          <Link
            href="/librarian/catalog"
            className="px-4 py-2.5 rounded-xl bg-gold text-navy font-bold text-xs hover:bg-gold-light transition-all flex items-center gap-2 shadow-sm min-h-[44px]"
          >
            <BookOpen className="w-4 h-4" />
            Mon Catalogue Établissement
          </Link>
        </div>
      </div>

      {/* 5 KPI Cards animées (KpiCard de components/ui/kpi-card.tsx) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Link href="/librarian/catalog" className="block">
          <KpiCard
            label="Ouvrages Rattachés"
            value={kpis?.totalBooksCount || 4}
            icon={BookOpen}
            trend={8}
            trendPeriod="ce mois"
            theme="gold"
            subtext="FADESP, FASEG, FSS, FSA"
            sparkline={[3, 3, 4, 4]}
          />
        </Link>

        <Link href="/librarian/stats" className="block">
          <KpiCard
            label="Consultations &amp; Usages"
            value={kpis?.totalConsultations || 9360}
            icon={Eye}
            trend={14}
            theme="blue"
            subtext={`${kpis?.totalDownloads || 3140} téléch. • ${kpis?.totalAudioListens || 1230} audio`}
            sparkline={[6000, 7500, 8800, 9360]}
          />
        </Link>

        <Link href="/librarian/stats" className="block">
          <KpiCard
            label="Revenus Générés"
            value={kpis?.totalRevenue || 51950000}
            formatValue={(v) => `${v.toLocaleString("fr-FR")} XOF`}
            icon={DollarSign}
            trend={12}
            theme="emerald"
            subtext="Ventes brutes des ouvrages"
            sparkline={[30000000, 42000000, 48000000, 51950000]}
          />
        </Link>

        <Link href="/librarian/redevances" className="block">
          <KpiCard
            label="Redevances 15% Dues"
            value={kpis?.pendingRoyalties || 7792500}
            formatValue={(v) => `${v.toLocaleString("fr-FR")} XOF`}
            icon={Percent}
            trend={0}
            theme="amber"
            subtext={`Solde restant : ${(kpis?.remainingBalance || 2042500).toLocaleString("fr-FR")} XOF`}
            sparkline={[5000000, 6500000, 7792500, 7792500]}
          />
        </Link>

        <Link href="/librarian/bouquets" className="block">
          <KpiCard
            label="Bouquets Actifs"
            value={kpis?.activeBundlesCount || 2}
            icon={Sparkles}
            trend={0}
            theme="amber"
            subtext="Abonnements souscrits"
            sparkline={[1, 2, 2, 2]}
          />
        </Link>
      </div>

      {/* Raccourcis d'Action */}
      <div className="p-6 rounded-3xl bg-background-secondary border border-border space-y-4 shadow-xs">
        <div className="pb-3 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold font-serif text-navy">Gestion des Ressources &amp; Suivi Institutionnel</h2>
            <p className="text-[11px] text-foreground-muted mt-0.5">Accès direct aux statistiques, bouquets et redevances 15%</p>
          </div>
          <Link
            href="/librarian/stats"
            className="text-xs font-bold text-gold hover:text-gold-dark flex items-center gap-1"
          >
            Voir les statistiques <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              label: "Catalogue par Faculté",
              desc: "Arborescence FADESP, FASEG, FSS, FSA...",
              icon: GraduationCap,
              href: "/librarian/catalog",
              primary: true,
            },
            {
              label: "Statistiques Ventes & Usage",
              desc: "Téléchargements, lectures et écoutes audio",
              icon: FileBarChart,
              href: "/librarian/stats",
            },
            {
              label: "Bouquets Documentaires",
              desc: "Gérer et souscrire des packs pour étudiants",
              icon: Sparkles,
              href: "/librarian/bouquets",
            },
            {
              label: "Achats Livres Papier",
              desc: "Commandes unitaires et groupées papier",
              icon: PackageCheck,
              href: "/librarian/purchases",
            },
            {
              label: "Redevances 15% & Relevés",
              desc: "Suivi du taux fixe 15% et des paiements",
              icon: Percent,
              href: "/librarian/redevances",
            },
            {
              label: "Profil & Coordonnées",
              desc: "Coordonnées de l'établissement et RIB",
              icon: Building2,
              href: "/librarian/profile",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between group shadow-xs ${
                item.primary
                  ? "bg-navy border-navy-hover text-white hover:border-gold"
                  : "bg-background border-border hover:border-gold text-foreground"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`p-2.5 rounded-xl shrink-0 ${
                    item.primary ? "bg-gold/20 text-gold" : "bg-navy-light text-navy"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p
                    className={`font-bold text-xs truncate ${
                      item.primary ? "text-white" : "text-navy"
                    }`}
                  >
                    {item.label}
                  </p>
                  <p className="text-[10px] text-foreground-muted truncate">{item.desc}</p>
                </div>
              </div>
              <ChevronRight
                className={`w-4 h-4 shrink-0 transition-colors ${
                  item.primary ? "text-gold" : "text-foreground-muted group-hover:text-gold"
                }`}
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
