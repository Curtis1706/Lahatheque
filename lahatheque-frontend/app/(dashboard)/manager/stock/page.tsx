"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Warehouse, Search, ArrowLeft, Filter, Plus, PackageCheck, AlertTriangle } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { BookCover3D } from "@/components/ui/book-cover-3d";
import { getStockItems } from "@/lib/services/manager";
import type { StockItem, StockFilterStatus } from "@/lib/types/manager";

export default function StockGlobalPage() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StockFilterStatus>("all");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("all");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getStockItems();
      setItems(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const warehouses = useMemo(() => {
    const set = new Set<string>();
    items.forEach((it) => {
      if (it.warehouse) set.add(it.warehouse);
    });
    return Array.from(set);
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (warehouseFilter !== "all" && item.warehouse !== warehouseFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !item.title.toLowerCase().includes(q) &&
          !item.isbn.toLowerCase().includes(q) &&
          !(item.discipline || "").toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [items, searchQuery, statusFilter, warehouseFilter]);

  const columns: DataTableColumn<StockItem>[] = [
    {
      key: "title",
      header: "Ouvrage & Couverture",
      cell: (row) => {
        const coverUrl =
          row.cover_url ||
          (row.book_id ? `/api/bff/catalog/books/${row.book_id}/cover/` : undefined);
        return (
          <Link
            href={`/manager/stock/${row.id}`}
            className="flex items-center gap-3 group py-1"
          >
            <BookCover3D
              title={row.title}
              authors={row.authors}
              discipline={row.discipline}
              coverUrl={coverUrl}
              size="xs"
            />
            <div className="min-w-0">
              <p className="font-semibold text-xs text-navy group-hover:text-gold transition-colors truncate max-w-[220px]">
                {row.title}
              </p>
              <p className="text-[10px] text-foreground-muted font-mono mt-0.5">
                ISBN : {row.isbn}
              </p>
            </div>
          </Link>
        );
      },
    },
    {
      key: "discipline",
      header: "Discipline",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-xs text-foreground-muted">{row.discipline || "—"}</span>
      ),
    },
    {
      key: "warehouse",
      header: "Entrepôt & Pays",
      cell: (row) => (
        <div className="text-xs">
          <p className="font-semibold text-foreground flex items-center gap-1">
            <Warehouse className="w-3.5 h-3.5 text-gold shrink-0" />
            {(row as any).warehouse_nom || row.warehouse}
          </p>
          <p className="text-[10px] text-foreground-muted">
            {(row as any).ville ? `${(row as any).ville}, ` : ""}{row.country}
          </p>
        </div>
      ),
    },
    {
      key: "quantity",
      header: "Stock Dispo",
      cell: (row) => (
        <div className="font-mono text-xs">
          <span
            className={`font-bold ${
              row.quantity === 0
                ? "text-error"
                : row.quantity <= row.alert_threshold
                ? "text-gold"
                : "text-navy"
            }`}
          >
            {row.quantity} ex.
          </span>
          {(row as any).quantite_reservee > 0 && (
            <p className="text-[10px] text-foreground-muted">
              ({(row as any).quantite_reservee} réservé{(row as any).quantite_reservee > 1 ? "s" : ""})
            </p>
          )}
        </div>
      ),
    },
    {
      key: "alert_threshold",
      header: "Seuil Alerte",
      hideOnMobile: true,
      cell: (row) => (
        <span className="font-mono text-xs text-foreground-muted">
          {row.alert_threshold} ex.
        </span>
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
          <Link
            href="/manager"
            className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <Warehouse className="w-4 h-4 text-gold" />
            Gestion du Stock Papier
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Vue Globale du Stock
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Quantités réelles, réservées et disponibles par entrepôt et par pays en Afrique de l&apos;Ouest &amp; Centrale.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/manager/stock/alerts"
            className="inline-flex items-center justify-center gap-2 bg-background-secondary hover:bg-background border border-border text-navy text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-xs min-h-[44px]"
          >
            <AlertTriangle className="w-4 h-4 text-gold" />
            Alertes
          </Link>
          <Link
            href="/manager/stock/movements"
            className="inline-flex items-center justify-center gap-2 bg-navy hover:bg-navy-hover text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-xs min-h-[44px]"
          >
            <Plus className="w-4 h-4 text-gold" />
            Enregistrer Mouvement
          </Link>
        </div>
      </div>

      {/* KPI Band */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-background-secondary border border-border">
          <p className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted mb-1">
            Total Références
          </p>
          <p className="text-2xl font-bold font-mono text-navy">{items.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-background-secondary border border-border">
          <p className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted mb-1">
            En Stock Normal
          </p>
          <p className="text-2xl font-bold font-mono text-success">
            {items.filter((i) => i.status === "normal").length}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-background-secondary border border-border">
          <p className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted mb-1">
            Seuil Bas
          </p>
          <p className="text-2xl font-bold font-mono text-gold">
            {items.filter((i) => i.status === "low_stock").length}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-background-secondary border border-border">
          <p className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted mb-1">
            Ruptures
          </p>
          <p className="text-2xl font-bold font-mono text-error">
            {items.filter((i) => i.status === "out_of_stock").length}
          </p>
        </div>
      </div>

      {/* Filtres & Recherche */}
      <div className="bg-background border border-border p-4 rounded-2xl space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par titre, ISBN ou discipline..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-foreground placeholder:text-foreground-muted min-h-[40px]"
            />
          </div>

          {warehouses.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider shrink-0">
                Entrepôt :
              </span>
              <select
                value={warehouseFilter}
                onChange={(e) => setWarehouseFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-foreground min-h-[40px]"
              >
                <option value="all">Tous les entrepôts</option>
                {warehouses.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-border overflow-x-auto">
          <span className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3 text-gold" />
            Statut :
          </span>
          {[
            { id: "all" as StockFilterStatus, label: "Tous" },
            { id: "normal" as StockFilterStatus, label: "Stock Normal" },
            { id: "low_stock" as StockFilterStatus, label: "Seuil Bas" },
            { id: "out_of_stock" as StockFilterStatus, label: "En Rupture" },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === st.id
                  ? "bg-navy text-white"
                  : "bg-background-secondary text-foreground-muted hover:text-navy border border-border"
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
        emptyMessage="Aucun ouvrage en stock ne correspond à vos critères de recherche."
        onRowClick={(row) => {
          window.location.href = `/manager/stock/${row.id}`;
        }}
        pageSize={10}
        mobileCard={(row) => {
          const coverUrl =
            row.cover_url ||
            (row.book_id ? `/api/bff/catalog/books/${row.book_id}/cover/` : undefined);
          return (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <BookCover3D
                  title={row.title}
                  authors={row.authors}
                  discipline={row.discipline}
                  coverUrl={coverUrl}
                  size="xs"
                  interactive={false}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <StatusBadge status={row.status} />
                    {row.discipline && (
                      <span className="text-[10px] font-semibold text-navy bg-navy-light px-2 py-0.5 rounded-md">
                        {row.discipline}
                      </span>
                    )}
                  </div>
                  <h4 className="font-serif font-bold text-navy text-sm leading-snug line-clamp-2">
                    {row.title}
                  </h4>
                  <p className="text-xs text-foreground-muted mt-0.5 line-clamp-1">
                    {row.authors?.length > 0 ? row.authors.join(", ") : "—"}
                  </p>
                  <p className="text-[10px] font-mono text-foreground-muted mt-0.5">
                    ISBN : {row.isbn}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
                <span className="text-foreground-muted">
                  {(row as any).warehouse_nom || row.warehouse} ({row.country})
                </span>
                <span className="font-mono font-bold text-navy">
                  {row.quantity} ex. dispo
                </span>
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}
