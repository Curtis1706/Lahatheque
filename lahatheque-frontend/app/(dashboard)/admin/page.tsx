"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { KpiCard } from "@/components/ui/kpi-card";
import { DonutChart, DonutChartSegment } from "@/components/ui/donut-chart";
import { TotalSalesChart } from "@/components/ui/total-sales-chart";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getAdminKpis,
  getRoleDistribution,
  getAdminSales,
  getAdminReminders,
} from "@/lib/services/admin";
import {
  AdminKpi,
  RoleDistribution,
  AdminSale,
  AdminReminder,
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
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AdminOverviewDashboard() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<AdminKpi | null>(null);
  const [rolesDist, setRolesDist] = useState<RoleDistribution[]>([]);
  const [recentSales, setRecentSales] = useState<AdminSale[]>([]);
  const [reminders, setReminders] = useState<AdminReminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [kpiData, rolesData, salesData, remindersData] = await Promise.all([
          getAdminKpis(),
          getRoleDistribution(),
          getAdminSales(),
          getAdminReminders(),
        ]);
        setKpis(kpiData);
        setRolesDist(rolesData);
        setRecentSales(salesData);
        setReminders(remindersData);
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
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-navy-dark via-navy to-navy-hover text-white shadow-md">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Espace Super Administration
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif tracking-tight">
            Bonjour, {user?.first_name || "Administrateur"} 👋
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

      {/* 6 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <KpiCard
          label="Chiffre d'Affaires Cumulé"
          value={kpis?.totalRevenue || 0}
          formatValue={(v) => `${v.toLocaleString("fr-FR")} FCFA`}
          icon={DollarSign}
          trend={kpis?.revenueTrend}
          trendPeriod="ce mois"
        />
        <KpiCard
          label="Ventes Totales"
          value={kpis?.totalSales || 0}
          formatValue={(v) => `${v.toLocaleString("fr-FR")} transactions`}
          icon={ShoppingBag}
          trend={kpis?.salesTrend}
          trendPeriod="ce mois"
        />
        <KpiCard
          label="Consultations d'Ouvrages"
          value={kpis?.totalConsultations || 0}
          formatValue={(v) => `${v.toLocaleString("fr-FR")} lectures`}
          icon={BookOpen}
          trend={10.4}
        />
        <KpiCard
          label="Utilisateurs Actifs"
          value={kpis?.activeUsers || 0}
          formatValue={(v) => `${v.toLocaleString("fr-FR")} inscrits`}
          icon={Users}
          trend={kpis?.usersTrend}
        />
        <Link href="/admin/reminders" className="block">
          <KpiCard
            label="Dépôts & Maquettes en Attente"
            value={kpis?.pendingSubmissions || 0}
            formatValue={(v) => `${v} dossiers en attente`}
            icon={BellRing}
            className="hover:border-gold transition-colors cursor-pointer"
          />
        </Link>
        <Link href="/admin/reminders" className="block">
          <KpiCard
            label="Factures & Impayés en Retard"
            value={kpis?.pendingUnpaidInvoices || 0}
            formatValue={(v) => `${v} relances urgentes`}
            icon={ShieldAlert}
            className="hover:border-error transition-colors cursor-pointer"
          />
        </Link>
      </div>

      {/* Main Visual Section: Donut Chart + Total Sales Chart */}
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
          <TotalSalesChart onReportClick={() => (window.location.href = "/admin/reports")} />
        </div>
      </div>

      {/* Quick Navigation Raccourcis Modules Admin */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-foreground">Accès Rapide aux Modules Admin</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {[
            { label: "Utilisateurs", icon: Users, href: "/admin/users", desc: "9 rôles d'accès" },
            { label: "Catalogue", icon: BookOpen, href: "/admin/catalog", desc: "Ouvrages & Prix" },
            { label: "Ventes B2C/B2B", icon: ShoppingBag, href: "/admin/sales", desc: "Commandes" },
            { label: "Redevances", icon: DollarSign, href: "/admin/royalties", desc: "Calculs & Payouts" },
            { label: "Relances", icon: BellRing, href: "/admin/reminders", desc: "Alertes impayés" },
            { label: "Traçabilité", icon: Activity, href: "/admin/logs", desc: "Journal d'accès" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="p-4 rounded-xl bg-background-secondary border border-border hover:border-gold hover:shadow-md transition-all flex flex-col items-start gap-2 group"
            >
              <div className="p-2 rounded-lg bg-navy/10 text-navy group-hover:bg-navy group-hover:text-white transition-colors">
                <item.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-xs text-foreground group-hover:text-gold transition-colors">
                  {item.label}
                </p>
                <p className="text-[10px] text-foreground-muted">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Sales Transactions Preview */}
      <div className="space-y-4">
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
