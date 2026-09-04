"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { ProgressMetricCard } from "@/components/ui/progress-metric-card";
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
  Boxes,
} from "lucide-react";

// Générateur de timeline dynamique basée sur la date réelle
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

export default function WholesalerOverviewPage() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<WholesalerKpis | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getWholesalerKpis();
      setKpis(data);
    } catch (err) {
      console.error("Erreur de chargement du dashboard grossiste", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalVolume = (kpis?.totalLicensesPurchased ?? 0) + (kpis?.totalPrintCopiesPurchased ?? 0);

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-navy border border-navy-hover text-white shadow-md">
        <div>
          {/* Badge Espace Grossiste & Achat en Gros (Masqué à la demande client) */}
          {/*
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-bold mb-2 uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5" />
            Espace Grossiste & Achat en Gros
          </div>
          */}
          <h1 className="text-xl sm:text-2xl font-bold font-serif tracking-tight">
            Bienvenue, {user?.first_name || "Librairie Partenaire"}
          </h1>
          <p className="text-xs sm:text-sm text-navy-light mt-1">
            Passez vos commandes groupées de licences numériques et d&apos;exemplaires papier à tarif grossiste préférentiel.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/wholesaler/catalog"
            className="px-3.5 py-2.5 rounded-2xl bg-navy-dark text-white font-bold text-xs hover:bg-navy-hover border border-navy-hover transition-all flex items-center gap-2 shadow-sm min-h-[44px]"
          >
            <BookOpen className="w-4 h-4 text-gold" />
            Catalogue Grossiste
          </Link>
          <Link
            href="/wholesaler/orders/new"
            className="px-4 py-2.5 rounded-2xl bg-gold text-navy font-bold text-xs hover:bg-gold-light transition-all flex items-center gap-2 shadow-sm min-h-[44px]"
          >
            <PlusCircle className="w-4 h-4" />
            Nouvelle Commande Groupée
          </Link>
        </div>
      </div>

      {/* 4 KPI Cards Interactives avec Bâtonnets Dynamiques (ProgressMetricCard) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/wholesaler/orders" className="block">
          <ProgressMetricCard
            title="Commandes en Cours"
            total={`${kpis?.pendingOrdersCount ?? 0} commandes`}
            percent="En cours"
            trend="up"
            accent="gold"
            delta="Traitement"
            deltaLabel="entrepôt"
            data={getRollingTimeline(kpis?.pendingOrdersCount ?? 0)}
          />
        </Link>

        <Link href="/wholesaler/orders" className="block">
          <ProgressMetricCard
            title="Volume Licences / Livres"
            total={`${totalVolume.toLocaleString("fr-FR")} ex.`}
            percent={`${kpis?.totalLicensesPurchased ?? 0} num. • ${kpis?.totalPrintCopiesPurchased ?? 0} papier`}
            trend="up"
            accent="navy"
            delta="Volume"
            deltaLabel="total"
            data={getRollingTimeline(totalVolume)}
          />
        </Link>

        <Link href="/wholesaler/orders" className="block">
          <ProgressMetricCard
            title="Montant Total Dépensé"
            total={`${(kpis?.totalSpentAmount ?? 0).toLocaleString("fr-FR")} XOF`}
            percent="Achats B2B"
            trend="up"
            accent="gold"
            delta="Facturation"
            deltaLabel="cumulée"
            data={getRollingTimeline(kpis?.totalSpentAmount ?? 0)}
          />
        </Link>

        <Link href="/wholesaler/notifications" className="block">
          <ProgressMetricCard
            title="Nouveautés & Alertes"
            total={`${kpis?.unreadNotificationsCount ?? 0} non lues`}
            percent="Catalogue"
            trend="up"
            accent="navy"
            delta="Parutions"
            deltaLabel="récentes"
            data={getRollingTimeline(kpis?.unreadNotificationsCount ?? 0)}
          />
        </Link>
      </div>

      {/* Raccourcis d'Action */}
      <div className="p-6 rounded-3xl bg-background-secondary border border-border space-y-4 shadow-xs">
        <div className="pb-3 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold font-serif text-navy">Accès Rapide & Gestion des Achats</h2>
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
                    item.primary ? "bg-gold/20 text-gold" : "bg-navy/5 text-navy"
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
