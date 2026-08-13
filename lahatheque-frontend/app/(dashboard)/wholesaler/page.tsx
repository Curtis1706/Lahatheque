"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { KpiCard } from "@/components/ui/kpi-card";
import { getWholesalerKpis } from "@/lib/services/wholesaler";
import type { WholesalerKpis } from "@/lib/types/wholesaler";
import {
  PackageCheck,
  BookOpen,
  DollarSign,
  BellRing,
  PlusCircle,
  ChevronRight,
  ArrowRight,
  Building2,
  TrendingUp,
  FileText,
} from "lucide-react";

export default function WholesalerOverviewPage() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<WholesalerKpis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getWholesalerKpis();
        setKpis(data);
      } catch (err) {
        console.error("Erreur de chargement du dashboard grossiste", err);
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
            Espace Grossiste &amp; Achat en Gros
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif tracking-tight">
            Bienvenue, {user?.first_name || "Librairie Internationale"} 👋
          </h1>
          <p className="text-xs sm:text-sm text-navy-light mt-1">
            Passez vos commandes groupées de licences numériques et d&apos;exemplaires papier à tarif grossiste préférentiel.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/wholesaler/catalog"
            className="px-3.5 py-2.5 rounded-xl bg-navy-dark text-white font-bold text-xs hover:bg-navy-hover border border-navy-hover transition-all flex items-center gap-2 shadow-sm min-h-[44px]"
          >
            <BookOpen className="w-4 h-4 text-gold" />
            Catalogue Grossiste
          </Link>
          <Link
            href="/wholesaler/orders/new"
            className="px-4 py-2.5 rounded-xl bg-gold text-navy font-bold text-xs hover:bg-gold-light transition-all flex items-center gap-2 shadow-sm min-h-[44px]"
          >
            <PlusCircle className="w-4 h-4" />
            Nouvelle Commande Groupée
          </Link>
        </div>
      </div>

      {/* 4 KPI Cards animées (KpiCard de components/ui/kpi-card.tsx) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/wholesaler/orders" className="block">
          <KpiCard
            label="Commandes en Cours"
            value={kpis?.pendingOrdersCount || 1}
            icon={PackageCheck}
            trend={5}
            trendPeriod="ce mois"
            theme="gold"
            subtext="Traitement &amp; Expédition entrepôt"
            sparkline={[1, 1, 2, 1]}
          />
        </Link>

        <Link href="/wholesaler/orders" className="block">
          <KpiCard
            label="Volume de Licences / Livres"
            value={(kpis?.totalLicensesPurchased || 300) + (kpis?.totalPrintCopiesPurchased || 150)}
            icon={BookOpen}
            trend={12}
            theme="blue"
            subtext={`${kpis?.totalLicensesPurchased || 300} num. • ${kpis?.totalPrintCopiesPurchased || 150} papier`}
            sparkline={[200, 320, 410, 450]}
          />
        </Link>

        <Link href="/wholesaler/orders" className="block">
          <KpiCard
            label="Montant Total Dépensé"
            value={kpis?.totalSpentAmount || 4425000}
            formatValue={(v) => `${v.toLocaleString("fr-FR")} XOF`}
            icon={DollarSign}
            trend={15}
            theme="emerald"
            subtext="Achats cumulés"
            sparkline={[2000000, 3100000, 4000000, 4425000]}
          />
        </Link>

        <Link href="/wholesaler/notifications" className="block">
          <KpiCard
            label="Notifications Nouveautés"
            value={kpis?.unreadNotificationsCount || 2}
            icon={BellRing}
            trend={0}
            theme="amber"
            subtext="Nouveautés &amp; Meilleures ventes"
            sparkline={[1, 2, 2, 2]}
          />
        </Link>
      </div>

      {/* Raccourcis d'Action */}
      <div className="p-6 rounded-3xl bg-background-secondary border border-border space-y-4 shadow-xs">
        <div className="pb-3 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold font-serif text-navy">Accès Rapide &amp; Gestion des Achats</h2>
            <p className="text-[11px] text-foreground-muted mt-0.5">Commandes groupées, nouveautés du catalogue et facturation</p>
          </div>
          <Link
            href="/wholesaler/orders"
            className="text-xs font-bold text-gold hover:text-gold-dark flex items-center gap-1"
          >
            Voir mes commandes <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              label: "Catalogue & Achat Gros",
              desc: "Parcourir le catalogue et sélectionner des quantités",
              icon: BookOpen,
              href: "/wholesaler/catalog",
              primary: true,
            },
            {
              label: "Nouvelle Commande Groupée",
              desc: "Valider votre panier mixte (numérique + papier)",
              icon: PlusCircle,
              href: "/wholesaler/orders/new",
            },
            {
              label: "Historique des Commandes",
              desc: "Suivre la livraison et télécharger les factures",
              icon: PackageCheck,
              href: "/wholesaler/orders",
            },
            {
              label: "Nouveautés & Meilleures Ventes",
              desc: "Alerte automatique sur les parutions populaires",
              icon: BellRing,
              href: "/wholesaler/notifications",
            },
            {
              label: "Profil & Facturation",
              desc: "Coordonnées de l'entreprise et préférences",
              icon: Building2,
              href: "/wholesaler/profile",
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
