"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { ProgressMetricCard } from "@/components/ui/progress-metric-card";
import { DonutChart, DonutChartSegment } from "@/components/ui/donut-chart";
import { getManagerKpis, getWarehouseDistribution } from "@/lib/services/manager";
import type { ManagerKpi, WarehouseDistribution } from "@/lib/types/manager";
import {
  Warehouse,
  AlertTriangle,
  Package,
  Truck,
  PackageCheck,
  ChevronRight,
  Sparkles,
  FileBarChart,
  ArrowUpCircle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function ManagerOverviewPage() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<ManagerKpi | null>(null);
  const [distribution, setDistribution] = useState<WarehouseDistribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [kpiData, distData] = await Promise.all([
          getManagerKpis(),
          getWarehouseDistribution(),
        ]);
        setKpis(kpiData);
        setDistribution(distData);
      } catch (err) {
        console.error("Erreur de chargement du dashboard gestionnaire", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const donutSegments: DonutChartSegment[] = distribution.map((d) => ({
    value: d.total_quantity,
    label: d.warehouse,
    color: d.colorToken,
    percentage: d.percentage,
  }));

  const totalStock = distribution.reduce((acc, d) => acc + d.total_quantity, 0);

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-navy border border-navy-hover text-white shadow-md">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Espace Gestionnaire
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif tracking-tight">
            Bonjour, {user?.first_name || "Gestionnaire"} 👋
          </h1>
          <p className="text-xs sm:text-sm text-navy-light mt-1">
            Suivi du stock papier, des expéditions et de la coordination logistique.
          </p>
        </div>

        <Link
          href="/manager/reports"
          className="px-4 py-2.5 rounded-xl bg-gold text-navy font-semibold text-xs hover:bg-gold-light transition-all flex items-center gap-2 shadow-sm shrink-0"
        >
          <FileBarChart className="w-4 h-4" />
          Rapports &amp; Export
        </Link>
      </div>

      {/* 6 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ProgressMetricCard
          title="Stock Total (Papier)"
          total={`${(kpis?.totalStock || 567).toLocaleString("fr-FR")} exemplaires`}
          percent="+2.1%"
          trend="up"
          accent="navy"
          delta="+24 ex."
          deltaLabel="ce mois"
          data={[
            { value: 520, date: "01 Juil" },
            { value: 535, date: "08 Juil" },
            { value: 548, date: "15 Juil" },
            { value: 567, date: "22 Juil" },
          ]}
        />
        <Link href="/manager/stock/alerts" className="block">
          <ProgressMetricCard
            title="Ruptures de Stock"
            total={`${kpis?.outOfStockCount || 1} ouvrage${(kpis?.outOfStockCount || 1) > 1 ? "s" : ""}`}
            percent="Urgent"
            trend="down"
            accent="rose"
            delta="+1 rupture"
            deltaLabel="cette semaine"
            data={[
              { value: 0, date: "01 Juil" },
              { value: 0, date: "08 Juil" },
              { value: 1, date: "15 Juil" },
              { value: 1, date: "22 Juil" },
            ]}
          />
        </Link>
        <Link href="/manager/stock/alerts" className="block">
          <ProgressMetricCard
            title="Seuil Bas"
            total={`${kpis?.lowStockCount || 2} référence${(kpis?.lowStockCount || 2) > 1 ? "s" : ""}`}
            percent="Attention"
            trend="down"
            accent="gold"
            delta="+1 alerte"
            deltaLabel="ce mois"
            data={[
              { value: 1, date: "01 Juil" },
              { value: 1, date: "08 Juil" },
              { value: 2, date: "15 Juil" },
              { value: 2, date: "22 Juil" },
            ]}
          />
        </Link>
        <Link href="/manager/delivery" className="block">
          <ProgressMetricCard
            title="Commandes à Expédier"
            total={`${kpis?.ordersToShip || 2} commande${(kpis?.ordersToShip || 2) > 1 ? "s" : ""}`}
            percent="Action"
            trend="down"
            accent="gold"
            delta="+2 aujourd'hui"
            deltaLabel="en attente"
            data={[
              { value: 4, date: "01 Juil" },
              { value: 3, date: "08 Juil" },
              { value: 2, date: "15 Juil" },
              { value: 2, date: "22 Juil" },
            ]}
          />
        </Link>
        <Link href="/manager/delivery/in-transit" className="block">
          <ProgressMetricCard
            title="En Cours de Livraison"
            total={`${kpis?.ordersInTransit || 2} commande${(kpis?.ordersInTransit || 2) > 1 ? "s" : ""}`}
            percent="+0"
            trend="up"
            accent="emerald"
            delta="2 en transit"
            deltaLabel="actuellement"
            data={[
              { value: 3, date: "01 Juil" },
              { value: 2, date: "08 Juil" },
              { value: 1, date: "15 Juil" },
              { value: 2, date: "22 Juil" },
            ]}
          />
        </Link>
        <ProgressMetricCard
          title="Livrées ce Mois"
          total={`${kpis?.deliveredThisMonth || 2} commande${(kpis?.deliveredThisMonth || 2) > 1 ? "s" : ""}`}
          percent="+100%"
          trend="up"
          accent="emerald"
          delta="+2 livraisons"
          deltaLabel="ce mois"
          data={[
            { value: 4, date: "01 Juil" },
            { value: 6, date: "08 Juil" },
            { value: 8, date: "15 Juil" },
            { value: 2, date: "01 Août" },
          ]}
        />
      </div>

      {/* Distribution + Actions Rapides */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Répartition Stock par Entrepôt */}
        <div className="lg:col-span-5 p-5 sm:p-6 rounded-2xl bg-background-secondary border border-border flex flex-col items-center justify-between shadow-xs min-h-[360px]">
          <div className="w-full flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Répartition par Entrepôt</h3>
              <p className="text-xs text-foreground-muted">Stock papier disponible</p>
            </div>
            <Link
              href="/manager/stock"
              className="text-xs font-medium text-gold hover:text-gold-dark flex items-center gap-1"
            >
              Voir tout <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="my-6">
            <DonutChart
              data={donutSegments}
              size={180}
              strokeWidth={24}
              centerContent={
                <div>
                  <p className="text-2xl font-bold text-foreground font-mono">{totalStock}</p>
                  <p className="text-[11px] text-foreground-muted font-medium">Total</p>
                </div>
              }
            />
          </div>

          <div className="w-full grid grid-cols-1 gap-2 pt-3 border-t border-border">
            {distribution.map((d) => (
              <div key={d.warehouse} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.colorToken }} />
                <span className="text-foreground-muted truncate">{d.warehouse} ({d.country})</span>
                <span className="font-semibold text-foreground font-mono ml-auto">{d.total_quantity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions Rapides */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-background-secondary border border-border space-y-4 shadow-xs">
            <div className="pb-3 border-b border-border">
              <h2 className="text-base font-bold font-serif text-navy">Actions Rapides</h2>
              <p className="text-[11px] text-foreground-muted mt-0.5">Accès direct aux modules logistiques</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { label: "Vue Globale du Stock", icon: Warehouse, href: "/manager/stock", desc: "Quantités par entrepôt" },
                { label: "Mouvements de Stock", icon: Package, href: "/manager/stock/movements", desc: "Réassorts & Sorties" },
                { label: "Alertes de Rupture", icon: AlertTriangle, href: "/manager/stock/alerts", desc: "Seuils bas & ruptures" },
                { label: "Commandes à Expédier", icon: Package, href: "/manager/delivery", desc: "En attente d'envoi" },
                { label: "En Cours de Livraison", icon: Truck, href: "/manager/delivery/in-transit", desc: "Avec N° de suivi" },
                { label: "Commandes Livrées", icon: PackageCheck, href: "/manager/delivery/delivered", desc: "Historique livraisons" },
                { label: "Coordination Admin", icon: ArrowUpCircle, href: "/manager/coordination", desc: "Ruptures remontées" },
                { label: "Rapports & Export", icon: FileBarChart, href: "/manager/reports", desc: "Stock & Livraison" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="p-3 rounded-xl bg-background border border-border hover:border-gold transition-all flex items-center justify-between group shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-navy-light text-navy group-hover:bg-navy group-hover:text-white transition-colors shrink-0">
                      <item.icon className="w-4 h-4 text-gold" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-foreground group-hover:text-navy transition-colors truncate">
                        {item.label}
                      </p>
                      <p className="text-[10px] text-foreground-muted truncate">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-foreground-muted group-hover:text-gold transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
