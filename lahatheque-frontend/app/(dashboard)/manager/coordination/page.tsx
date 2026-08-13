"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpCircle, AlertTriangle } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { getEscalatedOutages, getStockAlerts } from "@/lib/services/manager";
import { EscalateModal } from "@/components/features/manager/escalate-modal";
import type { EscalatedOutage, StockAlert } from "@/lib/types/manager";

export default function CoordinationPage() {
  const [outages, setOutages] = useState<EscalatedOutage[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [escalateTarget, setEscalateTarget] = useState<StockAlert | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [outageData, alertData] = await Promise.all([
        getEscalatedOutages(),
        getStockAlerts(),
      ]);
      setOutages(outageData);
      setAlerts(alertData);
      setLoading(false);
    }
    loadData();
  }, []);

  const nonEscalatedAlerts = alerts.filter((a) => a.escalation_status === "not_escalated");

  const outageColumns: DataTableColumn<EscalatedOutage>[] = [
    {
      key: "book_title",
      header: "Ouvrage",
      cell: (row) => (
        <div>
          <p className="font-semibold text-xs text-navy">{row.book_title}</p>
          <p className="text-[10px] text-foreground-muted font-mono">{row.isbn}</p>
        </div>
      ),
    },
    {
      key: "warehouse",
      header: "Entrepôt",
      hideOnMobile: true,
      cell: (row) => <span className="text-xs text-foreground-muted">{row.warehouse}</span>,
    },
    {
      key: "reported_at",
      header: "Signalée le",
      cell: (row) => (
        <span className="text-xs text-foreground-muted font-mono">
          {new Date(row.reported_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
        </span>
      ),
    },
    {
      key: "admin_status",
      header: "Statut Admin",
      cell: (row) => <StatusBadge status={row.admin_status} />,
    },
    {
      key: "impact_description",
      header: "Impact",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-xs text-foreground-muted truncate max-w-[200px] block">
          {row.impact_description}
        </span>
      ),
    },
    {
      key: "reported_by",
      header: "Par",
      hideOnMobile: true,
      cell: (row) => <span className="text-xs text-foreground-muted">{row.reported_by}</span>,
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/manager" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Coordination Admin</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6">
        <Link href="/manager" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          Vue d&apos;ensemble
        </Link>
        <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
          <ArrowUpCircle className="w-4 h-4 text-gold" />
          Coordination
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
          Ruptures Remontées à l&apos;Admin
        </h1>
        <p className="text-xs text-foreground-muted mt-1">
          Ruptures de stock impactant la vitrine publique. Le gestionnaire signale, l&apos;administrateur exécute.
        </p>
      </div>

      {/* Ruptures non signalées */}
      {nonEscalatedAlerts.length > 0 && (
        <div className="bg-error/5 border border-error/20 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-error" />
            <h3 className="text-sm font-bold text-navy">
              {nonEscalatedAlerts.length} alerte{nonEscalatedAlerts.length > 1 ? "s" : ""} non signalée{nonEscalatedAlerts.length > 1 ? "s" : ""}
            </h3>
          </div>
          <div className="space-y-2">
            {nonEscalatedAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-background border border-border"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <StatusBadge status={alert.alert_type} />
                  <div className="min-w-0">
                    <p className="font-semibold text-xs text-foreground truncate">{alert.book_title}</p>
                    <p className="text-[10px] text-foreground-muted">
                      {alert.quantity} ex. restant{alert.quantity > 1 ? "s" : ""} • Seuil : {alert.alert_threshold}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEscalateTarget(alert)}
                  className="px-3 py-1.5 rounded-xl bg-error text-white text-[10px] font-bold hover:opacity-90 transition-colors flex items-center gap-1.5 whitespace-nowrap min-h-[36px] shrink-0 self-end sm:self-auto"
                >
                  <ArrowUpCircle className="w-3.5 h-3.5" />
                  Signaler à l&apos;Admin
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ruptures déjà signalées */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Ruptures signalées</h3>
        <DataTable
          data={outages}
          columns={outageColumns}
          rowKey="id"
          loading={loading}
          emptyMessage="Aucune rupture signalée à l'administrateur pour le moment."
          pageSize={10}
        />
      </div>

      {/* Modale d'escalade */}
      {escalateTarget && (
        <EscalateModal
          alert={escalateTarget}
          isOpen={!!escalateTarget}
          onClose={() => setEscalateTarget(null)}
          onConfirm={async (desc) => {
            // Import dynamic pour éviter circular
            const { escalateToAdmin } = await import("@/lib/services/manager");
            const outage = await escalateToAdmin(escalateTarget.id, desc);
            setOutages((prev) => [outage, ...prev]);
            setAlerts((prev) =>
              prev.map((a) =>
                a.id === escalateTarget.id ? { ...a, escalation_status: "escalated" as const } : a
              )
            );
            setEscalateTarget(null);
          }}
        />
      )}
    </div>
  );
}
