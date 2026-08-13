"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, ArrowUpCircle, Package } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { getStockAlerts, escalateAlert } from "@/lib/services/manager";
import { EscalateModal } from "@/components/features/manager/escalate-modal";
import type { StockAlert } from "@/lib/types/manager";

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}j`;
}

export default function StockAlertsPage() {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [escalateTarget, setEscalateTarget] = useState<StockAlert | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getStockAlerts();
      setAlerts(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleEscalate = async (impactDescription: string) => {
    if (!escalateTarget) return;
    await escalateAlert(escalateTarget.id);
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === escalateTarget.id ? { ...a, escalation_status: "escalated" as const } : a
      )
    );
    setEscalateTarget(null);
  };

  const columns: DataTableColumn<StockAlert>[] = [
    {
      key: "book_title",
      header: "Ouvrage",
      cell: (row) => (
        <Link href={`/manager/stock/${row.book_id}`} className="hover:text-navy transition-colors">
          <p className="font-semibold text-xs text-navy truncate max-w-[180px]">{row.book_title}</p>
          <p className="text-[10px] text-foreground-muted font-mono">{row.isbn}</p>
        </Link>
      ),
    },
    {
      key: "alert_type",
      header: "Type",
      cell: (row) => <StatusBadge status={row.alert_type} />,
    },
    {
      key: "quantity",
      header: "Quantité",
      cell: (row) => (
        <span className={`font-mono font-bold text-xs ${row.quantity === 0 ? "text-error" : "text-gold"}`}>
          {row.quantity}
        </span>
      ),
    },
    {
      key: "alert_threshold",
      header: "Seuil",
      hideOnMobile: true,
      cell: (row) => <span className="font-mono text-xs text-foreground-muted">{row.alert_threshold}</span>,
    },
    {
      key: "triggered_at",
      header: "Depuis",
      cell: (row) => (
        <span className="text-xs text-foreground-muted font-mono">
          {timeAgo(row.triggered_at)}
        </span>
      ),
    },
    {
      key: "warehouse",
      header: "Entrepôt",
      hideOnMobile: true,
      cell: (row) => <span className="text-xs text-foreground-muted">{row.warehouse}</span>,
    },
    {
      key: "escalation_status",
      header: "Escalade",
      cell: (row) => <StatusBadge status={row.escalation_status} />,
    },
    {
      key: "actions" as keyof StockAlert,
      header: "",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Link
            href="/manager/stock/movements"
            className="px-2.5 py-1.5 rounded-lg bg-success/10 text-success text-[10px] font-bold hover:bg-success/20 transition-colors whitespace-nowrap min-h-[32px] flex items-center gap-1"
            title="Enregistrer un réassort"
          >
            <Package className="w-3 h-3" />
            Réassort
          </Link>
          {row.escalation_status === "not_escalated" && (
            <button
              onClick={() => setEscalateTarget(row)}
              className="px-2.5 py-1.5 rounded-lg bg-error/10 text-error text-[10px] font-bold hover:bg-error/20 transition-colors whitespace-nowrap min-h-[32px] flex items-center gap-1"
              title="Signaler à l'administrateur"
            >
              <ArrowUpCircle className="w-3 h-3" />
              Signaler
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/manager" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <Link href="/manager/stock" className="hover:text-navy">Stock</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Alertes</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6">
        <Link href="/manager/stock" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour au stock
        </Link>
        <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
          <AlertTriangle className="w-4 h-4 text-gold" />
          Alertes Automatiques
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
          Alertes de Rupture &amp; Seuil Bas
        </h1>
        <p className="text-xs text-foreground-muted mt-1">
          Ouvrages en rupture ou en dessous du seuil d&apos;alerte configuré. Agissez rapidement pour éviter l&apos;indisponibilité en vitrine.
        </p>
      </div>

      {/* Table */}
      <DataTable
        data={alerts}
        columns={columns}
        rowKey="id"
        loading={loading}
        emptyMessage="Aucune alerte de stock active — tous les ouvrages sont au-dessus de leur seuil."
        pageSize={10}
      />

      {/* Modale d'escalade */}
      {escalateTarget && (
        <EscalateModal
          alert={escalateTarget}
          isOpen={!!escalateTarget}
          onClose={() => setEscalateTarget(null)}
          onConfirm={handleEscalate}
        />
      )}
    </div>
  );
}
