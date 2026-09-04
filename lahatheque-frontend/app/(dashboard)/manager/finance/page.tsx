"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Wallet,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CreditCard,
  Building2,
  Coins,
  RefreshCw,
  ArrowLeft,
  Calendar,
  User,
  TrendingUp,
} from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getManagerFinanceReport,
  type ManagerFinanceReport,
  type CreditOrder,
} from "@/lib/services/manager";

const PAYMENT_METHOD_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; colorClass: string; bgClass: string }
> = {
  mobile_money: {
    label: "Mobile Money (MTN / Moov)",
    icon: Coins,
    colorClass: "text-gold",
    bgClass: "bg-gold/10",
  },
  carte: {
    label: "Carte Bancaire",
    icon: CreditCard,
    colorClass: "text-navy",
    bgClass: "bg-navy/10",
  },
  virement: {
    label: "Virement Bancaire",
    icon: Building2,
    colorClass: "text-info",
    bgClass: "bg-info/10",
  },
  especes: {
    label: "Espèces à la livraison",
    icon: Wallet,
    colorClass: "text-success",
    bgClass: "bg-success/10",
  },
};

export default function ManagerFinancePage() {
  const [report, setReport] = useState<ManagerFinanceReport | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getManagerFinanceReport();
      setReport(data);
    } catch {
      // Keep state clean on network failure
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalPaid = report?.total_revenue_paid || 0;
  const overdueCount = report?.credit_overdue_count || 0;
  const paymentMethods = report?.revenue_by_payment_method || [];

  const columns: DataTableColumn<CreditOrder>[] = [
    {
      key: "id",
      header: "Référence",
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-navy bg-navy/5 px-2.5 py-1 rounded-md border border-border inline-block">
          #{row.id.slice(0, 8)}
        </span>
      ),
    },
    {
      key: "author_name",
      header: "Partenaire / Bénéficiaire",
      cell: (row) => {
        const isWholesale = row.author_name.startsWith("[Grossiste]");
        const cleanName = isWholesale
          ? row.author_name.replace("[Grossiste]", "").trim()
          : row.author_name;

        return (
          <div className="flex items-center gap-2.5 py-0.5">
            <div className="w-7 h-7 rounded-lg bg-navy/5 flex items-center justify-center shrink-0 border border-border">
              {isWholesale ? (
                <Building2 className="w-3.5 h-3.5 text-navy" />
              ) : (
                <User className="w-3.5 h-3.5 text-gold" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-xs text-navy truncate max-w-[240px]">
                  {cleanName}
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider bg-background-secondary text-foreground-muted border border-border">
                  {isWholesale ? "Grossiste" : "Auteur"}
                </span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "amount",
      header: "Montant Dû",
      className: "text-right",
      cell: (row) => (
        <span className="font-mono font-bold text-xs text-navy whitespace-nowrap">
          {row.amount.toLocaleString("fr-FR")}{" "}
          <span className="text-[10px] font-normal text-foreground-muted">FCFA</span>
        </span>
      ),
    },
    {
      key: "due_date",
      header: "Échéance",
      className: "text-center",
      cell: (row) => {
        if (!row.due_date) {
          return <span className="text-xs text-foreground-muted font-mono">—</span>;
        }
        const isOverdue = row.is_overdue && row.statut_paiement === "pending";
        return (
          <div className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
            <Calendar className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
            <span
              className={`text-xs font-mono ${
                isOverdue ? "text-error font-bold" : "text-foreground"
              }`}
            >
              {new Date(row.due_date).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </span>
            {isOverdue && (
              <span className="text-[9px] font-bold text-error bg-error/10 border border-error/20 px-1.5 py-0.2 rounded">
                Retard
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "statut_paiement",
      header: "Paiement",
      className: "text-center",
      cell: (row) => (
        <div className="flex justify-center">
          <StatusBadge status={row.statut_paiement === "paid" ? "paid" : "pending"} />
        </div>
      ),
    },
    {
      key: "statut_commande",
      header: "Livraison",
      className: "text-center",
      cell: (row) => (
        <div className="flex justify-center">
          <StatusBadge status={row.statut_commande} />
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Émis le",
      hideOnMobile: true,
      className: "text-right",
      cell: (row) => (
        <span className="text-xs text-foreground-muted font-mono whitespace-nowrap">
          {new Date(row.created_at).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-8 max-w-7xl mx-auto">
      {/* Breadcrumb & Navigation */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-foreground-muted">
          <Link href="/manager" className="hover:text-navy transition-colors">
            Vue d&apos;ensemble
          </Link>
          <span>/</span>
          <span className="text-navy font-semibold">Supervision Financière</span>
        </div>

        <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/manager"
              className="inline-flex items-center gap-1.5 text-xs text-navy font-bold hover:underline mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Vue d&apos;ensemble
            </Link>
            <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
              <Coins className="w-4 h-4 text-gold" />
              Trésorerie & Règlements
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
              Rapports & Flux Financiers
            </h1>
            <p className="text-xs sm:text-sm text-foreground-muted mt-1">
              Supervision des encaissements réels, modes de paiement et achats à crédit des auteurs et partenaires.
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-background border border-border text-navy hover:border-gold/40 text-xs font-bold transition-all min-h-[42px] shrink-0 shadow-xs"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin text-gold" : "text-foreground-muted"}`}
            />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (4 métriques alignées) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Encaissé Réel */}
        <div className="p-5 rounded-2xl bg-background border border-border shadow-xs hover:border-gold/30 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
              Encaissé Réel
            </span>
            <div className="p-2 rounded-xl bg-success/10 text-success border border-success/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-navy">
              {totalPaid.toLocaleString("fr-FR")}
              <span className="text-xs font-normal text-foreground-muted font-sans ml-1">FCFA</span>
            </div>
            <p className="text-xs text-foreground-muted mt-1">Total des commandes payées</p>
          </div>
        </div>

        {/* Crédits en Cours */}
        <div className="p-5 rounded-2xl bg-background border border-border shadow-xs hover:border-gold/30 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
              Crédits en Cours
            </span>
            <div className="p-2 rounded-xl bg-gold/10 text-gold border border-gold/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-navy">
              {(report?.credit_outstanding_total || 0).toLocaleString("fr-FR")}
              <span className="text-xs font-normal text-foreground-muted font-sans ml-1">FCFA</span>
            </div>
            <p className="text-xs text-foreground-muted mt-1">Achats auteurs en attente de règlement</p>
          </div>
        </div>

        {/* Crédits Réglés */}
        <div className="p-5 rounded-2xl bg-background border border-border shadow-xs hover:border-gold/30 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
              Crédits Réglés
            </span>
            <div className="p-2 rounded-xl bg-info/10 text-info border border-info/20">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-navy">
              {(report?.credit_settled_total || 0).toLocaleString("fr-FR")}
              <span className="text-xs font-normal text-foreground-muted font-sans ml-1">FCFA</span>
            </div>
            <p className="text-xs text-foreground-muted mt-1">Anciens crédits apurés avec succès</p>
          </div>
        </div>

        {/* Crédits en Retard */}
        <div className="p-5 rounded-2xl bg-background border border-border shadow-xs hover:border-gold/30 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
              Crédits en Retard
            </span>
            <div
              className={`p-2 rounded-xl border ${
                overdueCount > 0
                  ? "bg-error/10 text-error border-error/20"
                  : "bg-background-secondary text-foreground-muted border-border"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div
              className={`font-serif text-2xl sm:text-3xl font-bold ${
                overdueCount > 0 ? "text-error" : "text-navy"
              }`}
            >
              {overdueCount}
              <span className="text-xs font-normal text-foreground-muted font-sans ml-1">
                dossier{overdueCount > 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-xs text-foreground-muted mt-1">Échéance de paiement dépassée</p>
          </div>
        </div>
      </div>

      {/* Répartition par Mode de Paiement */}
      <div className="p-5 sm:p-6 rounded-2xl bg-background border border-border shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
          <div>
            <h2 className="font-serif text-lg font-bold text-navy flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gold" />
              Répartition par Mode de Paiement
            </h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              Quote-part et volume des encaissements réels validés par canal financier.
            </p>
          </div>
          <div className="text-xs text-foreground-muted font-mono">
            Total validé : <strong className="text-navy">{totalPaid.toLocaleString("fr-FR")} FCFA</strong>
          </div>
        </div>

        {/* Barre de répartition visuelle */}
        {totalPaid > 0 && paymentMethods.length > 0 && (
          <div className="space-y-2">
            <div className="h-2.5 w-full bg-background-secondary rounded-full overflow-hidden flex border border-border">
              {paymentMethods.map((item) => {
                const pct = (item.total / totalPaid) * 100;
                const isMobileMoney = item.method === "mobile_money";
                return (
                  <div
                    key={item.method}
                    style={{ width: `${pct}%` }}
                    className={`h-full ${isMobileMoney ? "bg-gold" : "bg-navy"}`}
                    title={`${item.method}: ${pct.toFixed(1)}%`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Grille adaptative des modes de paiement */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {paymentMethods.map((item) => {
            const config = PAYMENT_METHOD_CONFIG[item.method] || {
              label: item.method,
              icon: CreditCard,
              colorClass: "text-navy",
              bgClass: "bg-navy/10",
            };
            const Icon = config.icon;
            const pct = totalPaid > 0 ? (item.total / totalPaid) * 100 : 0;

            return (
              <div
                key={item.method}
                className="p-4 rounded-xl bg-background-secondary border border-border flex items-center gap-3.5 hover:border-gold/30 transition-all"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${config.bgClass} ${config.colorClass} border border-border flex items-center justify-center shrink-0`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-semibold text-navy truncate">{config.label}</p>
                    <span className="text-[10px] font-mono font-bold text-navy bg-background px-1.5 py-0.2 rounded border border-border">
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                  <p className="font-serif font-bold text-navy text-base mt-0.5">
                    {item.total.toLocaleString("fr-FR")}{" "}
                    <span className="text-[10px] font-normal font-sans text-foreground-muted">FCFA</span>
                  </p>
                  <p className="text-[10px] text-foreground-muted mt-0.5">
                    {item.count} commande{item.count > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            );
          })}

          {paymentMethods.length === 0 && (
            <div className="col-span-full py-8 text-center text-xs text-foreground-muted">
              Aucun encaissement enregistré pour le moment.
            </div>
          )}
        </div>
      </div>

      {/* Registre des Commandes à Crédit Auteurs & Grossistes */}
      <div className="space-y-3">
        <div>
          <h2 className="font-serif text-lg font-bold text-navy">
            Registre des Commandes à Crédit Auteurs & Grossistes
          </h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            Suivi des sorties de stock et facilités de paiement accordées sur échéancier.
          </p>
        </div>

        <DataTable<CreditOrder>
          data={report?.credit_orders || []}
          columns={columns}
          rowKey="id"
          searchable={true}
          searchPlaceholder="Rechercher par partenaire, montant, référence..."
          filterKey="statut_paiement"
          filterPlaceholder="Tous les paiements"
          filterOptions={[
            { value: "pending", label: "En attente" },
            { value: "paid", label: "Réglé" },
          ]}
          pageSize={10}
          pageSizeOptions={[10, 20, 50]}
          showPagination={true}
          loading={loading}
          skeletonRows={4}
          emptyMessage="Aucune commande à crédit enregistrée pour le moment."
          mobileCard={(row) => {
            const isWholesale = row.author_name.startsWith("[Grossiste]");
            const cleanName = isWholesale
              ? row.author_name.replace("[Grossiste]", "").trim()
              : row.author_name;
            const isOverdue = row.is_overdue && row.statut_paiement === "pending";

            return (
              <div className="space-y-3 p-1">
                {/* Header card */}
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-navy bg-navy/5 px-2 py-0.5 rounded border border-border">
                    #{row.id.slice(0, 8)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isOverdue && (
                      <span className="text-[10px] font-bold text-error bg-error/10 border border-error/20 px-1.5 py-0.5 rounded">
                        Retard
                      </span>
                    )}
                    <StatusBadge status={row.statut_paiement === "paid" ? "paid" : "pending"} />
                  </div>
                </div>

                {/* Info Bénéficiaire */}
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-6 h-6 rounded bg-navy/5 flex items-center justify-center shrink-0 border border-border">
                    {isWholesale ? (
                      <Building2 className="w-3 h-3 text-navy" />
                    ) : (
                      <User className="w-3 h-3 text-gold" />
                    )}
                  </div>
                  <span className="font-semibold text-navy truncate">{cleanName}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded uppercase bg-background-secondary text-foreground-muted border border-border ml-auto">
                    {isWholesale ? "Grossiste" : "Auteur"}
                  </span>
                </div>

                {/* Métriques */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-foreground-muted block">
                      Montant
                    </span>
                    <span className="font-mono font-bold text-navy">
                      {row.amount.toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-foreground-muted block">
                      Échéance
                    </span>
                    <span
                      className={`font-mono text-xs ${
                        isOverdue ? "text-error font-bold" : "text-foreground"
                      }`}
                    >
                      {row.due_date
                        ? new Date(row.due_date).toLocaleDateString("fr-FR")
                        : "Non définie"}
                    </span>
                  </div>
                </div>

                {/* Footer card */}
                <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[11px] text-foreground-muted">
                  <span>Livraison :</span>
                  <StatusBadge status={row.statut_commande} />
                </div>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}
