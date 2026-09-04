"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpCircle, AlertTriangle, Warehouse } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { BookCover3D } from "@/components/ui/book-cover-3d";
import { getEscalatedOutages, getStockAlerts, escalateToAdmin } from "@/lib/services/manager";
import { EscalateModal } from "@/components/features/manager/escalate-modal";
import type { EscalatedOutage, StockAlert } from "@/lib/types/manager";

export default function CoordinationPage() {
  const [outages, setOutages] = useState<EscalatedOutage[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [escalateTarget, setEscalateTarget] = useState<StockAlert | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [outageData, alertData] = await Promise.all([
      getEscalatedOutages(),
      getStockAlerts(),
    ]);
    setOutages(outageData);
    setAlerts(alertData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const nonEscalatedAlerts = alerts.filter((a) => a.escalation_status === "not_escalated");

  const outageColumns: DataTableColumn<EscalatedOutage>[] = [
    {
      key: "book_title",
      header: "Ouvrage",
      cell: (row) => {
        const coverUrl =
          row.cover_url ||
          (row.book_id ? `/api/bff/catalog/books/${row.book_id}/cover/` : undefined);
        return (
          <Link
            href={`/manager/stock/${row.book_id}`}
            className="flex items-center gap-3 group py-1"
          >
            <BookCover3D
              title={row.book_title}
              authors={row.authors}
              discipline={row.discipline}
              coverUrl={coverUrl}
              size="xs"
            />
            <div className="min-w-0">
              <p className="font-semibold text-xs text-navy group-hover:text-gold transition-colors truncate max-w-[200px]">
                {row.book_title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {row.isbn && row.isbn !== "—" && (
                  <span className="text-[10px] text-foreground-muted font-mono">
                    {row.isbn}
                  </span>
                )}
                {row.discipline && (
                  <span className="text-[9px] font-semibold text-navy bg-navy-light px-1.5 py-0.2 rounded">
                    {row.discipline}
                  </span>
                )}
              </div>
            </div>
          </Link>
        );
      },
    },
    {
      key: "warehouse",
      header: "Entrepôt",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-xs text-foreground flex items-center gap-1">
          <Warehouse className="w-3.5 h-3.5 text-gold shrink-0" />
          {row.warehouse_nom || row.warehouse}
        </span>
      ),
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
            {nonEscalatedAlerts.map((alert) => {
              const coverUrl =
                alert.cover_url ||
                (alert.book_id ? `/api/bff/catalog/books/${alert.book_id}/cover/` : undefined);
              return (
                <div
                  key={alert.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-background border border-border hover:border-gold/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <BookCover3D
                      title={alert.book_title}
                      authors={alert.authors}
                      discipline={alert.discipline}
                      coverUrl={coverUrl}
                      size="xs"
                      interactive={false}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <StatusBadge status={alert.alert_type} />
                        {alert.warehouse && (
                          <span className="text-[10px] text-foreground-muted flex items-center gap-1 font-medium">
                            <Warehouse className="w-3 h-3 text-gold shrink-0" />
                            {alert.warehouse_nom || alert.warehouse}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-xs text-navy truncate max-w-md">{alert.book_title}</p>
                      <p className="text-[10px] text-foreground-muted mt-0.5">
                        <span className="font-mono font-bold text-error">{alert.quantity} ex. restant{alert.quantity > 1 ? "s" : ""}</span> • Seuil d&apos;alerte : {alert.alert_threshold} ex.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEscalateTarget(alert)}
                    className="px-3.5 py-2 rounded-xl bg-error text-white text-xs font-bold hover:bg-error/90 transition-colors flex items-center gap-1.5 whitespace-nowrap min-h-[38px] shrink-0 self-end sm:self-auto shadow-xs"
                  >
                    <ArrowUpCircle className="w-4 h-4" />
                    Signaler à l&apos;Admin
                  </button>
                </div>
              );
            })}
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
          mobileCard={(row) => {
            const coverUrl =
              row.cover_url ||
              (row.book_id ? `/api/bff/catalog/books/${row.book_id}/cover/` : undefined);
            return (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <BookCover3D
                    title={row.book_title}
                    authors={row.authors}
                    discipline={row.discipline}
                    coverUrl={coverUrl}
                    size="xs"
                    interactive={false}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <StatusBadge status={row.admin_status} />
                    </div>
                    <h4 className="font-serif font-bold text-navy text-sm leading-snug line-clamp-2">
                      {row.book_title}
                    </h4>
                    {row.authors && row.authors.length > 0 && (
                      <p className="text-xs text-foreground-muted mt-0.5 line-clamp-1">
                        {row.authors.join(", ")}
                      </p>
                    )}
                    <p className="text-[10px] text-foreground-muted font-mono mt-0.5">
                      Signalée le {new Date(row.reported_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
                  <span className="text-foreground-muted flex items-center gap-1">
                    <Warehouse className="w-3 h-3 text-gold shrink-0" />
                    {row.warehouse_nom || row.warehouse}
                  </span>
                  <span className="text-[11px] text-foreground-muted">
                    Par {row.reported_by}
                  </span>
                </div>
                {row.impact_description && (
                  <p className="text-[11px] text-foreground-muted italic bg-background-secondary p-2 rounded-lg border border-border">
                    Impact : {row.impact_description}
                  </p>
                )}
              </div>
            );
          }}
        />
      </div>

      {/* Modale d'escalade */}
      {escalateTarget && (
        <EscalateModal
          alert={escalateTarget}
          isOpen={!!escalateTarget}
          onClose={() => setEscalateTarget(null)}
          onConfirm={async (desc) => {
            await escalateToAdmin(escalateTarget.id, desc);
            await loadData();
            setEscalateTarget(null);
          }}
        />
      )}
    </div>
  );
}
