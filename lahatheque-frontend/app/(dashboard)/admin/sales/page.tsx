"use client";

import React, { useEffect, useState } from "react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { TotalSalesChart } from "@/components/ui/total-sales-chart";
import {
  getAdminSales,
  getAdminKpis,
  getRevenueCategoryBreakdown,
} from "@/lib/services/admin";
import {
  AdminSale,
  AdminKpi,
  RevenueCategoryBreakdown,
} from "@/lib/types/admin";
import { Download } from "lucide-react";
import { toast } from "sonner";

export default function AdminSalesPage() {
  const [sales, setSales] = useState<AdminSale[]>([]);
  const [kpis, setKpis] = useState<AdminKpi | null>(null);
  const [revenueBreakdown, setRevenueBreakdown] = useState<RevenueCategoryBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSalesData() {
      try {
        setLoading(true);
        const [salesData, kpisData, breakdownData] = await Promise.all([
          getAdminSales(),
          getAdminKpis(),
          getRevenueCategoryBreakdown(),
        ]);
        setSales(salesData);
        setKpis(kpisData);
        setRevenueBreakdown(breakdownData);
      } catch (err) {
        toast.error("Erreur de chargement des ventes.");
      } finally {
        setLoading(false);
      }
    }
    loadSalesData();
  }, []);

  const columns: DataTableColumn<AdminSale>[] = [
    {
      key: "id",
      header: "N° Commande",
      cell: (row) => <span className="font-mono text-xs font-bold text-navy">{row.order_number || row.id}</span>,
    },
    {
      key: "user_name",
      header: "Acheteur",
      cell: (row) => (
        <div>
          <p className="font-medium text-xs text-foreground">{row.user_name}</p>
          <p className="text-[11px] text-foreground-muted">{row.user_email}</p>
        </div>
      ),
    },
    {
      key: "item",
      header: "Produit / Intitulé",
      cell: (row) => (
        <span className="text-xs text-foreground font-medium">
          {row.book_title || row.subscription_name}
        </span>
      ),
    },
    {
      key: "type",
      header: "Catégorie",
      cell: (row) => (
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-navy-light text-navy font-semibold">
          {row.type === "unitaire_digital"
            ? "Livre numérique"
            : row.type === "bouquet_institution"
            ? "Bouquet B2B"
            : row.type === "abonnement_individuel"
            ? "Pass Lecteur"
            : "Livre papier"}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Montant",
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-foreground">
          {row.amount.toLocaleString("fr-FR")} {row.currency}
        </span>
      ),
    },
    {
      key: "payment_status",
      header: "Paiement",
      cell: (row) => <StatusBadge status={row.payment_status} />,
    },
    {
      key: "created_at",
      header: "Date",
      cell: (row) => (
        <span className="font-mono text-xs text-foreground-muted">
          {row.created_at ? new Date(row.created_at).toLocaleDateString("fr-FR") : "N/A"}
        </span>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy">
            Gestion des Ventes & Revenus Commercialisés
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
            Historique des achats unitaires, abonnements B2C et bouquets universitaires B2B.
          </p>
        </div>

        <button
          onClick={() => toast.info("Export des ventes en cours de téléchargement (Excel)...")}
          className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors flex items-center gap-2 shadow-sm shrink-0"
        >
          <Download className="w-4 h-4" />
          Exporter le Journal
        </button>
      </div>

      {/* Chart */}
      <TotalSalesChart
        totalAmountText={`${(kpis?.totalRevenue ?? 0).toLocaleString("fr-FR")} FCFA`}
        growthBadgeText={`${(kpis?.revenueTrend ?? 0) >= 0 ? "+" : ""}${kpis?.revenueTrend ?? 0}%`}
        channels={revenueBreakdown.map((c) => ({
          name: c.label,
          amount: c.amount,
          change: `${c.percentage >= 0 ? "+" : ""}${c.percentage}%`,
          isPositive: c.percentage >= 0,
        }))}
        curvePoints={(kpis?.salesCurve ?? []).map((p) => p.total)}
      />

      {/* Sales Table */}
      <DataTable
        data={sales}
        columns={columns}
        rowKey="id"
        loading={loading}
        filterKey="type"
        filterOptions={[
          { value: "all", label: "Toutes les catégories" },
          { value: "unitaire_digital", label: "Ventes numériques unitaires" },
          { value: "bouquet_institution", label: "Bouquets Universités (B2B)" },
          { value: "abonnement_individuel", label: "Pass & Abonnements" },
          { value: "unitaire_papier", label: "Livres physiques (papier)" },
        ]}
        filterPlaceholder="Filtrer par catégorie..."
        searchPlaceholder="Rechercher par client, e-mail ou référence..."
      />
    </div>
  );
}
