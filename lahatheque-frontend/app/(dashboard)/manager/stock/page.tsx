"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Warehouse, Search, ArrowLeft, Filter } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { getStockItems } from "@/lib/services/manager";
import type { StockItem, StockFilterStatus } from "@/lib/types/manager";

export default function StockGlobalPage() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StockFilterStatus>("all");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getStockItems();
      setItems(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!item.title.toLowerCase().includes(q) && !item.isbn.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [items, searchQuery, statusFilter]);

  const columns: DataTableColumn<StockItem>[] = [
    {
      key: "title",
      header: "Ouvrage",
      cell: (row) => (
        <Link href={`/manager/stock/${row.id}`} className="hover:text-navy transition-colors">
          <p className="font-semibold text-xs text-navy truncate max-w-[200px]">{row.title}</p>
          <p className="text-[10px] text-foreground-muted font-mono">{row.isbn}</p>
        </Link>
      ),
    },
    {
      key: "discipline",
      header: "Discipline",
      hideOnMobile: true,
      cell: (row) => <span className="text-xs text-foreground-muted">{row.discipline}</span>,
    },
    {
      key: "warehouse",
      header: "Entrepôt",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-xs text-foreground">
          {row.warehouse} <span className="text-foreground-muted">({row.country})</span>
        </span>
      ),
    },
    {
      key: "quantity",
      header: "Quantité",
      cell: (row) => (
        <span className="font-mono font-bold text-xs text-foreground">{row.quantity}</span>
      ),
    },
    {
      key: "alert_threshold",
      header: "Seuil",
      hideOnMobile: true,
      cell: (row) => (
        <span className="font-mono text-xs text-foreground-muted">{row.alert_threshold}</span>
      ),
    },
    {
      key: "status",
      header: "Statut",
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <Link href="/manager" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <Warehouse className="w-4 h-4 text-gold" />
            Gestion du Stock
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Vue Globale du Stock
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Quantités disponibles pour les livres papier, par entrepôt et par pays.
          </p>
        </div>

        <Link
          href="/manager/stock/movements"
          className="inline-flex items-center justify-center gap-2 bg-navy hover:bg-navy-hover text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-xs min-h-[44px]"
        >
          Enregistrer un mouvement
        </Link>
      </div>

      {/* Filtres */}
      <div className="bg-background border border-border p-4 rounded-2xl space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par titre ou ISBN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-foreground placeholder:text-foreground-muted min-h-[40px]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-border overflow-x-auto">
          <span className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3 text-gold" />
            Statut :
          </span>
          {[
            { id: "all" as StockFilterStatus, label: "Tous" },
            { id: "normal" as StockFilterStatus, label: "Normal" },
            { id: "low_stock" as StockFilterStatus, label: "Seuil bas" },
            { id: "out_of_stock" as StockFilterStatus, label: "Rupture" },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                statusFilter === st.id
                  ? "bg-navy/10 text-navy border border-navy/30 font-bold"
                  : "text-foreground-muted hover:text-navy"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={filteredItems}
        columns={columns}
        rowKey="id"
        loading={loading}
        emptyMessage="Aucun ouvrage en stock ne correspond à vos critères."
        onRowClick={(row) => { window.location.href = `/manager/stock/${row.id}`; }}
        pageSize={10}
      />
    </div>
  );
}
