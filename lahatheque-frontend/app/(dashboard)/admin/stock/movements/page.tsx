"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAdminStockMovements } from "@/lib/services/admin";
import { AdminStockMovement } from "@/lib/types/admin";
import {
  TrendingDown,
  Building2,
  Search,
  ArrowLeft,
  ArrowDownLeft,
  AlertTriangle,
  RefreshCw,
  User,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminStockMovementsPage() {
  const [movements, setMovements] = useState<AdminStockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

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
      (filterType === "loss" && (m.movement_type === "destruction_perte" || m.movement_type === "manual_exit")) ||
      (filterType === "restock" && (m.movement_type === "reassort_imprimerie" || m.movement_type === "restock"));

    return matchesSearch && matchesType;
  });

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
            {row.movement_type === "destruction_perte" || row.movement_type === "manual_exit" ? (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-error/15 text-error font-bold border border-error/20">
                <AlertTriangle className="w-3 h-3" />
                Sortie / Déduction
              </span>
            ) : row.movement_type === "reassort_imprimerie" || row.movement_type === "restock" ? (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-success/15 text-success font-bold border border-success/20">
                <ArrowDownLeft className="w-3 h-3" />
                Réassort Tirage
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-navy/10 text-navy font-bold">
                <RefreshCw className="w-3 h-3" />
                Ajustement Manuel
              </span>
            )}
          </div>
          <p className={`font-mono text-xs font-bold ${row.quantity < 0 || row.movement_type === "destruction_perte" || row.movement_type === "manual_exit" ? "text-error" : "text-success"}`}>
            {row.quantity > 0 ? `+${row.quantity}` : `${row.quantity}`} exemplaires
          </p>
        </div>
      ),
    },
    {
      key: "reason",
      header: "Motif & Auteur",
      cell: (row) => (
        <div className="space-y-1 text-[11px]">
          <p className="text-foreground line-clamp-2 leading-tight" title={row.reason || "Aucun motif saisi"}>
            {row.reason || "Aucun motif saisi"}
          </p>
          <div className="flex items-center gap-1 text-foreground-muted">
            <User className="w-3 h-3 text-gold shrink-0" />
            <span>{row.initiated_by}</span>
          </div>
        </div>
      ),
    },
    {
      key: "date",
      header: "Date & Statut",
      cell: (row) => (
        <div className="space-y-1">
          <p className="font-mono text-xs text-foreground-muted">
            {row.created_at ? new Date(row.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "N/A"}
          </p>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-success">
            <ShieldCheck className="w-3 h-3" />
            Enregistré
          </span>
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
            <span className="text-navy font-semibold">Supervision des Flux</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy flex items-center gap-2.5">
            <TrendingDown className="w-6 h-6 text-gold" />
            Journal des Mouvements & Entrées/Sorties de Stock
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
            Supervision et traçabilité complète des réceptions d'imprimerie, réassorts et sorties physiques en entrepôts.
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
            onClick={() => setFilterType("restock")}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              filterType === "restock"
                ? "bg-navy text-white font-bold"
                : "bg-background border border-border text-foreground hover:bg-background-secondary"
            }`}
          >
            Réassorts / Entrées
          </button>

          <button
            type="button"
            onClick={() => setFilterType("loss")}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              filterType === "loss"
                ? "bg-navy text-white font-bold"
                : "bg-background border border-border text-foreground hover:bg-background-secondary"
            }`}
          >
            Sorties / Pertes
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
          emptyMessage="Aucun mouvement de stock enregistré pour le moment."
        />
      </div>
    </div>
  );
}
