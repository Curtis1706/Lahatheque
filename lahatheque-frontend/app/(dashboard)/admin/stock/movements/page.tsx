"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import {
  getAdminStockMovements,
  processAdminStockAdjustment,
} from "@/lib/services/admin";
import { AdminStockMovement } from "@/lib/types/admin";
import {
  TrendingDown,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Boxes,
  Building2,
  Search,
  Filter,
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Loader2,
  User,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminStockMovementsPage() {
  const [movements, setMovements] = useState<AdminStockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modales
  const [selectedForApprove, setSelectedForApprove] = useState<AdminStockMovement | null>(null);
  const [selectedForReject, setSelectedForReject] = useState<AdminStockMovement | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getAdminStockMovements();
      setMovements(data);
    } catch {
      toast.error("Impossible de récupérer les mouvements de stock.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredMovements = movements.filter((m) => {
    const matchesSearch =
      m.book_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.warehouse_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.initiated_by.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.reason.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      filterType === "all" ||
      (filterType === "pending" && m.status === "pending_admin_approval") ||
      (filterType === "loss" && m.movement_type === "destruction_perte") ||
      (filterType === "restock" && m.movement_type === "reassort_imprimerie");

    return matchesSearch && matchesType;
  });

  const pendingLossCount = movements.filter(
    (m) => m.status === "pending_admin_approval" && m.movement_type === "destruction_perte"
  ).length;

  const handleApprove = async () => {
    if (!selectedForApprove) return;
    setIsSubmitting(true);
    try {
      const res = await processAdminStockAdjustment(selectedForApprove.id, "approve");
      if (res.success) {
        toast.success(res.message || "Régularisation comptable approuvée avec succès !");
        setSelectedForApprove(null);
        await loadData();
      } else {
        toast.error(res.error || "Erreur lors de l'approbation.");
      }
    } catch {
      toast.error("Erreur de communication avec le serveur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForReject) return;
    if (!rejectionReason.trim()) {
      toast.error("Veuillez indiquer le motif précis du refus de passation en perte.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await processAdminStockAdjustment(selectedForReject.id, "reject", rejectionReason);
      if (res.success) {
        toast.success(res.message || "Régularisation rejetée. Le motif a été transmis au gestionnaire.");
        setSelectedForReject(null);
        setRejectionReason("");
        await loadData();
      } else {
        toast.error(res.error || "Erreur lors du rejet.");
      }
    } catch {
      toast.error("Erreur de communication avec le serveur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: DataTableColumn<AdminStockMovement>[] = [
    {
      key: "book",
      header: "Ouvrage & Entrepôt",
      cell: (row) => (
        <div className="space-y-0.5">
          <p className="font-semibold text-xs text-foreground line-clamp-1">{row.book_title}</p>
          <div className="flex items-center gap-1.5 text-[11px] text-foreground-muted">
            <Building2 className="w-3.5 h-3.5 text-gold shrink-0" />
            <span className="font-medium text-navy">{row.warehouse_name}</span>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type de Flux & Quantité",
      cell: (row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            {row.movement_type === "destruction_perte" ? (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-error/15 text-error font-bold border border-error/20">
                <AlertTriangle className="w-3 h-3" />
                Passation en Perte
              </span>
            ) : row.movement_type === "reassort_imprimerie" ? (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-success/15 text-success font-bold border border-success/20">
                <ArrowDownLeft className="w-3 h-3" />
                Réassort Tirage
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-navy/10 text-navy font-bold">
                <RefreshCw className="w-3 h-3" />
                Transfert Inter-Hub
              </span>
            )}
          </div>
          <p className={`font-mono text-xs font-bold ${row.movement_type === "destruction_perte" ? "text-error" : "text-foreground"}`}>
            {row.movement_type === "destruction_perte" ? `-${row.quantity}` : `+${row.quantity}`} exemplaires
          </p>
        </div>
      ),
    },
    {
      key: "reason",
      header: "Motif & Initiateur",
      cell: (row) => (
        <div className="space-y-1 text-[11px]">
          <p className="text-foreground line-clamp-2 leading-tight" title={row.reason}>
            {row.reason}
          </p>
          <div className="flex items-center gap-1 text-foreground-muted">
            <User className="w-3 h-3 text-gold shrink-0" />
            <span>{row.initiated_by}</span>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Statut",
      cell: (row) => (
        <div className="space-y-1">
          <StatusBadge
            status={
              row.status === "pending_admin_approval"
                ? "in_review"
                : row.status === "approved"
                ? "approved"
                : "rejected"
            }
          />
          {row.rejection_reason && (
            <p className="text-[10px] text-error font-medium line-clamp-1" title={row.rejection_reason}>
              Refus : {row.rejection_reason}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          {row.status === "pending_admin_approval" ? (
            <>
              <button
                type="button"
                onClick={() => setSelectedForApprove(row)}
                className="px-2.5 py-1.5 rounded-xl bg-success text-white hover:bg-success/90 transition-colors text-xs font-semibold flex items-center gap-1 shadow-xs"
                title="Valider la passation en perte"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Valider</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedForReject(row)}
                className="px-2.5 py-1.5 rounded-xl bg-error/10 border border-error/20 text-error hover:bg-error/20 transition-colors text-xs font-semibold flex items-center gap-1"
                title="Rejeter la perte"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Rejeter</span>
              </button>
            </>
          ) : (
            <span className="text-[11px] text-foreground-muted font-medium">Traité</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* En-tête avec fil d'Ariane */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 text-xs text-foreground-muted mb-1">
            <Link href="/admin" className="hover:text-navy transition-colors">Administration</Link>
            <span>/</span>
            <Link href="/admin/stock" className="hover:text-navy transition-colors">Stock Physique</Link>
            <span>/</span>
            <span className="text-navy font-semibold">Mouvements & Pertes</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy flex items-center gap-2.5">
            <TrendingDown className="w-6 h-6 text-gold" />
            Journal des Flux & Régularisations de Stock
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
            Contrôle des réceptions d'imprimerie, transferts inter-entrepôts et validation des déclarations de mise au rebut.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/stock"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-background border border-border text-foreground text-xs font-semibold hover:border-gold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Vue Générale Stock</span>
          </Link>
        </div>
      </div>

      {/* Barre de Recherche et Filtres */}
      <div className="p-4 rounded-2xl bg-background-secondary border border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Rechercher par titre d'ouvrage, entrepôt, déclarant ou motif..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              filterType === "all"
                ? "bg-navy text-white"
                : "bg-background border border-border text-foreground hover:bg-background-secondary"
            }`}
          >
            Tous ({movements.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterType("pending")}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filterType === "pending"
                ? "bg-gold text-navy font-bold"
                : "bg-background border border-border text-foreground hover:bg-background-secondary"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>En attente ({pendingLossCount})</span>
          </button>
        </div>
      </div>

      {/* Tableau des Mouvements */}
      <div className="rounded-2xl bg-background-secondary border border-border overflow-hidden p-4 sm:p-6">
        <DataTable
          data={filteredMovements}
          columns={columns}
          rowKey="id"
          loading={loading}
          emptyMessage="Aucun mouvement de stock ne correspond aux critères sélectionnés."
        />
      </div>

      {/* Modale d'Approbation de Perte */}
      <Modal
        open={!!selectedForApprove}
        onClose={() => setSelectedForApprove(null)}
        title="Valider la Régularisation de Stock"
      >
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-success/10 border border-success/20">
            <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
            <div>
              <p className="text-xs font-bold text-success">Approbation Comptable de Mise au Rebut</p>
              <p className="text-[11px] text-foreground">
                Cette décision déduira officiellement les exemplaires endommagés de l'inventaire physique de l'entrepôt.
              </p>
            </div>
          </div>

          {selectedForApprove && (
            <div className="space-y-2 text-xs">
              <p className="font-semibold text-foreground">Ouvrage : <span className="font-serif text-navy">{selectedForApprove.book_title}</span></p>
              <p className="text-foreground-muted">Entrepôt : <strong className="text-foreground">{selectedForApprove.warehouse_name}</strong></p>
              <p className="text-foreground-muted">Quantité : <strong className="text-error font-mono">-{selectedForApprove.quantity} exemplaires</strong></p>
              <p className="text-foreground-muted">Motif : {selectedForApprove.reason}</p>
            </div>
          )}

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setSelectedForApprove(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-foreground-muted hover:bg-background-secondary"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleApprove}
              className="px-5 py-2 rounded-xl bg-success text-white text-xs font-semibold hover:bg-success/90 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Traitement...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Valider la Déduction</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modale de Rejet de Perte avec Motif */}
      <Modal
        open={!!selectedForReject}
        onClose={() => setSelectedForReject(null)}
        title="Refuser la Déclaration de Perte"
      >
        <form onSubmit={handleReject} className="p-6 space-y-5">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-error/10 border border-error/20">
            <AlertTriangle className="w-5 h-5 text-error shrink-0" />
            <div>
              <p className="text-xs font-bold text-error">Rejet de la passation en perte</p>
              <p className="text-[11px] text-foreground">
                Le gestionnaire de stock sera notifié avec le motif indiqué ci-dessous.
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">
              Motif précis du rejet (obligatoire) *
            </label>
            <textarea
              required
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Exemple : Constat d'huissier ou rapport d'incident non fourni, quantité déclarée non conforme."
              className="w-full mt-1.5 p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none resize-none"
            />
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setSelectedForReject(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-foreground-muted hover:bg-background-secondary"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-error text-white text-xs font-semibold hover:bg-error/90 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Confirmer le Rejet</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
