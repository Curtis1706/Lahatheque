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
  computeBouquetDistribution,
  BouquetDistributionResult,
} from "@/lib/services/bouquet-distribution";
import { BouquetPieDistribution } from "@/components/features/bouquets/bouquet-pie-distribution";
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
  ChevronRight,
  FileCheck2,
  Building2,
} from "lucide-react";
import Link from "next/link";

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

// Palette officielle et contrastée par rôle métier
const ROLE_CONFIG: Record<string, { color: string; label: string; desc: string }> = {
  student: { color: "#2563EB", label: "Étudiants & Lecteurs", desc: "Consultation & Achats" },
  teacher: { color: "#059669", label: "Enseignants & Chercheurs", desc: "Recommandations" },
  author: { color: "#D97706", label: "Auteurs Partenaires", desc: "Droits & Manuscrits" },
  publisher: { color: "#7C3AED", label: "Éditeurs Tiers", desc: "Publications & Catalogues" },
  university: { color: "#0D9488", label: "Universités & Inst.", desc: "Bouquets & Licences" },
  wholesaler: { color: "#B08D42", label: "Grossistes & Librairies", desc: "Commandes physiques" },
  layout_artist: { color: "#EC4899", label: "Maquettistes", desc: "Dépôt & Structuration" },
  chief_layout: { color: "#BE185D", label: "Chef Maquettiste", desc: "Validation & BAT" },
  legal_reviewer: { color: "#6366F1", label: "Juristes & Relecteurs", desc: "Conformité légale" },
  manager: { color: "#0284C7", label: "Managers & Équipe", desc: "Opérations & Logistique" },
  admin: { color: "#1B2A4E", label: "Administrateurs", desc: "Supervision générale" },
  super_admin: { color: "#0F1A33", label: "Super Admins", desc: "Accès total système" },
};

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

  const totalUsersCount = rolesDist.reduce((acc, r) => acc + r.count, 0);

  // Modèle de calcul unique et officiel de référence (CDC Section 11 & 12)
  const bouquetDist: BouquetDistributionResult = computeBouquetDistribution({
    bouquet_id: "bouquet-reference-cdc",
    bouquet_title: "Bouquets Documentaires Multi-Universités",
    total_ca: 10000,
    currency: "€",
  });

  const donutSegments: DonutChartSegment[] = rolesDist
    .filter((r) => r.count > 0)
    .map((r) => {
      const cfg = ROLE_CONFIG[r.role] || { color: "#6B7280", label: r.label };
      return {
        value: r.count,
        label: cfg.label || r.label,
        color: cfg.color,
        percentage: r.percentage,
      };
    });

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

      {/* 6 KPI Cards Grid Plein Écran avec Barres Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ProgressMetricCard
          title="Chiffre d'Affaires Cumulé"
          total={`${(kpis?.totalRevenue ?? 0).toLocaleString("fr-FR")} FCFA`}
          percent={`${(kpis?.revenueTrend ?? 0) >= 0 ? "+" : ""}${kpis?.revenueTrend ?? 0}%`}
          trend={(kpis?.revenueTrend ?? 0) >= 0 ? "up" : "down"}
          accent="gold"
          delta="Activité"
          deltaLabel="ce mois"
          data={
            kpis?.salesCurve && kpis.salesCurve.length >= 2
              ? kpis.salesCurve.map((point) => ({
                  value: point.total,
                  date: point.month,
                }))
              : getRollingTimeline(kpis?.totalRevenue ?? 0)
          }
        />
        <ProgressMetricCard
          title="Ventes Totales"
          total={`${(kpis?.totalSales ?? 0).toLocaleString("fr-FR")} transactions`}
          percent={`${(kpis?.salesTrend ?? 0) >= 0 ? "+" : ""}${kpis?.salesTrend ?? 0}%`}
          trend={(kpis?.salesTrend ?? 0) >= 0 ? "up" : "down"}
          accent="navy"
          delta="Payées"
          deltaLabel="en ligne / caisse"
          data={getRollingTimeline(kpis?.totalSales ?? 0)}
        />
        <ProgressMetricCard
          title="Consultations d'Ouvrages"
          total={`${(kpis?.totalConsultations ?? 0).toLocaleString("fr-FR")} lectures`}
          percent="+12.5%"
          trend="up"
          accent="emerald"
          delta="Lectures"
          deltaLabel="ce mois"
          data={getRollingTimeline(kpis?.totalConsultations ?? 0)}
        />
        <ProgressMetricCard
          title="Utilisateurs Actifs"
          total={`${(kpis?.activeUsers ?? 0).toLocaleString("fr-FR")} inscrits`}
          percent={`${(kpis?.usersTrend ?? 0) >= 0 ? "+" : ""}${kpis?.usersTrend ?? 0}%`}
          trend={(kpis?.usersTrend ?? 0) >= 0 ? "up" : "down"}
          accent="gold"
          delta="Comptes"
          deltaLabel="actifs"
          data={getRollingTimeline(kpis?.activeUsers ?? 0)}
        />
        <Link href="/admin/publisher-deposits" className="block">
          <ProgressMetricCard
            title="Dépôts Éditeurs & Maquettes"
            total={`${kpis?.pendingSubmissions ?? 0} dossiers`}
            percent="À traiter"
            trend="down"
            accent="rose"
            delta="À valider"
            deltaLabel="éditorial & droits"
            data={getRollingTimeline(kpis?.pendingSubmissions ?? 0)}
          />
        </Link>
        <Link href="/admin/reminders" className="block">
          <ProgressMetricCard
            title="Factures & Impayés en Retard"
            total={`${kpis?.pendingUnpaidInvoices ?? 0} relances`}
            percent="Urgent"
            trend="down"
            accent="rose"
            delta="Impayés"
            deltaLabel="à relancer"
            data={getRollingTimeline(kpis?.pendingUnpaidInvoices ?? 0)}
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
            <div className="lg:col-span-5 p-5 sm:p-6 rounded-2xl bg-background-secondary border border-border flex flex-col justify-between shadow-xs min-h-[440px]">
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

              <div className="my-4 flex items-center justify-center">
                <DonutChart
                  data={donutSegments}
                  size={200}
                  strokeWidth={24}
                  centerContent={
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground font-mono">{totalUsersCount}</p>
                      <p className="text-[11px] text-foreground-muted font-medium">Comptes au total</p>
                    </div>
                  }
                />
              </div>

              {/* Complete & Colored Role Legend */}
              <div className="w-full space-y-1.5 pt-3 border-t border-border max-h-[160px] overflow-y-auto pr-1">
                {rolesDist.map((r) => {
                  const cfg = ROLE_CONFIG[r.role] || { color: "#6B7280", label: r.label, desc: "" };
                  return (
                    <div key={r.role} className="flex items-center justify-between gap-2 text-xs py-0.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: cfg.color }}
                        />
                        <span className="text-foreground font-medium truncate">{cfg.label}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 font-mono">
                        <span className="font-bold text-foreground">{r.count}</span>
                        <span className="text-[10px] text-foreground-muted">({r.percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
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
                { label: "Dépôts Éditeurs Tiers", icon: FileCheck2, href: "/admin/publisher-deposits", desc: "Validation éditoriale & droits" },
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

      {/* ─── BLOC UNIQUE CDC 11.1 & 11.2 : RÉPARTITION DES REDEVANCES — BOUQUETS DOCUMENTAIRES ─── */}
      <div className="p-5 sm:p-7 rounded-3xl bg-background-secondary border border-border space-y-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-border">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 text-navy text-xs font-bold">
              <Building2 className="w-3.5 h-3.5 text-gold" />
              Section 11 &bull; Cahier des Charges Officiel
            </div>
            <h2 className="text-lg sm:text-2xl font-bold font-serif text-navy">
              Répartition des Redevances &ndash; Bouquets Documentaires
            </h2>
            <p className="text-xs text-foreground-muted max-w-3xl leading-relaxed">
              Les revenus issus des bouquets documentaires sont r&eacute;partis selon l&apos;utilisation r&eacute;elle des contenus, en tenant compte des consultations, pages lues, t&eacute;l&eacute;chargements, temps de lecture et &eacute;coutes audio (Taux conventionn&eacute; : <span className="font-bold text-navy">15 %</span>).
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/admin/catalog/bouquets"
              className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 shadow-xs min-h-[40px]"
            >
              <Layers className="w-4 h-4 text-gold" />
              <span>Gérer les Bouquets</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Mini Grille de 4 KPIs Spécifiques au Bouquet Sélectionné */}
        {bouquetDist && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-background border border-border space-y-1">
              <span className="text-[11px] font-medium text-foreground-muted">Assiette Financière Bouquet</span>
              <p className="text-base sm:text-lg font-bold font-mono text-navy">
                {bouquetDist.total_ca.toLocaleString("fr-FR")} {bouquetDist.currency}
              </p>
              <span className="text-[10px] text-foreground-muted">Chiffre d&apos;affaires annuel</span>
            </div>

            <div className="p-4 rounded-2xl bg-background border border-border space-y-1">
              <span className="text-[11px] font-medium text-foreground-muted">Lectures Multi-Campus</span>
              <p className="text-base sm:text-lg font-bold font-mono text-emerald-600">
                {bouquetDist.total_consultations.toLocaleString("fr-FR")} lectures
              </p>
              <span className="text-[10px] text-foreground-muted">Usage réel certifié</span>
            </div>

            <div className="p-4 rounded-2xl bg-background border border-border space-y-1">
              <span className="text-[11px] font-medium text-foreground-muted">Enveloppe Redevances (15%)</span>
              <p className="text-base sm:text-lg font-bold font-mono text-gold">
                {bouquetDist.total_royalties.toLocaleString("fr-FR")} {bouquetDist.currency}
              </p>
              <span className="text-[10px] text-foreground-muted">À verser aux universités</span>
            </div>

            <div className="p-4 rounded-2xl bg-background border border-border space-y-1">
              <span className="text-[11px] font-medium text-foreground-muted">Établissements Actifs</span>
              <p className="text-base sm:text-lg font-bold font-mono text-navy">
                {bouquetDist.items.length} Campus
              </p>
              <span className="text-[10px] text-foreground-muted">UAC, Parakou, UNA</span>
            </div>
          </div>
        )}

        {/* Intégration du composant visuel BouquetPieDistribution */}
        {bouquetDist && (
          <div className="w-full">
            <BouquetPieDistribution
              distribution={bouquetDist}
              showTitle={false}
            />
          </div>
        )}
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
