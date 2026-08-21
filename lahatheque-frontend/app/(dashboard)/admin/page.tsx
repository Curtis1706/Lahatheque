"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { ProgressMetricCard } from "@/components/ui/progress-metric-card";
import { DonutChart, DonutChartSegment } from "@/components/ui/donut-chart";
import { TotalSalesChart } from "@/components/ui/total-sales-chart";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getAdminKpis,
  getRoleDistribution,
  getAdminSales,
  getAdminReminders,
  getRevenueCategoryBreakdown,
} from "@/lib/services/admin";
import {
  AdminKpi,
  RoleDistribution,
  AdminSale,
  AdminReminder,
  RevenueCategoryBreakdown,
} from "@/lib/types/admin";
import {
  DollarSign,
  ShoppingBag,
  BookOpen,
  Users,
  BellRing,
  ShieldAlert,
  ArrowRight,
  UserPlus,
  FileText,
  Activity,
  Layers,
  Sparkles,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

export default function AdminOverviewDashboard() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<AdminKpi | null>(null);
  const [rolesDist, setRolesDist] = useState<RoleDistribution[]>([]);
  const [revenueBreakdown, setRevenueBreakdown] = useState<RevenueCategoryBreakdown[]>([]);
  const [recentSales, setRecentSales] = useState<AdminSale[]>([]);
  const [reminders, setReminders] = useState<AdminReminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [kpiData, rolesData, salesData, remindersData, revenueBreakdownData] = await Promise.all([
          getAdminKpis(),
          getRoleDistribution(),
          getAdminSales(),
          getAdminReminders(),
          getRevenueCategoryBreakdown(),
        ]);
        setKpis(kpiData);
        setRolesDist(rolesData);
        setRecentSales(salesData);
        setReminders(remindersData);
        setRevenueBreakdown(revenueBreakdownData);
      } catch (err) {
        console.error("Erreur de chargement du dashboard admin", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const donutSegments: DonutChartSegment[] = rolesDist.map((r) => ({
    value: r.count,
    label: r.label,
    color: r.colorToken,
    percentage: r.percentage,
  }));

  const totalUsersCount = rolesDist.reduce((acc, r) => acc + r.count, 0);

  const salesColumns: DataTableColumn<AdminSale>[] = [
    {
      key: "id",
      header: "Référence",
      cell: (row) => <span className="font-mono font-medium text-xs text-foreground">{row.id}</span>,
    },
    {
      key: "user_name",
      header: "Client / Université",
      cell: (row) => (
        <div>
          <p className="font-medium text-xs text-foreground">{row.user_name}</p>
          <p className="text-[11px] text-foreground-muted">{row.user_email}</p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      cell: (row) => (
        <span className="text-xs px-2 py-0.5 rounded-full bg-navy-light text-navy font-medium">
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
      header: "Statut",
      cell: (row) => <StatusBadge status={row.payment_status} />,
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6">
      {/* Header Banner Full Width */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-navy border border-navy-hover text-white shadow-md">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Espace Super Administration
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif tracking-tight">
            Bonjour, {user?.first_name || "Administrateur"}
          </h1>
          <p className="text-xs sm:text-sm text-navy-light mt-1">
            Supervision globale de LAHAThèque : utilisateurs, ventes B2C/B2B, redevances et sécurité.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/users"
            className="px-4 py-2.5 rounded-xl bg-gold text-navy font-semibold text-xs hover:bg-gold-light transition-all flex items-center gap-2 shadow-sm shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            Créer un compte
          </Link>
        </div>
      </div>

      {/* 6 KPI Cards Grid Plein Écran */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ProgressMetricCard
          title="Chiffre d'Affaires Cumulé"
          total={`${(kpis?.totalRevenue ?? 0).toLocaleString("fr-FR")} FCFA`}
          percent={`${(kpis?.revenueTrend ?? 0) >= 0 ? "+" : ""}${kpis?.revenueTrend ?? 0}%`}
          trend={(kpis?.revenueTrend ?? 0) >= 0 ? "up" : "down"}
          accent="gold"
          data={
            (kpis?.salesCurve ?? []).map((point) => ({
              value: point.total,
              date: point.month,
            }))
          }
        />
        <ProgressMetricCard
          title="Ventes Totales"
          total={`${(kpis?.totalSales ?? 0).toLocaleString("fr-FR")} transactions`}
          percent={`${(kpis?.salesTrend ?? 0) >= 0 ? "+" : ""}${kpis?.salesTrend ?? 0}%`}
          trend={(kpis?.salesTrend ?? 0) >= 0 ? "up" : "down"}
          accent="navy"
        />
        <ProgressMetricCard
          title="Consultations d'Ouvrages"
          total={`${(kpis?.totalConsultations ?? 0).toLocaleString("fr-FR")} lectures`}
          percent="+0.0%"
          trend="up"
          accent="emerald"
        />
        <ProgressMetricCard
          title="Utilisateurs Actifs"
          total={`${(kpis?.activeUsers ?? 0).toLocaleString("fr-FR")} inscrits`}
          percent={`${(kpis?.usersTrend ?? 0) >= 0 ? "+" : ""}${kpis?.usersTrend ?? 0}%`}
          trend={(kpis?.usersTrend ?? 0) >= 0 ? "up" : "down"}
          accent="gold"
        />
        <Link href="/admin/reminders" className="block">
          <ProgressMetricCard
            title="Dépôts & Maquettes en Attente"
            total={`${kpis?.pendingSubmissions ?? 0} dossiers`}
            percent="Action"
            trend="down"
            accent="rose"
          />
        </Link>
        <Link href="/admin/reminders" className="block">
          <ProgressMetricCard
            title="Factures & Impayés en Retard"
            total={`${kpis?.pendingUnpaidInvoices ?? 0} relances`}
            percent="Urgent"
            trend="down"
            accent="rose"
          />
        </Link>
      </div>

      {/* Division en 2 Colonnes au niveau des Graphiques & Actions Rapides */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLONNE GAUCHE (Graphiques) */}
        <div className="lg:col-span-9">
          {/* Graphiques Donut + Ventes */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Role Distribution Donut Chart */}
            <div className="lg:col-span-5 p-5 sm:p-6 rounded-2xl bg-background-secondary border border-border flex flex-col items-center justify-between shadow-xs min-h-[420px]">
              <div className="w-full flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Répartition par Rôle</h3>
                  <p className="text-xs text-foreground-muted">Comptes actifs sur la plateforme</p>
                </div>
                <Link
                  href="/admin/users"
                  className="text-xs font-medium text-gold hover:text-gold-dark flex items-center gap-1"
                >
                  Gérer <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="my-6">
                <DonutChart
                  data={donutSegments}
                  size={220}
                  strokeWidth={26}
                  centerContent={
                    <div>
                      <p className="text-2xl font-bold text-foreground font-mono">{totalUsersCount}</p>
                      <p className="text-[11px] text-foreground-muted font-medium">Comptes au total</p>
                    </div>
                  }
                />
              </div>

              {/* Legend */}
              <div className="w-full grid grid-cols-2 gap-2 pt-3 border-t border-border">
                {rolesDist.slice(0, 6).map((r) => (
                  <div key={r.role} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: r.colorToken }} />
                    <span className="text-foreground-muted truncate">{r.label}</span>
                    <span className="font-semibold text-foreground font-mono ml-auto">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue Progress Chart */}
            <div className="lg:col-span-7">
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
                onReportClick={() => (window.location.href = "/admin/reports")}
              />
            </div>
          </div>
        </div>

        {/* COLONNE DROITE : BARRE VERTICALE D'ACTIONS RAPIDES (Au niveau de Répartition par Rôle) */}
        <div className="lg:col-span-3 space-y-4 sticky top-6">
          <div className="p-5 rounded-2xl bg-background-secondary border border-border space-y-4 shadow-xs">
            <div className="pb-3 border-b border-border">
              <h2 className="text-base font-bold font-serif text-navy">Actions Rapides</h2>
              <p className="text-[11px] text-foreground-muted mt-0.5">Accès direct aux modules d'administration</p>
            </div>

            <div className="flex flex-col gap-2.5">
              {[
                { label: "Gérer les Utilisateurs", icon: Users, href: "/admin/users", desc: "9 rôles d'accès système" },
                { label: "Catalogue & Tarifs", icon: BookOpen, href: "/admin/catalog", desc: "Prix & Protections DRM" },
                { label: "Ventes & Commandes", icon: ShoppingBag, href: "/admin/sales", desc: "Suivi B2C / B2B" },
                { label: "Gestion Redevances", icon: DollarSign, href: "/admin/royalties", desc: "Droits d'auteurs & éditeurs" },
                { label: "Relances & Impayés", icon: BellRing, href: "/admin/reminders", desc: "Alertes institutionnelles" },
                { label: "Reporting & Exports", icon: FileText, href: "/admin/reports", desc: "Rapports d'activité" },
                { label: "Journal de Traçabilité", icon: Activity, href: "/admin/logs", desc: "Logs de sécurité temps réel" },
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

      {/* Recent Sales Transactions Preview (Plein Écran Full Width tout en bas) */}
      <div className="space-y-4 w-full">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Dernières Ventes & Souscriptions</h2>
          <Link href="/admin/sales" className="text-xs font-medium text-gold hover:text-gold-dark flex items-center gap-1">
            Voir toutes les ventes <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <DataTable
          data={recentSales}
          columns={salesColumns}
          rowKey="id"
          loading={loading}
          emptyMessage="Aucune transaction récente à afficher."
        />
      </div>
    </div>
  );
}
