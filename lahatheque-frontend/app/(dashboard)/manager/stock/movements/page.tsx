"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  ArrowDownCircle,
  History,
  ChevronDown,
  X,
  Check,
} from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getStockMovements,
  createRestock,
  createManualExit,
  getStockItems,
} from "@/lib/services/manager";
import type { StockMovement, StockItem } from "@/lib/types/manager";

// ─── Label type de mouvement ──────────────────────────────────────────────────
const MOVEMENT_LABELS: Record<string, string> = {
  restock: "Réassort",
  sale: "Vente",
  return: "Retour",
  damage: "Avarie",
  correction: "Correction",
  manual_exit: "Sortie manuelle",
  adjustment: "Ajustement",
};

// ─── Modal Réassort ───────────────────────────────────────────────────────────
function RestockModal({
  stockItems,
  onClose,
  onSuccess,
}: {
  stockItems: StockItem[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [stockId, setStockId] = useState("");
  const [quantite, setQuantite] = useState(1);
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!stockId) { setError("Sélectionnez un ouvrage."); return; }
    if (quantite <= 0) { setError("Quantité invalide."); return; }
    setSaving(true);
    try {
      await createRestock({ stock_id: stockId, quantite, reference_document: reference });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erreur lors du réassort.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
      <div className="bg-background border border-border rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-navy">Réassort Stock</h2>
            <p className="text-xs text-foreground-muted mt-0.5">Enregistrer une entrée de stock.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-background-secondary transition-colors" title="Fermer">
            <X className="w-4 h-4 text-foreground-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sélection ouvrage */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider">Ouvrage / Stock</label>
            <div className="relative">
              <select
                value={stockId}
                onChange={(e) => setStockId(e.target.value)}
                className="w-full appearance-none px-3 pr-8 py-2.5 text-xs border border-border rounded-xl bg-background-secondary focus:outline-none focus:border-gold text-foreground min-h-[42px]"
              >
                <option value="">-- Choisir un ouvrage --</option>
                {stockItems.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} — {(s as any).warehouse_nom || s.warehouse}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-foreground-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Quantité */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider">Quantité à entrer</label>
            <input
              type="number"
              min={1}
              value={quantite}
              onChange={(e) => setQuantite(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2.5 text-sm font-mono border border-border rounded-xl bg-background-secondary focus:outline-none focus:border-gold text-foreground min-h-[42px]"
            />
          </div>

          {/* Référence */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider">Référence document <span className="font-normal">(optionnel)</span></label>
            <input
              type="text"
              value={reference}
              placeholder="BL-2025-001, facture fournisseur…"
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3 py-2.5 text-xs border border-border rounded-xl bg-background-secondary focus:outline-none focus:border-gold text-foreground min-h-[42px]"
            />
          </div>

          {error && (
            <p className="text-xs text-error bg-error/10 border border-error/20 rounded-xl px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-background-secondary transition-colors min-h-[44px]">
              Annuler
            </button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]">
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal Sortie Manuelle ────────────────────────────────────────────────────
function ManualExitModal({
  stockItems,
  onClose,
  onSuccess,
}: {
  stockItems: StockItem[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [stockId, setStockId] = useState("");
  const [quantite, setQuantite] = useState(1);
  const [motif, setMotif] = useState("");
  const [typeM, setTypeM] = useState<"manual_exit" | "adjustment" | "return">("manual_exit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!stockId) { setError("Sélectionnez un ouvrage."); return; }
    if (quantite <= 0) { setError("Quantité invalide."); return; }
    if (!motif.trim()) { setError("Le motif est obligatoire."); return; }
    setSaving(true);
    try {
      await createManualExit({ stock_id: stockId, quantite, motif: motif.trim(), type_mouvement: typeM });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la sortie manuelle.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
      <div className="bg-background border border-border rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-navy">Sortie de Stock</h2>
            <p className="text-xs text-foreground-muted mt-0.5">Enregistrer une sortie (avarie, retour, correction).</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-background-secondary transition-colors" title="Fermer">
            <X className="w-4 h-4 text-foreground-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider">Type de sortie</label>
            <div className="flex gap-2 flex-wrap">
              {[
                { val: "manual_exit", label: "Sortie manuelle" },
                { val: "return", label: "Retour" },
                { val: "adjustment", label: "Ajustement" },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setTypeM(opt.val as any)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                    typeM === opt.val ? "bg-navy/10 text-navy border border-navy/30 font-bold" : "text-foreground-muted border border-border hover:border-navy/20"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sélection ouvrage */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider">Ouvrage / Stock</label>
            <div className="relative">
              <select
                value={stockId}
                onChange={(e) => setStockId(e.target.value)}
                className="w-full appearance-none px-3 pr-8 py-2.5 text-xs border border-border rounded-xl bg-background-secondary focus:outline-none focus:border-gold text-foreground min-h-[42px]"
              >
                <option value="">-- Choisir un ouvrage --</option>
                {stockItems.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} — {(s as any).warehouse_nom || s.warehouse}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-foreground-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Quantité */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider">Quantité à sortir</label>
            <input
              type="number"
              min={1}
              value={quantite}
              onChange={(e) => setQuantite(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2.5 text-sm font-mono border border-border rounded-xl bg-background-secondary focus:outline-none focus:border-gold text-foreground min-h-[42px]"
            />
          </div>

          {/* Motif */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider">Motif <span className="text-error">*</span></label>
            <textarea
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Ex : 12 exemplaires endommagés lors du transport…"
              rows={3}
              className="w-full px-3 py-2.5 text-xs border border-border rounded-xl bg-background-secondary focus:outline-none focus:border-gold text-foreground resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-error bg-error/10 border border-error/20 rounded-xl px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-background-secondary transition-colors min-h-[44px]">
              Annuler
            </button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-error text-white text-xs font-bold hover:bg-error/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]">
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ArrowDownCircle className="w-4 h-4" />
              )}
              Enregistrer sortie
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function StockMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [mvData, stkData] = await Promise.all([
      getStockMovements(),
      getStockItems(),
    ]);
    setMovements(mvData);
    setStockItems(stkData);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const columns: DataTableColumn<StockMovement>[] = [
    {
      key: "created_at",
      header: "Date",
      cell: (row) => (
        <span className="text-xs text-foreground font-mono">
          {new Date(row.created_at).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
    {
      key: "book_title",
      header: "Ouvrage",
      cell: (row) => (
        <span className="text-xs font-semibold text-navy truncate max-w-[180px] block">
          {row.book_title}
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
        <span
          className={`font-mono font-bold text-xs ${
            row.quantity > 0 ? "text-success" : "text-error"
          }`}
        >
          {row.quantity > 0 ? `+${row.quantity}` : row.quantity}
        </span>
      ),
    },
    {
      key: "reason" as keyof StockMovement,
      header: "Motif",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-xs text-foreground-muted truncate max-w-[150px] block">
          {(row as any).motif || (row as any).reason || "—"}
        </span>
      ),
    },
    {
      key: "origin",
      header: "Origine",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-xs text-foreground-muted">
          {row.origin === "manual"
            ? "Manuel"
            : row.origin === "auto_order"
            ? "Commande auto"
            : "Retour fournisseur"}
        </span>
      ),
    },
    {
      key: "created_by",
      header: "Par",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-xs text-foreground-muted">{row.created_by}</span>
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
        <span className="text-navy font-semibold">Journal des Mouvements</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <Link href="/manager/stock" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour au stock
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <History className="w-4 h-4 text-gold" />
            Journal d&apos;Audit
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Mouvements de Stock
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Enregistrement immuable de toutes les entrées, sorties, retours et corrections.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowExitModal(true)}
            className="inline-flex items-center gap-2 bg-background border border-error text-error text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-error/5 transition-colors min-h-[44px]"
          >
            <ArrowDownCircle className="w-4 h-4" />
            Sortie manuelle
          </button>
          <button
            onClick={() => setShowRestockModal(true)}
            className="inline-flex items-center gap-2 bg-navy hover:bg-navy-hover text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-xs min-h-[44px]"
          >
            <Package className="w-4 h-4" />
            Réassort
          </button>
        </div>
      </div>

      {/* Stats résumés */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total mouvements",
            value: movements.length,
            color: "text-navy",
          },
          {
            label: "Réassorts",
            value: movements.filter((m) => m.movement_type === "restock").length,
            color: "text-success",
          },
          {
            label: "Sorties",
            value: movements.filter((m) =>
              ["manual_exit", "damage", "adjustment"].includes(m.movement_type)
            ).length,
            color: "text-error",
          },
          {
            label: "Retours",
            value: movements.filter((m) => m.movement_type === "return").length,
            color: "text-gold",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-2xl bg-background-secondary border border-border"
          >
            <p className="text-[11px] text-foreground-muted uppercase tracking-wider font-bold mb-1">
              {stat.label}
            </p>
            <p className={`text-2xl font-bold font-mono ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <DataTable
        data={movements}
        columns={columns}
        rowKey="id"
        loading={loading}
        emptyMessage="Aucun mouvement enregistré pour le moment."
        pageSize={20}
      />

      {/* Modales */}
      {showRestockModal && (
        <RestockModal
          stockItems={stockItems}
          onClose={() => setShowRestockModal(false)}
          onSuccess={loadData}
        />
      )}
      {showExitModal && (
        <ManualExitModal
          stockItems={stockItems}
          onClose={() => setShowExitModal(false)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
