"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Save,
  Warehouse,
  Package,
  ArrowDownCircle,
  Check,
  Building2,
  Calendar,
  Layers,
} from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { BookCover3D } from "@/components/ui/book-cover-3d";
import {
  getStockItemDetail,
  updateStockAlertThreshold,
  createRestock,
  createManualExit,
} from "@/lib/services/manager";
import type { StockItemDetail, StockMovement } from "@/lib/types/manager";

export default function StockDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [detail, setDetail] = useState<StockItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Modales d'action rapide
  const [showRestock, setShowRestock] = useState(false);
  const [restockQty, setRestockQty] = useState(10);
  const [restockRef, setRestockRef] = useState("");
  const [restockLoading, setRestockLoading] = useState(false);

  const [showExit, setShowExit] = useState(false);
  const [exitQty, setExitQty] = useState(1);
  const [exitMotif, setExitMotif] = useState("");
  const [exitLoading, setExitLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await getStockItemDetail(id);
    setDetail(data);
    if (data) setThreshold(data.alert_threshold);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveThreshold = async () => {
    if (!detail || threshold === detail.alert_threshold) return;
    setSaving(true);
    try {
      await updateStockAlertThreshold(id, threshold);
      setDetail({ ...detail, alert_threshold: threshold });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      /* Erreur gérée par le toast */
    } finally {
      setSaving(false);
    }
  };

  const handleQuickRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail || restockQty <= 0) return;
    setRestockLoading(true);
    try {
      await createRestock({
        stock_id: detail.id,
        quantite: restockQty,
        reference_document: restockRef,
      });
      setShowRestock(false);
      setRestockQty(10);
      setRestockRef("");
      await loadData();
    } catch {
      /* Toast */
    } finally {
      setRestockLoading(false);
    }
  };

  const handleQuickExit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail || exitQty <= 0 || !exitMotif.trim()) return;
    setExitLoading(true);
    try {
      await createManualExit({
        stock_id: detail.id,
        quantite: exitQty,
        motif: exitMotif.trim(),
      });
      setShowExit(false);
      setExitQty(1);
      setExitMotif("");
      await loadData();
    } catch {
      /* Toast */
    } finally {
      setExitLoading(false);
    }
  };

  const movementColumns: DataTableColumn<StockMovement>[] = [
    {
      key: "created_at",
      header: "Date & Heure",
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
      header: "Motif / Réf",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-xs text-foreground-muted truncate max-w-[200px] block">
          {row.reason || "—"}
        </span>
      ),
    },
    {
      key: "created_by",
      header: "Opérateur",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-xs text-foreground-muted">{row.created_by}</span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 w-full max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-background-secondary rounded-xl" />
        <div className="h-48 bg-background-secondary rounded-2xl" />
        <div className="h-64 bg-background-secondary rounded-2xl" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="p-4 sm:p-6 md:p-8 w-full max-w-5xl mx-auto text-center space-y-4">
        <BookOpen className="w-12 h-12 text-foreground-muted mx-auto" />
        <h2 className="font-serif font-bold text-navy text-xl">
          Fiche de stock introuvable
        </h2>
        <p className="text-xs text-foreground-muted">
          Cet enregistrement de stock n&apos;existe pas ou a été déplacé.
        </p>
        <Link
          href="/manager/stock"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la vue globale
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted flex-wrap">
        <Link href="/manager" className="hover:text-navy">
          Vue d&apos;ensemble
        </Link>
        <span>/</span>
        <Link href="/manager/stock" className="hover:text-navy">
          Stock Papier
        </Link>
        <span>/</span>
        <span className="text-navy font-semibold truncate max-w-[240px]">
          {detail.title}
        </span>
      </div>

      {/* Hero Header with 3D Book Cover */}
      <div className="p-6 rounded-2xl bg-background border border-border shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-start gap-4 sm:gap-6 min-w-0">
          <BookCover3D
            title={detail.title}
            authors={detail.authors}
            discipline={detail.discipline}
            coverUrl={(detail as any).cover_url}
            size="md"
          />
          <div className="space-y-1.5 min-w-0">
            <div className="inline-flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-gold/10 text-gold text-[10px] font-mono font-bold uppercase tracking-wider">
                {detail.discipline || "Manuel Papier"}
              </span>
              <StatusBadge status={detail.status} />
            </div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-navy leading-snug">
              {detail.title}
            </h1>
            <p className="text-xs text-foreground-muted">
              {detail.authors?.length > 0 ? detail.authors.join(", ") : "Auteurs LAHA"} •{" "}
              {detail.publisher_name || "LAHA Éditions"}
            </p>
            <p className="text-xs font-mono text-foreground-muted">
              ISBN : <span className="text-navy font-bold">{detail.isbn}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0">
          <button
            onClick={() => setShowRestock(true)}
            className="inline-flex items-center justify-center gap-2 bg-navy hover:bg-navy-hover text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-xs min-h-[44px]"
          >
            <Package className="w-4 h-4 text-gold" />
            Réassort (+Stock)
          </button>
          <button
            onClick={() => setShowExit(true)}
            className="inline-flex items-center justify-center gap-2 bg-background border border-error text-error text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-error/5 transition-colors min-h-[44px]"
          >
            <ArrowDownCircle className="w-4 h-4" />
            Sortie (-Stock)
          </button>
        </div>
      </div>

      {/* 4 Cards de Métriques Clés */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-background-secondary border border-border">
          <p className="text-[11px] text-foreground-muted uppercase tracking-wider font-bold mb-1">
            Stock Disponible
          </p>
          <p className="text-3xl font-bold font-mono text-navy">
            {detail.quantity} <span className="text-xs font-sans font-normal text-foreground-muted">ex.</span>
          </p>
          <p className="text-[10px] text-foreground-muted mt-1">
            Disponible immédiatement à la vente
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-background-secondary border border-border">
          <p className="text-[11px] text-foreground-muted uppercase tracking-wider font-bold mb-1">
            Entrepôt &amp; Pays
          </p>
          <p className="text-sm font-semibold text-foreground flex items-center gap-1.5 mt-1">
            <Warehouse className="w-4 h-4 text-gold shrink-0" />
            {(detail as any).warehouse_nom || detail.warehouse}
          </p>
          <p className="text-[10px] text-foreground-muted mt-1">
            {(detail as any).ville ? `${(detail as any).ville}, ` : ""}{detail.country}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-background-secondary border border-border">
          <p className="text-[11px] text-foreground-muted uppercase tracking-wider font-bold mb-1">
            Seuil d&apos;Alerte Actuel
          </p>
          <p className="text-2xl font-bold font-mono text-gold">
            {detail.alert_threshold} <span className="text-xs font-sans font-normal text-foreground-muted">ex.</span>
          </p>
          <p className="text-[10px] text-foreground-muted mt-1">
            Déclenche une notification sous ce niveau
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-background-secondary border border-border">
          <p className="text-[11px] text-foreground-muted uppercase tracking-wider font-bold mb-1">
            Dernier Réassort
          </p>
          <p className="text-sm font-semibold text-foreground mt-1">
            {detail.last_restock_at
              ? new Date(detail.last_restock_at).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "Aucun réassort"}
          </p>
          <p className="text-[10px] text-foreground-muted mt-1">
            Mise à jour automatique
          </p>
        </div>
      </div>

      {/* Configuration Seuil d'Alerte */}
      <div className="p-5 rounded-2xl bg-background border border-border space-y-3 shadow-xs">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-gold" />
          <h3 className="text-sm font-bold text-navy">
            Configuration du Seuil de Réapprovisionnement
          </h3>
        </div>
        <p className="text-xs text-foreground-muted">
          Lorsque la quantité réelle passe sous ce seuil, une alerte est transmise au tableau de bord et peut être escaladée vers l&apos;Administration centrale.
        </p>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={threshold}
              onChange={(e) => setThreshold(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-28 px-3 py-2 text-sm font-mono font-bold border border-border rounded-xl bg-background-secondary focus:outline-none focus:border-gold text-foreground min-h-[42px]"
            />
            <span className="text-xs text-foreground-muted font-medium">exemplaires</span>
          </div>

          <button
            onClick={handleSaveThreshold}
            disabled={saving || threshold === detail.alert_threshold}
            className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors disabled:opacity-40 flex items-center gap-2 min-h-[42px]"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : saved ? (
              <>
                <Check className="w-4 h-4 text-success" />
                Enregistré
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-gold" />
                Mettre à jour le seuil
              </>
            )}
          </button>
        </div>
      </div>

      {/* Historique des mouvements récents */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-navy">
            Journal des mouvements pour cet ouvrage
          </h3>
          <Link
            href="/manager/stock/movements"
            className="text-xs font-semibold text-gold hover:underline"
          >
            Journal global →
          </Link>
        </div>
        <DataTable
          data={detail.recent_movements || []}
          columns={movementColumns}
          rowKey="id"
          loading={false}
          emptyMessage="Aucun mouvement enregistré pour cet ouvrage."
          pageSize={10}
        />
      </div>

      {/* Quick Modal Réassort */}
      {showRestock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-background border border-border rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h3 className="font-serif text-lg font-bold text-navy">
              Réassort Rapide — {detail.title}
            </h3>
            <form onSubmit={handleQuickRestock} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted block mb-1">
                  Quantité reçue (ex.)
                </label>
                <input
                  type="number"
                  min={1}
                  value={restockQty}
                  onChange={(e) => setRestockQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 text-sm font-mono border border-border rounded-xl bg-background-secondary focus:outline-none focus:border-gold"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted block mb-1">
                  N° Bon de Livraison / Référence
                </label>
                <input
                  type="text"
                  placeholder="BL-2026-..."
                  value={restockRef}
                  onChange={(e) => setRestockRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background-secondary focus:outline-none focus:border-gold"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRestock(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold hover:bg-background-secondary"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={restockLoading}
                  className="flex-1 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover"
                >
                  {restockLoading ? "Enregistrement..." : "Valider l'entrée"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Modal Sortie */}
      {showExit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-background border border-border rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h3 className="font-serif text-lg font-bold text-navy">
              Sortie de Stock — {detail.title}
            </h3>
            <form onSubmit={handleQuickExit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted block mb-1">
                  Quantité à déduire (ex.)
                </label>
                <input
                  type="number"
                  min={1}
                  max={detail.quantity}
                  value={exitQty}
                  onChange={(e) => setExitQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 text-sm font-mono border border-border rounded-xl bg-background-secondary focus:outline-none focus:border-gold"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted block mb-1">
                  Motif obligatoire (avarie, perte, correction...)
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex : 2 exemplaires abîmés lors de la manutention..."
                  value={exitMotif}
                  onChange={(e) => setExitMotif(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background-secondary focus:outline-none focus:border-gold resize-none"
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExit(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold hover:bg-background-secondary"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={exitLoading}
                  className="flex-1 py-2.5 rounded-xl bg-error text-white text-xs font-bold hover:bg-error/90"
                >
                  {exitLoading ? "Déduction..." : "Confirmer la sortie"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
