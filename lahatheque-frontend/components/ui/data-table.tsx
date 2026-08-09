/**
 * DataTable — table de données avec recherche + filtre de statut intégrés
 * Inspiré de felipemenezes098/table-12 (21st.dev #22162)
 * Pattern adapté sans TanStack Table (filtrage natif React state).
 * Tokenisé LAHAThèque (globals.css). Mobile-first : table sur lg+, cards sur mobile.
 */
"use client";

import * as React from "react";
import { Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface DataTableColumn<T> {
  key: keyof T | string;
  header: string;
  /** Rendu custom d'une cellule. Reçoit la ligne complète. */
  cell?: (row: T) => React.ReactNode;
  /** Classe CSS optionnelle sur la colonne (th+td) */
  className?: string;
  /** Si true, colonne masquée sur mobile (visible seulement lg+) */
  hideOnMobile?: boolean;
}

export interface DataTableFilterOption {
  value: string;
  label: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  /** Clé utilisée pour le filtre de statut (optionnel) */
  filterKey?: keyof T;
  filterOptions?: DataTableFilterOption[];
  filterPlaceholder?: string;
  searchPlaceholder?: string;
  /** Rendu mobile d'une ligne (card). Si absent, table seulement */
  mobileCard?: (row: T) => React.ReactNode;
  /** State vide personnalisé */
  emptyState?: React.ReactNode;
  /** Message vide par défaut */
  emptyMessage?: string;
  /** Loading state */
  loading?: boolean;
  /** Nombre de skeletons à afficher pendant le chargement */
  skeletonRows?: number;
  className?: string;
  /** Clé unique par ligne pour React key prop */
  rowKey: keyof T;
  /** Callback au clic sur une ligne */
  onRowClick?: (row: T) => void;
  /** Header actions (boutons à droite de la barre search/filter) */
  headerActions?: React.ReactNode;
}

// ─── DataTable ────────────────────────────────────────────────────────────────
export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  filterKey,
  filterOptions,
  filterPlaceholder = "Tous les statuts",
  searchPlaceholder = "Rechercher...",
  mobileCard,
  emptyState,
  emptyMessage = "Aucun résultat trouvé.",
  loading = false,
  skeletonRows = 4,
  className,
  rowKey,
  onRowClick,
  headerActions,
}: DataTableProps<T>) {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");

  // Filtrage natif React
  const filtered = React.useMemo(() => {
    let rows = data;

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((row) =>
        Object.values(row).some((v) =>
          String(v ?? "")
            .toLowerCase()
            .includes(q)
        )
      );
    }

    if (filterKey && statusFilter !== "all") {
      rows = rows.filter((row) => String(row[filterKey]) === statusFilter);
    }

    return rows;
  }, [data, search, statusFilter, filterKey]);

  const hasFilters = Boolean(search || statusFilter !== "all");

  return (
    <div className={cn("bg-background border border-border rounded-2xl shadow-sm overflow-hidden", className)}>
      {/* ── Barre search + filtre ── */}
      <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Recherche */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted pointer-events-none" aria-hidden="true" />
            <input
              type="search"
              aria-label={searchPlaceholder}
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                "w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background",
                "text-sm text-foreground placeholder:text-foreground-muted",
                "focus:outline-none focus:ring-2 focus:ring-navy focus:border-navy transition-all"
              )}
            />
          </div>

          {/* Filtre statut */}
          {filterOptions && filterKey && (
            <div className="relative">
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted pointer-events-none" aria-hidden="true" />
              <select
                aria-label="Filtrer par statut"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={cn(
                  "pl-8 pr-8 py-2 rounded-xl border border-border bg-background",
                  "text-sm text-foreground appearance-none cursor-pointer",
                  "focus:outline-none focus:ring-2 focus:ring-navy focus:border-navy transition-all"
                )}
              >
                <option value="all">{filterPlaceholder}</option>
                {filterOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-foreground-muted text-xs">▾</span>
            </div>
          )}
        </div>

        {/* Actions header (bouton Exporter, Nouveau, etc.) */}
        {headerActions && (
          <div className="flex items-center gap-2 shrink-0">{headerActions}</div>
        )}
      </div>

      {/* ── Contenu ── */}
      {loading ? (
        // Skeletons — épousent la forme de la table
        <div className="p-4 space-y-3 animate-pulse" aria-busy="true" aria-label="Chargement des données">
          {Array.from({ length: skeletonRows }).map((_, i) => (
            <div key={i} className="h-12 bg-background-secondary rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        // État vide
        emptyState ?? (
          <div className="py-16 text-center space-y-3">
            <p className="text-sm font-medium text-navy">Aucun résultat</p>
            <p className="text-xs text-foreground-muted">
              {hasFilters
                ? "Aucun élément ne correspond à vos critères. Essayez de modifier votre recherche ou vos filtres."
                : emptyMessage}
            </p>
            {hasFilters && (
              <button
                onClick={() => { setSearch(""); setStatusFilter("all"); }}
                className="text-gold hover:text-gold-dark text-xs font-bold underline underline-offset-4"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )
      ) : (
        <>
          {/* Table Desktop (lg+) */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-background-secondary border-b border-border">
                  {columns.map((col) => (
                    <th
                      key={String(col.key)}
                      className={cn(
                        "p-4 text-xs font-bold uppercase tracking-wider text-navy",
                        col.className
                      )}
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((row) => (
                  <tr
                    key={String(row[rowKey])}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      "hover:bg-background-secondary/40 transition-colors",
                      onRowClick && "cursor-pointer"
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={String(col.key)}
                        className={cn("p-4 text-sm text-foreground", col.className)}
                      >
                        {col.cell
                          ? col.cell(row)
                          : String(row[col.key as keyof T] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards Mobile (sous lg) */}
          <div className="lg:hidden divide-y divide-border/60">
            {filtered.map((row) =>
              mobileCard ? (
                <div
                  key={String(row[rowKey])}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "p-4 hover:bg-background-secondary/20 transition-colors",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {mobileCard(row)}
                </div>
              ) : (
                // Fallback : afficher les colonnes non-hideOnMobile
                <div
                  key={String(row[rowKey])}
                  onClick={() => onRowClick?.(row)}
                  className="p-4 space-y-2"
                >
                  {columns
                    .filter((col) => !col.hideOnMobile)
                    .map((col) => (
                      <div key={String(col.key)} className="flex justify-between gap-2 text-sm">
                        <span className="text-xs font-bold text-foreground-muted uppercase tracking-wide">
                          {col.header}
                        </span>
                        <span className="text-right text-foreground">
                          {col.cell
                            ? col.cell(row)
                            : String(row[col.key as keyof T] ?? "")}
                        </span>
                      </div>
                    ))}
                </div>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default DataTable;
