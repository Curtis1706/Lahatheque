"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Package, Plus } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { getStockMovements, createRestock, createManualExit, getStockItems } from "@/lib/services/manager";
import type { StockMovement, StockItem } from "@/lib/types/manager";

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRestockForm, setShowRestockForm] = useState(false);
  const [showExitForm, setShowExitForm] = useState(false);

  // Restock form
  const [restockBookId, setRestockBookId] = useState("");
  const [restockQuantity, setRestockQuantity] = useState<number>(0);
  const [restockSaving, setRestockSaving] = useState(false);

  // Exit form
  const [exitBookId, setExitBookId] = useState("");
  const [exitQuantity, setExitQuantity] = useState<number>(0);
  const [exitReason, setExitReason] = useState("");
  const [exitSaving, setExitSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [mvData, stkData] = await Promise.all([getStockMovements(), getStockItems()]);
      setMovements(mvData);
      setStockItems(stkData);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleRestock = async () => {
    if (!restockBookId || restockQuantity <= 0) return;
    setRestockSaving(true);
    const mv = await createRestock({
      book_id: restockBookId,
      warehouse: "Entrepôt Cotonou",
      quantity: restockQuantity,
      date: new Date().toISOString(),
    });
    setMovements((prev) => [mv, ...prev]);
    setRestockBookId("");
    setRestockQuantity(0);
    setShowRestockForm(false);
    setRestockSaving(false);
  };

  const handleExit = async () => {
    if (!exitBookId || exitQuantity <= 0 || !exitReason.trim()) return;
    setExitSaving(true);
    const mv = await createManualExit({
      book_id: exitBookId,
      warehouse: "Entrepôt Cotonou",
      quantity: exitQuantity,
      reason: exitReason.trim(),
    });
    setMovements((prev) => [mv, ...prev]);
    setExitBookId("");
    setExitQuantity(0);
    setExitReason("");
    setShowExitForm(false);
    setExitSaving(false);
  };

  const columns: DataTableColumn<StockMovement>[] = [
    {
      key: "created_at",
      header: "Date",
      cell: (row) => (
        <span className="text-xs text-foreground font-mono">
          {new Date(row.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
        </span>
      ),
    },
    {
      key: "book_title",
      header: "Ouvrage",
      cell: (row) => <span className="text-xs font-semibold text-navy truncate max-w-[180px] block">{row.book_title}</span>,
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
      key: "reason",
      header: "Motif",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-xs text-foreground-muted truncate max-w-[150px] block">
          {row.reason || "—"}
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

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/manager" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <Link href="/manager/stock" className="hover:text-navy">Stock</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Mouvements</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <Link href="/manager/stock" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour au stock
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <Package className="w-4 h-4 text-gold" />
            Journal des Mouvements
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Mouvements de Stock
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Réassorts, sorties, retours — tous les mouvements sont enregistrés ici.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowRestockForm(!showRestockForm); setShowExitForm(false); }}
            className="px-4 py-2.5 rounded-xl bg-success text-white text-xs font-bold hover:opacity-90 transition-colors flex items-center gap-2 min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            Réassort
          </button>
          <button
            onClick={() => { setShowExitForm(!showExitForm); setShowRestockForm(false); }}
            className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center gap-2 min-h-[44px]"
          >
            <Package className="w-4 h-4" />
            Sortie manuelle
          </button>
        </div>
      </div>

      {/* Formulaire Réassort */}
      {showRestockForm && (
        <div className="bg-success/5 border border-success/20 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-navy">Enregistrer un réassort</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-navy mb-1">Ouvrage *</label>
              <select
                value={restockBookId}
                onChange={(e) => setRestockBookId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background focus:outline-none focus:border-gold text-foreground min-h-[40px]"
              >
                <option value="">Sélectionner un ouvrage</option>
                {stockItems.map((item) => (
                  <option key={item.id} value={item.id}>{item.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy mb-1">Quantité reçue *</label>
              <input
                type="number"
                min={1}
                value={restockQuantity || ""}
                onChange={(e) => setRestockQuantity(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background focus:outline-none focus:border-gold text-foreground font-mono min-h-[40px]"
                placeholder="Ex: 50"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleRestock}
                disabled={restockSaving || !restockBookId || restockQuantity <= 0}
                className="w-full px-4 py-2 rounded-xl bg-success text-white text-xs font-bold hover:opacity-90 transition-colors disabled:opacity-40 flex items-center justify-center gap-2 min-h-[40px]"
              >
                {restockSaving ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire Sortie Manuelle */}
      {showExitForm && (
        <div className="bg-error/5 border border-error/20 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-navy">Enregistrer une sortie manuelle</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-navy mb-1">Ouvrage *</label>
              <select
                value={exitBookId}
                onChange={(e) => setExitBookId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background focus:outline-none focus:border-gold text-foreground min-h-[40px]"
              >
                <option value="">Sélectionner un ouvrage</option>
                {stockItems.map((item) => (
                  <option key={item.id} value={item.id}>{item.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy mb-1">Quantité *</label>
              <input
                type="number"
                min={1}
                value={exitQuantity || ""}
                onChange={(e) => setExitQuantity(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background focus:outline-none focus:border-gold text-foreground font-mono min-h-[40px]"
                placeholder="Ex: 3"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy mb-1">Motif *</label>
              <input
                type="text"
                value={exitReason}
                onChange={(e) => setExitReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background focus:outline-none focus:border-gold text-foreground min-h-[40px]"
                placeholder="Ex: Endommagé, retour fournisseur..."
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleExit}
                disabled={exitSaving || !exitBookId || exitQuantity <= 0 || !exitReason.trim()}
                className="w-full px-4 py-2 rounded-xl bg-error text-white text-xs font-bold hover:opacity-90 transition-colors disabled:opacity-40 flex items-center justify-center gap-2 min-h-[40px]"
              >
                {exitSaving ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : "Enregistrer"}
              </button>
            </div>
          </div>
          <p className="text-[10px] text-foreground-muted">
            Les mouvements enregistrés ne peuvent pas être supprimés. Pour corriger une erreur, enregistrez un mouvement inverse.
          </p>
        </div>
      )}

      {/* Journal des mouvements */}
      <DataTable
        data={movements}
        columns={columns}
        rowKey="id"
        loading={loading}
        emptyMessage="Aucun mouvement de stock enregistré."
        pageSize={10}
      />
    </div>
  );
}
