"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { KpiCard } from "@/components/ui/kpi-card";
import { getLegalKpis } from "@/lib/services/legal";
import type { LegalKpis } from "@/lib/types/legal";
import {
  Scale,
  FileText,
  Percent,
  Sparkles,
  BellRing,
  AlertTriangle,
  PlusCircle,
  ChevronRight,
  ArrowRight,
  BookOpen,
  DollarSign,
  ShieldCheck,
  PenTool,
} from "lucide-react";

export default function LegalReviewerOverviewPage() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<LegalKpis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const kpiData = await getLegalKpis();
        setKpis(kpiData);
      } catch (err) {
        console.error("Erreur de chargement du dashboard juriste", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
      {/* Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-navy border border-navy-hover text-white shadow-md">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-bold mb-2 uppercase tracking-wider">
            <Scale className="w-3.5 h-3.5" />
            Espace Juriste • Gestion Légale &amp; Droits
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif tracking-tight">
            Bonjour, {user?.first_name || "Juriste"} 👋
          </h1>
          <p className="text-xs sm:text-sm text-navy-light mt-1">
            Gérez la base contractuelle, validez les droits d&apos;auteur et pilotez les redevances et relances.
          </p>
        </div>

        <Link
          href="/legal-reviewer/contracts/new"
          className="px-4 py-2.5 rounded-xl bg-gold text-navy font-bold text-xs hover:bg-gold-light transition-all flex items-center gap-2 shadow-sm shrink-0 min-h-[44px]"
        >
          <PlusCircle className="w-4 h-4" />
          Nouveau Contrat
        </Link>
      </div>

      {/* 5 KPI Cards animées (KpiCard de components/ui/kpi-card.tsx) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Link href="/legal-reviewer/contracts" className="block">
          <KpiCard
            label="Contrats Stockés"
            value={kpis?.totalContracts || 4}
            icon={ShieldCheck}
            trend={12}
            trendPeriod="ce mois"
            theme="gold"
            subtext="Archivage légal"
            sparkline={[3, 3, 4, 4]}
          />
        </Link>

        <Link href="/legal-reviewer/royalties?tab=suggestions" className="block">
          <KpiCard
            label="Suggestions IA Droits"
            value={kpis?.pendingAiSuggestions || 2}
            icon={Sparkles}
            trend={0}
            theme="amber"
            subtext="À valider"
            sparkline={[1, 2, 2, 2]}
          />
        </Link>

        <Link href="/legal-reviewer/relances?tab=debts" className="block">
          <KpiCard
            label="Clients en Impayé"
            value={kpis?.clientsInDebt || 2}
            icon={AlertTriangle}
            trend={-5}
            theme="rose"
            subtext="Factures échues"
            sparkline={[3, 3, 2, 2]}
          />
        </Link>

        <Link href="/legal-reviewer/relances?tab=authors" className="block">
          <KpiCard
            label="Relances Envoyées"
            value={kpis?.authorRemindersSent || 2}
            icon={BellRing}
            trend={15}
            theme="emerald"
            subtext="Auteurs &amp; Ventes"
            sparkline={[1, 1, 2, 2]}
          />
        </Link>

        <Link href="/legal-reviewer/pre-editions" className="block">
          <KpiCard
            label="Pré-éditions Actives"
            value={kpis?.activePreEditions || 2}
            icon={PenTool}
            trend={8}
            theme="navy"
            subtext="Avant dépôt"
            sparkline={[1, 2, 2, 2]}
          />
        </Link>
      </div>

      {/* Raccourcis & Actions Rapides */}
      <div className="p-6 rounded-3xl bg-background-secondary border border-border space-y-4 shadow-xs">
        <div className="pb-3 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold font-serif text-navy">Actions Rapides &amp; Module Juridique</h2>
            <p className="text-[11px] text-foreground-muted mt-0.5">Accès direct aux 6 sous-modules</p>
          </div>
          <Link
            href="/legal-reviewer/contracts"
            className="text-xs font-bold text-gold hover:text-gold-dark flex items-center gap-1"
          >
            Tous les contrats <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              label: "Téléverser un Contrat",
              desc: "Enregistrer un nouveau contrat PDF/Word indexé",
              icon: PlusCircle,
              href: "/legal-reviewer/contracts/new",
              primary: true,
            },
            {
              label: "Valider Suggestions IA",
              desc: "Examiner et ajuster les partages de droits co-auteurs",
              icon: Sparkles,
              href: "/legal-reviewer/royalties?tab=suggestions",
            },
            {
              label: "Nouveau Contrat Pré-édition",
              desc: "Pré-enregistrer un ouvrage avant dépôt effectif",
              icon: PenTool,
              href: "/legal-reviewer/pre-editions",
            },
            {
              label: "Droits d'Auteur & Rétroactivité",
              desc: "Gérer et ajuster les taux de droits par livre",
              icon: Percent,
              href: "/legal-reviewer/royalties",
            },
            {
              label: "Redevances Universités & Tiers",
              desc: "Suivre les 15% fixes et modifier les taux partenaires",
              icon: DollarSign,
              href: "/legal-reviewer/redevances",
            },
            {
              label: "Relances Impayés Clients",
              desc: "Configurer le seuil et la fréquence des relances",
              icon: BellRing,
              href: "/legal-reviewer/relances",
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
