"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  getAdminStockOverview,
} from "@/lib/services/admin";
import { AdminStockOverview, AdminWarehouse } from "@/lib/types/admin";
import {
  Boxes,
  Building2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Clock,
  CheckCircle2,
  PackageCheck,
  Plus,
  Loader2,
  MapPin,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { PageLoader } from "@/components/ui/page-loader";

export default function AdminStockOverviewPage() {
  const [overview, setOverview] = useState<AdminStockOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStock() {
      try {
        setLoading(true);
        const data = await getAdminStockOverview();
        setOverview(data);
      } catch {
        toast.error("Impossible de charger les données de stock physique.");
      } finally {
        setLoading(false);
      }
    }
    loadStock();
  }, []);

  if (loading || !overview) {
    return <PageLoader label="Supervision des stocks multi-entrepôts" />;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* En-tête avec fil d'Ariane */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 text-xs text-foreground-muted mb-1">
            <Link href="/admin" className="hover:text-navy transition-colors">Administration</Link>
            <span>/</span>
            <span className="text-navy font-semibold">Stock Physique & Entrepôts</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy flex items-center gap-2.5">
            <Boxes className="w-6 h-6 text-gold" />
            Supervision des Stocks Physiques Régionaux
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
            Pilotage consolidé des stocks papier, valorisation d'inventaire et arbitrage des régularisations exceptionnelles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/stock/movements"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy/90 transition-colors shadow-xs"
          >
            <TrendingDown className="w-4 h-4 text-gold" />
            <span>Mouvements & Pertes</span>
          </Link>
          <Link
            href="/admin/stock/warehouses"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-background border border-border text-foreground text-xs font-semibold hover:border-gold transition-colors"
          >
            <Building2 className="w-4 h-4 text-gold" />
            <span>Gérer les Entrepôts</span>
          </Link>
        </div>
      </div>

      {/* Cartes d'Indicateurs Consolidation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-background-secondary border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground-muted">Stock Physique Total</span>
            <Boxes className="w-4 h-4 text-gold" />
          </div>
          <p className="text-2xl font-bold font-serif text-navy mt-2">
            {overview.totalPhysicalStock.toLocaleString("fr-FR")}
          </p>
          <p className="text-[11px] text-foreground-muted mt-1">Exemplaires papier en stock</p>
        </div>

        <div className="p-4 rounded-2xl bg-background-secondary border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground-muted">Valeur Consolidée</span>
            <PackageCheck className="w-4 h-4 text-success" />
          </div>
          <p className="text-2xl font-bold font-mono text-navy mt-2">
            {overview.totalStockValueXof.toLocaleString("fr-FR")} <span className="text-xs font-sans text-gold">FCFA</span>
          </p>
          <p className="text-[11px] text-foreground-muted mt-1">Valorisation au prix public moyen</p>
        </div>

        <div className="p-4 rounded-2xl bg-background-secondary border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground-muted">Entrepôts Actifs</span>
            <Building2 className="w-4 h-4 text-navy" />
          </div>
          <p className="text-2xl font-bold font-serif text-navy mt-2">{overview.totalWarehouses}</p>
          <p className="text-[11px] text-foreground-muted mt-1">Hubs logistiques régionaux</p>
        </div>

        <Link
          href="/admin/stock/movements"
          className="p-4 rounded-2xl bg-gold/10 border border-gold/30 hover:border-gold transition-all block group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-navy">Régularisations en Attente</span>
            <Clock className="w-4 h-4 text-gold" />
          </div>
          <p className="text-2xl font-bold font-serif text-navy mt-2">
            {overview.pendingLossAdjustments}
          </p>
          <p className="text-[11px] text-foreground-muted mt-1 group-hover:text-navy flex items-center gap-1 transition-colors">
            <span>Passations en perte à valider</span>
            <ArrowRight className="w-3 h-3 text-gold" />
          </p>
        </Link>
      </div>

      {/* Grille des Entrepôts Régionaux */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gold" />
            Entrepôts & Plateformes de Distribution
          </h2>

          <Link
            href="/admin/stock/warehouses"
            className="text-xs text-navy font-semibold hover:text-gold transition-colors flex items-center gap-1"
          >
            <span>Voir tous les hubs</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {overview.warehouses.map((wh) => (
            <div
              key={wh.id}
              className="p-5 rounded-2xl bg-background-secondary border border-border space-y-4 hover:border-gold/50 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-navy/10 text-navy">
                    {wh.code}
                  </span>
                  <h3 className="text-sm font-bold text-foreground font-serif mt-1">
                    {wh.name}
                  </h3>
                </div>
                <span className="text-xs text-foreground-muted flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
                  {wh.city}, {wh.country}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
                <div className="p-2.5 rounded-xl bg-background border border-border">
                  <span className="text-[10px] text-foreground-muted">Exemplaires</span>
                  <p className="font-bold text-navy font-mono mt-0.5">
                    {wh.total_items.toLocaleString("fr-FR")}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-background border border-border">
                  <span className="text-[10px] text-foreground-muted">Alertes Rupture</span>
                  <p className={`font-bold font-mono mt-0.5 ${wh.critical_alerts > 0 ? "text-error" : "text-success"}`}>
                    {wh.critical_alerts} critique{wh.critical_alerts > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-foreground-muted pt-1">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3 text-gold" />
                  {wh.manager_name}
                </span>
                <span className="text-success font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Opérationnel
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
