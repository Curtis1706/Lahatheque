"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { KpiCard } from "@/components/ui/kpi-card";
import { getPublisherKpis } from "@/lib/services/publisher";
import type { PublisherKpis } from "@/lib/types/publisher";
import {
  Building2,
  BookOpen,
  Eye,
  Download,
  DollarSign,
  PlusCircle,
  UploadCloud,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Key,
  Clock,
} from "lucide-react";

export default function PublisherOverviewPage() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<PublisherKpis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const kpiData = await getPublisherKpis();
        setKpis(kpiData);
      } catch (err) {
        console.error("Erreur de chargement du dashboard éditeur tiers", err);
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
            <Building2 className="w-3.5 h-3.5" />
            Espace Éditeur Tiers Partenaire
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif tracking-tight">
            Bienvenue, {user?.first_name || "Éditions Partner"} 👋
          </h1>
          <p className="text-xs sm:text-sm text-navy-light mt-1">
            Gérez votre catalogue numérique, vos dépôts unitaire ou ONIX 3.0 et suivez vos redevances.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/publisher/catalog/batch"
            className="px-3.5 py-2.5 rounded-xl bg-navy-dark text-white font-bold text-xs hover:bg-navy-hover border border-navy-hover transition-all flex items-center gap-2 shadow-sm min-h-[44px]"
          >
            <UploadCloud className="w-4 h-4 text-gold" />
            Import ONIX 3.0
          </Link>
          <Link
            href="/publisher/catalog/new"
            className="px-4 py-2.5 rounded-xl bg-gold text-navy font-bold text-xs hover:bg-gold-light transition-all flex items-center gap-2 shadow-sm min-h-[44px]"
          >
            <PlusCircle className="w-4 h-4" />
            Nouveau Dépôt Web
          </Link>
        </div>
      </div>

      {/* 4 KPI Cards animées (KpiCard de components/ui/kpi-card.tsx) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/publisher/catalog" className="block">
          <KpiCard
            label="Catalogue Déposé"
            value={kpis?.totalBooks || 3}
            icon={BookOpen}
            trend={10}
            trendPeriod="ce mois"
            theme="gold"
            subtext={`${kpis?.publishedBooks || 1} publié(s) • ${kpis?.pendingValidations || 2} en cours`}
            sparkline={[2, 2, 3, 3]}
          />
        </Link>

        <Link href="/publisher/stats" className="block">
          <KpiCard
            label="Consultations &amp; Lecteurs"
            value={kpis?.totalConsultations || 1420}
            icon={Eye}
            trend={18}
            theme="blue"
            subtext={`${kpis?.totalDownloads || 380} téléchargements`}
            sparkline={[900, 1100, 1300, 1420]}
          />
        </Link>

        <Link href="/publisher/royalties" className="block">
          <KpiCard
            label="Chiffre d'Affaires Généré"
            value={kpis?.totalRevenue || 5700000}
            formatValue={(v) => `${v.toLocaleString("fr-FR")} XOF`}
            icon={DollarSign}
            trend={14}
            theme="emerald"
            subtext="Ventes cumulées"
            sparkline={[3000000, 4500000, 5200000, 5700000]}
          />
        </Link>

        <Link href="/publisher/royalties" className="block">
          <KpiCard
            label="Redevances Dues"
            value={kpis?.pendingRoyalties || 1254000}
            formatValue={(v) => `${v.toLocaleString("fr-FR")} XOF`}
            icon={Building2}
            trend={0}
            theme="amber"
            subtext={`Taux contractuel : ${kpis?.contractualRoyaltyRate || 22}%`}
            sparkline={[800000, 1000000, 1254000, 1254000]}
          />
        </Link>
      </div>

      {/* Raccourcis & Actions Rapides */}
      <div className="p-6 rounded-3xl bg-background-secondary border border-border space-y-4 shadow-xs">
        <div className="pb-3 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold font-serif text-navy">Gestion du Catalogue &amp; Intégration Système</h2>
            <p className="text-[11px] text-foreground-muted mt-0.5">Accès direct aux modules de gestion de votre maison d&apos;édition</p>
          </div>
          <Link
            href="/publisher/catalog"
            className="text-xs font-bold text-gold hover:text-gold-dark flex items-center gap-1"
          >
            Voir tout le catalogue <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              label: "Nouveau Dépôt Unitaire",
              desc: "Formulaire web 6 blocs avec assistance IA",
              icon: PlusCircle,
              href: "/publisher/catalog/new",
              primary: true,
            },
            {
              label: "Importation en Lot ONIX 3.0",
              desc: "Téléverser un fichier XML, CSV, JSON ou ZIP",
              icon: UploadCloud,
              href: "/publisher/catalog/batch",
            },
            {
              label: "Gestion des Clés API",
              desc: "Client Credentials OAuth 2.0 pour votre ERP",
              icon: Key,
              href: "/publisher/api",
            },
            {
              label: "Protections Anti-Piratage",
              desc: "Configurer le filigrane et les règles DRM LCP",
              icon: ShieldCheck,
              href: "/publisher/catalog/pub-book-01/protection",
            },
            {
              label: "Redevances &amp; Factures",
              desc: "Consulter les paiements et le taux contractuel",
              icon: DollarSign,
              href: "/publisher/royalties",
            },
            {
              label: "Journaux de Traçabilité",
              desc: "Inspecter les accès et tatouages par utilisateur",
              icon: Clock,
              href: "/publisher/logs",
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
