"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  ArrowUpCircle,
  Package,
  Filter,
  CheckCircle2,
  Warehouse,
  Flame,
} from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { BookCover3D } from "@/components/ui/book-cover-3d";
import { getStockAlerts, escalateAlert, createRestock } from "@/lib/services/manager";
import { EscalateModal } from "@/components/features/manager/escalate-modal";
import type { StockAlert } from "@/lib/types/manager";

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "À l'instant";
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}j`;
}

export default function StockAlertsPage() {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [escalateTarget, setEscalateTarget] = useState<StockAlert | null>(null);
  const [filterType, setFilterType] = useState<"all" | "out_of_stock" | "low_stock">("all");

  // Réassort rapide modal
  const [restockTarget, setRestockTarget] = useState<StockAlert | null>(null);
  const [restockQty, setRestockQty] = useState(20);
  const [restockRef, setRestockRef] = useState("");
  const [restockSaving, setRestockSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const data = await getStockAlerts();
    setAlerts(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEscalate = async (impactDescription: string) => {
    if (!escalateTarget) return;
    await escalateAlert(escalateTarget.id, impactDescription);
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === escalateTarget.id ? { ...a, escalation_status: "escalated" as const } : a
      )
    );
    setEscalateTarget(null);
  };

  const handleQuickRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockTarget || restockQty <= 0) return;
    setRestockSaving(true);
    try {
      await createRestock({
        stock_id: restockTarget.id,
        quantite: restockQty,
        reference_document: restockRef,
      });
      setRestockTarget(null);
      setRestockQty(20);
      setRestockRef("");
      await loadData();
    } catch {
      /* Toast */
    } finally {
      setRestockSaving(false);
    }
  };

  const filteredAlerts = useMemo(() => {
    if (filterType === "all") return alerts;
    return alerts.filter((a) => a.alert_type === filterType);
  }, [alerts, filterType]);

  const outOfStockCount = alerts.filter((a) => a.alert_type === "out_of_stock").length;
  const lowStockCount = alerts.filter((a) => a.alert_type === "low_stock").length;

  const columns: DataTableColumn<StockAlert>[] = [
    {
      key: "book_title",
      header: "Ouvrage en Alerte",
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
                <span className="text-[10px] text-foreground-muted font-mono">
                  {row.isbn}
                </span>
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
      key: "alert_type",
      header: "Gravité",
      cell: (row) => <StatusBadge status={row.alert_type} />,
    },
    {
      key: "quantity",
      header: "Stock Dispo",
      cell: (row) => (
        <span
          className={`font-mono font-bold text-xs ${
            row.quantity === 0 ? "text-error" : "text-gold"
          }`}
        >
          {row.quantity} ex.
        </span>
      ),
    },
    {
      key: "alert_threshold",
      header: "Seuil Mini",
      hideOnMobile: true,
      cell: (row) => (
        <span className="font-mono text-xs text-foreground-muted">
          {row.alert_threshold} ex.
        </span>
      ),
    },
    {
      key: "warehouse",
      header: "Entrepôt",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-xs text-foreground flex items-center gap-1">
          <Warehouse className="w-3 h-3 text-gold shrink-0" />
          {row.warehouse}
        </span>
      ),
    },
    {
      key: "triggered_at",
      header: "Déclenchée",
      cell: (row) => (
        <span className="text-xs text-foreground-muted font-mono">
          {timeAgo(row.triggered_at)}
        </span>
      ),
    },
    {
      key: "escalation_status",
      header: "Statut Escalade",
      cell: (row) => <StatusBadge status={row.escalation_status} />,
    },
    {
      key: "actions" as keyof StockAlert,
      header: "",
      cell: (row) => (
        <div className="flex items-center gap-1.5 justify-end">
          <button
            onClick={() => setRestockTarget(row)}
            className="px-3 py-1.5 rounded-lg bg-navy text-white text-[11px] font-bold hover:bg-navy-hover transition-colors whitespace-nowrap min-h-[36px] flex items-center gap-1.5 shadow-xs"
            title="Enregistrer un réassort immédiat"
          >
            <Package className="w-3.5 h-3.5 text-gold" />
            Réassort
          </button>
          {row.escalation_status === "not_escalated" && (
            <button
              onClick={() => setEscalateTarget(row)}
              className="px-2.5 py-1.5 rounded-lg bg-error/10 text-error text-[11px] font-bold hover:bg-error/20 transition-colors whitespace-nowrap min-h-[36px] flex items-center gap-1 border border-error/20"
              title="Signaler cette rupture à l'administrateur"
            >
              <ArrowUpCircle className="w-3.5 h-3.5" />
              Signaler Admin
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
        <Link href="/manager" className="hover:text-navy">
          Vue d&apos;ensemble
        </Link>
        <span>/</span>
        <Link href="/manager/stock" className="hover:text-navy">
          Stock
        </Link>
        <span>/</span>
        <span className="text-navy font-semibold">Alertes Automatiques</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <Link
            href="/manager/stock"
            className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour au stock
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <Flame className="w-4 h-4 text-error" />
            Surveillance Logistique
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Alertes de Rupture &amp; Seuil Bas
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Détection automatique dès qu&apos;un livre papier atteint un niveau critique. Réassortissez ou prévenez la direction.
          </p>
        </div>

        <Link
          href="/manager/coordination"
          className="inline-flex items-center justify-center gap-2 bg-background border border-border text-navy text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-background-secondary transition-colors shadow-xs min-h-[44px]"
        >
          <ArrowUpCircle className="w-4 h-4 text-gold" />
          Ruptures Escaladées
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-background-secondary border border-border">
          <p className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted mb-1">
            Total Alertes Actives
          </p>
          <p className="text-3xl font-bold font-mono text-navy">{alerts.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-error/5 border border-error/20">
          <p className="text-[11px] font-bold uppercase tracking-wider text-error mb-1 flex items-center gap-1">
            <Flame className="w-3 h-3" />
            Ruptures Totales (0 ex.)
          </p>
          <p className="text-3xl font-bold font-mono text-error">{outOfStockCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-gold/5 border border-gold/20">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gold mb-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Sous le Seuil Alerte
          </p>
          <p className="text-3xl font-bold font-mono text-gold">{lowStockCount}</p>
        </div>
      </div>

      {/* Onglets Filtres */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
        <span className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Filter className="w-3 h-3 text-gold" />
          Filtrer par gravité :
        </span>
        {[
          { id: "all" as const, label: `Toutes les alertes (${alerts.length})` },
          { id: "out_of_stock" as const, label: `Ruptures critiques (${outOfStockCount})` },
          { id: "low_stock" as const, label: `Seuils bas (${lowStockCount})` },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterType(f.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border ${
              filterType === f.id
                ? "bg-navy text-white border-navy"
                : "bg-background-secondary text-foreground-muted hover:text-navy border-border"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <DataTable
        data={filteredAlerts}
        columns={columns}
        rowKey="id"
        loading={loading}
        emptyMessage="Aucune alerte active — tous les stocks physiques sont satisfaisants."
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
                    <StatusBadge status={row.alert_type} />
                    <span
                      className={`font-mono font-bold text-xs ${
                        row.quantity === 0 ? "text-error" : "text-gold"
                      }`}
                    >
                      {row.quantity} ex. restant{row.quantity > 1 ? "s" : ""}
                    </span>
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
                    Seuil d&apos;alerte : {row.alert_threshold} ex.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
                <span className="text-foreground-muted flex items-center gap-1">
                  <Warehouse className="w-3 h-3 text-gold shrink-0" />
                  {(row as any).warehouse_nom || row.warehouse} ({row.country})
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setRestockTarget(row);
                      setRestockQty(Math.max(20, row.alert_threshold * 2));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-navy text-white text-[11px] font-semibold hover:bg-navy-hover"
                  >
                    Réassort
                  </button>
                  {row.escalation_status !== "escalated" && (
                    <button
                      onClick={() => setEscalateTarget(row)}
                      className="px-2.5 py-1 rounded-lg border border-gold/40 text-gold text-[11px] font-semibold hover:bg-gold/10"
                    >
                      Escalader
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        }}
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

      {/* Modale de réassort express */}
      {restockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-background border border-border rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h3 className="font-serif text-lg font-bold text-navy">
              Réassort Express — {restockTarget.book_title}
            </h3>
            <p className="text-xs text-foreground-muted">
              Entrepôt affecté : <span className="font-semibold text-foreground">{restockTarget.warehouse}</span>
            </p>
            <form onSubmit={handleQuickRestockSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted block mb-1">
                  Quantité à ajouter (ex.)
                </label>
                <input
                  type="number"
                  min={1}
                  value={restockQty}
                  onChange={(e) => setRestockQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 text-sm font-mono font-bold border border-border rounded-xl bg-background-secondary focus:outline-none focus:border-gold"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted block mb-1">
                  Référence bon de livraison / bon de commande
                </label>
                <input
                  type="text"
                  placeholder="BL-FOURNISSEUR-2026..."
                  value={restockRef}
                  onChange={(e) => setRestockRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background-secondary focus:outline-none focus:border-gold"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRestockTarget(null)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold hover:bg-background-secondary"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={restockSaving}
                  className="flex-1 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover"
                >
                  {restockSaving ? "Validation..." : "Valider le réassort"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
