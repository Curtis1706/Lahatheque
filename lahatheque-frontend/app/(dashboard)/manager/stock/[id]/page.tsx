"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Save, Warehouse } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { getStockItemDetail, updateAlertThreshold } from "@/lib/services/manager";
import type { StockItemDetail, StockMovement } from "@/lib/types/manager";

export default function StockDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [detail, setDetail] = useState<StockItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getStockItemDetail(id);
      setDetail(data);
      if (data) setThreshold(data.alert_threshold);
      setLoading(false);
    }
    loadData();
  }, [id]);

  const handleSaveThreshold = async () => {
    if (!detail || threshold === detail.alert_threshold) return;
    setSaving(true);
    const ok = await updateAlertThreshold(id, threshold);
    if (ok) {
      setDetail({ ...detail, alert_threshold: threshold });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  const movementColumns: DataTableColumn<StockMovement>[] = [
    {
      key: "created_at",
      header: "Date",
      cell: (row) => (
        <span className="text-xs text-foreground font-mono">
          {new Date(row.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
        </span>
      ),
    },
    {
      key: "movement_type",
      header: "Type",
      cell: (row) => <StatusBadge status={row.movement_type} />,
    },
    {
      key: "quantity",
      header: "Quantité",
      cell: (row) => (
        <span className={`font-mono font-bold text-xs ${row.quantity > 0 ? "text-success" : "text-error"}`}>
          {row.quantity > 0 ? `+${row.quantity}` : row.quantity}
        </span>
      ),
    },
    {
      key: "origin",
      header: "Origine",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-xs text-foreground-muted">
          {row.origin === "manual" ? "Manuel" : row.origin === "auto_order" ? "Commande auto" : "Retour fournisseur"}
        </span>
      ),
    },
    {
      key: "created_by",
      header: "Par",
      hideOnMobile: true,
      cell: (row) => <span className="text-xs text-foreground-muted">{row.created_by}</span>,
    },
  ];

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 w-full max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-background-secondary rounded-xl" />
        <div className="h-40 bg-background-secondary rounded-2xl" />
        <div className="h-64 bg-background-secondary rounded-2xl" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="p-4 sm:p-6 md:p-8 w-full max-w-5xl mx-auto text-center space-y-4">
        <BookOpen className="w-12 h-12 text-foreground-muted mx-auto" />
        <h2 className="font-serif font-bold text-navy text-xl">Ouvrage introuvable</h2>
        <Link href="/manager/stock" className="text-xs text-gold font-bold hover:underline">
          Retour au stock
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/manager" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <Link href="/manager/stock" className="hover:text-navy">Stock</Link>
        <span>/</span>
        <span className="text-navy font-semibold truncate max-w-[200px]">{detail.title}</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6">
        <Link href="/manager/stock" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour au stock
        </Link>
        <h1 className="font-serif text-xl sm:text-2xl font-bold text-navy">{detail.title}</h1>
        <p className="text-xs text-foreground-muted mt-1">
          {detail.authors.join(", ")} • {detail.publisher_name} • ISBN {detail.isbn}
        </p>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-background-secondary border border-border">
          <p className="text-[11px] text-foreground-muted uppercase tracking-wider font-bold mb-1">Quantité</p>
          <p className="text-2xl font-bold font-mono text-navy">{detail.quantity}</p>
        </div>
        <div className="p-4 rounded-2xl bg-background-secondary border border-border">
          <p className="text-[11px] text-foreground-muted uppercase tracking-wider font-bold mb-1">Statut</p>
          <StatusBadge status={detail.status} />
        </div>
        <div className="p-4 rounded-2xl bg-background-secondary border border-border">
          <p className="text-[11px] text-foreground-muted uppercase tracking-wider font-bold mb-1">Entrepôt</p>
          <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Warehouse className="w-4 h-4 text-gold" />
            {detail.warehouse}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-background-secondary border border-border">
          <p className="text-[11px] text-foreground-muted uppercase tracking-wider font-bold mb-1">Dernier réassort</p>
          <p className="text-sm font-semibold text-foreground">
            {detail.last_restock_at
              ? new Date(detail.last_restock_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
              : "—"}
          </p>
        </div>
      </div>

      {/* Seuil d'alerte configurable */}
      <div className="p-5 rounded-2xl bg-background-secondary border border-border space-y-3">
        <h3 className="text-sm font-semibold text-navy">Seuil d&apos;alerte</h3>
        <p className="text-xs text-foreground-muted">
          Lorsque la quantité passe en dessous de ce seuil, une alerte de stock bas est déclenchée automatiquement.
        </p>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={0}
            value={threshold}
            onChange={(e) => setThreshold(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-24 px-3 py-2 text-sm font-mono border border-border rounded-xl bg-background focus:outline-none focus:border-gold text-foreground min-h-[40px]"
          />
          <button
            onClick={handleSaveThreshold}
            disabled={saving || threshold === detail.alert_threshold}
            className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors disabled:opacity-40 flex items-center gap-2 min-h-[40px]"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saved ? "Enregistré ✓" : "Enregistrer"}
          </button>
        </div>
      </div>

      {/* Historique des mouvements récents */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Mouvements récents</h3>
          <Link href="/manager/stock/movements" className="text-xs font-medium text-gold hover:text-gold-dark">
            Voir tous les mouvements →
          </Link>
        </div>
        <DataTable
          data={detail.recent_movements}
          columns={movementColumns}
          rowKey="id"
          loading={false}
          emptyMessage="Aucun mouvement enregistré pour cet ouvrage."
        />
      </div>
    </div>
  );
}
