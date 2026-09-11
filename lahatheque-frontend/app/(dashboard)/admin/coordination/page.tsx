"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Scale,
  Warehouse,
  AlertTriangle,
  PackagePlus,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ArrowLeft,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Layers,
  ArrowUpCircle,
} from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { BookCover3D } from "@/components/ui/book-cover-3d";
import {
  getEscalatedOutages,
  getStockAlerts,
  toggleBookPaperAvailability,
} from "@/lib/services/manager";
import { AdminRestockModal } from "@/components/features/admin/admin-restock-modal";
import { AdminArbitrageModal } from "@/components/features/admin/admin-arbitrage-modal";
import type { EscalatedOutage, StockAlert } from "@/lib/types/manager";
import { toast } from "sonner";

export default function AdminCoordinationPage() {
  const [outages, setOutages] = useState<EscalatedOutage[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);

  // Onglet actif : "escalations" (Arbitrage des remontées) | "alerts" (Toutes les alertes de hubs)
  const [activeTab, setActiveTab] = useState<"escalations" | "alerts">("escalations");

  // Filtres onglet escalades
  const [outageSearch, setOutageSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "in_reprint" | "resolved">("all");

  // Filtres onglet alertes
  const [alertSearch, setAlertSearch] = useState("");
  const [alertTypeFilter, setAlertTypeFilter] = useState<"all" | "out_of_stock" | "low_stock">("all");

  // Modales
  const [restockTarget, setRestockTarget] = useState<{
    stockId?: string;
    bookId: string;
    bookTitle: string;
    isbn?: string;
    warehouseName?: string;
    warehouseCode?: string;
    currentQuantity?: number;
    alertThreshold?: number;
  } | null>(null);

  const [arbitrageTarget, setArbitrageTarget] = useState<EscalatedOutage | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [outageData, alertData] = await Promise.all([
        getEscalatedOutages(),
        getStockAlerts(),
      ]);
      setOutages(outageData);
      setAlerts(alertData);
    } catch {
      toast.error("Impossible de charger les données de coordination.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Action rapide : basculer la disponibilité papier vitrine
  const handleTogglePaperSale = async (bookId: string, currentStatus: boolean, bookTitle: string) => {
    const newStatus = !currentStatus;
    const ok = await toggleBookPaperAvailability(bookId, newStatus);
    if (ok) {
      toast.success(
        newStatus
          ? `Vente papier réactivée sur la vitrine pour « ${bookTitle} »`
          : `Vente papier suspendue sur la vitrine pour « ${bookTitle} »`
      );
      // Mise à jour optimiste
      setOutages((prev) =>
        prev.map((o) => (o.book_id === bookId ? { ...o, is_paper_available: newStatus } : o))
      );
      setAlerts((prev) =>
        prev.map((a) => (a.book_id === bookId ? { ...a, is_paper_available: newStatus } : a))
      );
    } else {
      toast.error("Erreur lors de la mise à jour de la disponibilité vitrine.");
    }
  };

  // KPIs Stratégiques
  const criticalOutagesCount = useMemo(
    () => alerts.filter((a) => a.quantity === 0 || a.alert_type === "out_of_stock").length,
    [alerts]
  );
  const pendingArbitrationCount = useMemo(
    () => outages.filter((o) => o.admin_status === "reported" || o.admin_status === "acknowledged").length,
    [outages]
  );
  const disabledPaperCount = useMemo(
    () => alerts.filter((a) => a.is_paper_available === false).length,
    [alerts]
  );
  const inReprintCount = useMemo(
    () => outages.filter((o) => o.admin_status === "in_reprint" || o.admin_status === "resolved").length,
    [outages]
  );

  // Filtrage des escalades
  const filteredOutages = useMemo(() => {
    return outages.filter((o) => {
      const matchSearch =
        !outageSearch ||
        o.book_title.toLowerCase().includes(outageSearch.toLowerCase()) ||
        (o.isbn && o.isbn.toLowerCase().includes(outageSearch.toLowerCase())) ||
        (o.warehouse_nom && o.warehouse_nom.toLowerCase().includes(outageSearch.toLowerCase())) ||
        (o.warehouse && o.warehouse.toLowerCase().includes(outageSearch.toLowerCase())) ||
        (o.reported_by && o.reported_by.toLowerCase().includes(outageSearch.toLowerCase()));

      let matchStatus = true;
      if (statusFilter === "pending") {
        matchStatus = o.admin_status === "reported" || o.admin_status === "acknowledged";
      } else if (statusFilter === "in_reprint") {
        matchStatus = o.admin_status === "in_reprint";
      } else if (statusFilter === "resolved") {
        matchStatus = o.admin_status === "resolved";
      }

      return matchSearch && matchStatus;
    });
  }, [outages, outageSearch, statusFilter]);

  // Filtrage des alertes globales
  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      const matchSearch =
        !alertSearch ||
        a.book_title.toLowerCase().includes(alertSearch.toLowerCase()) ||
        (a.isbn && a.isbn.toLowerCase().includes(alertSearch.toLowerCase())) ||
        (a.warehouse_nom && a.warehouse_nom.toLowerCase().includes(alertSearch.toLowerCase())) ||
        (a.warehouse && a.warehouse.toLowerCase().includes(alertSearch.toLowerCase()));

      let matchType = true;
      if (alertTypeFilter === "out_of_stock") {
        matchType = a.quantity === 0 || a.alert_type === "out_of_stock";
      } else if (alertTypeFilter === "low_stock") {
        matchType = a.quantity > 0 && a.alert_type === "low_stock";
      }

      return matchSearch && matchType;
    });
  }, [alerts, alertSearch, alertTypeFilter]);

  // Colonnes du tableau d'Arbitrage des Ruptures
  const outageColumns: DataTableColumn<EscalatedOutage>[] = [
    {
      key: "book_title",
      header: "Ouvrage",
      cell: (row) => {
        const coverUrl =
          row.cover_url ||
          (row.book_id ? `/api/bff/catalog/books/${row.book_id}/cover/` : undefined);
        return (
          <div className="flex items-center gap-3 py-1">
            <BookCover3D
              title={row.book_title}
              authors={row.authors}
              discipline={row.discipline}
              coverUrl={coverUrl}
              size="xs"
              interactive={false}
            />
            <div className="min-w-0">
              <p className="font-semibold text-xs text-navy truncate max-w-[220px]">
                {row.book_title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {row.isbn && row.isbn !== "—" && (
                  <span className="text-[10px] text-foreground-muted font-mono">
                    {row.isbn}
                  </span>
                )}
                {row.discipline && (
                  <span className="text-[9px] font-semibold text-navy bg-navy/10 px-1.5 py-0.5 rounded">
                    {row.discipline}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "warehouse",
      header: "Hub / Entrepôt",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-xs text-foreground flex items-center gap-1.5">
          <Warehouse className="w-3.5 h-3.5 text-gold shrink-0" />
          <span className="truncate max-w-[150px]">{row.warehouse_nom || row.warehouse}</span>
        </span>
      ),
    },
    {
      key: "reported_at",
      header: "Signalement",
      hideOnMobile: true,
      cell: (row) => (
        <div className="text-xs">
          <span className="font-mono text-foreground-muted text-[11px] block">
            {new Date(row.reported_at).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
          <span className="text-[10px] text-foreground-muted">Par {row.reported_by}</span>
        </div>
      ),
    },
    {
      key: "impact_description",
      header: "Motif & Impact",
      hideOnMobile: true,
      cell: (row) => (
        <div className="max-w-[200px]">
          <p className="text-xs text-foreground-muted line-clamp-2 italic" title={row.impact_description}>
            « {row.impact_description} »
          </p>
          {row.admin_note && (
            <p className="text-[10px] text-navy font-semibold mt-0.5 line-clamp-1">
              Note : {row.admin_note}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "is_paper_available",
      header: "Vitrine Papier",
      hideOnMobile: true,
      cell: (row) => {
        const isAvail = row.is_paper_available !== false;
        return (
          <button
            onClick={() => handleTogglePaperSale(row.book_id, isAvail, row.book_title)}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap ${
              isAvail
                ? "bg-success/10 text-success border-success/30 hover:bg-success/20"
                : "bg-error/10 text-error border-error/30 hover:bg-error/20"
            }`}
            title="Cliquer pour basculer la disponibilité papier sur le catalogue public"
          >
            {isAvail ? (
              <>
                <Eye className="w-3 h-3" />
                Vente Active
              </>
            ) : (
              <>
                <EyeOff className="w-3 h-3" />
                Vente Coupée
              </>
            )}
          </button>
        );
      },
    },
    {
      key: "admin_status",
      header: "Statut Arbitrage",
      cell: (row) => <StatusBadge status={row.admin_status} />,
    },
    {
      key: "actions",
      header: "Arbitrage Exécutif",
      cell: (row) => {
        return (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setArbitrageTarget(row)}
              className="px-3 py-1.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy/90 transition-colors flex items-center gap-1.5 min-h-[34px] cursor-pointer shadow-xs whitespace-nowrap"
              title="Arbitrer cette rupture"
            >
              <Scale className="w-3.5 h-3.5 text-gold" />
              Arbitrer
            </button>
            <button
              onClick={() =>
                setRestockTarget({
                  stockId: row.stock_id,
                  bookId: row.book_id,
                  bookTitle: row.book_title,
                  isbn: row.isbn,
                  warehouseName: row.warehouse_nom,
                  warehouseCode: row.warehouse,
                  currentQuantity: row.current_quantity,
                  alertThreshold: row.seuil_alerte,
                })
              }
              className="p-1.5 rounded-xl border border-border bg-background hover:border-gold text-foreground-muted hover:text-navy transition-colors min-h-[34px] min-w-[34px] flex items-center justify-center cursor-pointer"
              title="Ordonner un réassort immédiat"
            >
              <PackagePlus className="w-3.5 h-3.5 text-gold" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
      {/* Fil d'Ariane */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted flex-wrap">
        <Link href="/admin" className="hover:text-navy">
          Administration
        </Link>
        <span>/</span>
        <Link href="/admin/stock" className="hover:text-navy">
          Stock Physique & Hubs
        </Link>
        <span>/</span>
        <span className="text-navy font-semibold">Coordination des Ruptures</span>
      </div>

      {/* En-tête Principal */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/admin/stock"
            className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Vue Stock & Hubs
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <Scale className="w-4 h-4 text-gold" />
            Arbitrage Central
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Coordination & Arbitrage des Ruptures
          </h1>
          <p className="text-xs text-foreground-muted mt-1 max-w-2xl">
            Pilotage centralisé des alertes régionales, arbitrage des réimpressions et régulation de la vitrine publique.
          </p>
        </div>

        {/* Bouton d'actualisation */}
        <button
          onClick={loadData}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl border border-border bg-background text-xs font-semibold text-navy hover:border-gold hover:text-gold transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer min-h-[40px]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      {/* Cartes d'Indicateurs Stratégiques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-background border border-border space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground-muted font-medium">Ruptures Totales (0 ex.)</span>
            <div className="p-1.5 rounded-lg bg-error/10">
              <AlertTriangle className="w-4 h-4 text-error" />
            </div>
          </div>
          <p className="font-serif text-2xl font-bold text-error">{criticalOutagesCount}</p>
          <p className="text-[10px] text-foreground-muted">Ouvrages sans aucun stock</p>
        </div>

        <div className="p-4 rounded-2xl bg-background border border-border space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground-muted font-medium">Escalades à Arbitrer</span>
            <div className="p-1.5 rounded-lg bg-gold/10">
              <Scale className="w-4 h-4 text-gold" />
            </div>
          </div>
          <p className="font-serif text-2xl font-bold text-navy">{pendingArbitrationCount}</p>
          <p className="text-[10px] text-foreground-muted">Dossiers transmis par les hubs</p>
        </div>

        <div className="p-4 rounded-2xl bg-background border border-border space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground-muted font-medium">Vente Papier Coupée</span>
            <div className="p-1.5 rounded-lg bg-warning/10">
              <EyeOff className="w-4 h-4 text-warning" />
            </div>
          </div>
          <p className="font-serif text-2xl font-bold text-navy">{disabledPaperCount}</p>
          <p className="text-[10px] text-foreground-muted">Titres protégés en vitrine</p>
        </div>

        <div className="p-4 rounded-2xl bg-background border border-border space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground-muted font-medium">Tirages / Résolues</span>
            <div className="p-1.5 rounded-lg bg-success/10">
              <CheckCircle2 className="w-4 h-4 text-success" />
            </div>
          </div>
          <p className="font-serif text-2xl font-bold text-success">{inReprintCount}</p>
          <p className="text-[10px] text-foreground-muted">Dossiers en cours ou clos</p>
        </div>
      </div>

      {/* Navigation par Onglets */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("escalations")}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold transition-all relative flex items-center gap-2 cursor-pointer ${
            activeTab === "escalations"
              ? "text-navy font-semibold"
              : "text-foreground-muted hover:text-navy"
          }`}
        >
          <Scale className="w-4 h-4 text-gold" />
          Ruptures Escaladées par les Hubs
          {pendingArbitrationCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-gold/15 text-gold font-mono text-[10px] font-bold">
              {pendingArbitrationCount}
            </span>
          )}
          {activeTab === "escalations" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("alerts")}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold transition-all relative flex items-center gap-2 cursor-pointer ${
            activeTab === "alerts"
              ? "text-navy font-semibold"
              : "text-foreground-muted hover:text-navy"
          }`}
        >
          <Warehouse className="w-4 h-4 text-gold" />
          Toutes les Alertes Régionales
          {alerts.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-navy/10 text-navy font-mono text-[10px] font-bold">
              {alerts.length}
            </span>
          )}
          {activeTab === "alerts" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />
          )}
        </button>
      </div>

      {/* CONTENU ONGLET 1 : Ruptures Escaladées par les Hubs */}
      {activeTab === "escalations" && (
        <div className="space-y-4">
          {/* Barre de Recherche et Filtres */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none" />
              <input
                type="text"
                value={outageSearch}
                onChange={(e) => setOutageSearch(e.target.value)}
                placeholder="Rechercher par ouvrage, ISBN, entrepôt ou gestionnaire..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:border-gold text-foreground placeholder:text-foreground-muted"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: "all", label: "Toutes" },
                { id: "pending", label: "À arbitrer" },
                { id: "in_reprint", label: "En réimpression" },
                { id: "resolved", label: "Résolues" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    statusFilter === f.id
                      ? "bg-navy text-white shadow-xs"
                      : "bg-background-secondary text-foreground-muted hover:text-navy border border-border"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tableau DataTable */}
          <DataTable
            data={filteredOutages}
            columns={outageColumns}
            rowKey="id"
            loading={loading}
            emptyMessage="Aucune rupture signalée correspondant aux critères."
            pageSize={10}
            mobileCard={(row) => {
              const coverUrl =
                row.cover_url ||
                (row.book_id ? `/api/bff/catalog/books/${row.book_id}/cover/` : undefined);
              const isAvail = row.is_paper_available !== false;
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
                        <StatusBadge status={row.admin_status} />
                        <button
                          onClick={() => handleTogglePaperSale(row.book_id, isAvail, row.book_title)}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                            isAvail
                              ? "bg-success/10 text-success border-success/30"
                              : "bg-error/10 text-error border-error/30"
                          }`}
                        >
                          {isAvail ? "Vitrine papier active" : "Vitrine papier coupée"}
                        </button>
                      </div>
                      <h4 className="font-serif font-bold text-navy text-sm leading-snug line-clamp-2">
                        {row.book_title}
                      </h4>
                      <p className="text-[10px] text-foreground-muted font-mono mt-0.5">
                        Signalée le{" "}
                        {new Date(row.reported_at).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        par {row.reported_by}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-foreground bg-background-secondary p-2.5 rounded-xl border border-border italic">
                    « {row.impact_description} »
                  </div>

                  {row.admin_note && (
                    <div className="text-xs bg-gold/5 p-2 rounded-lg border border-gold/20 text-navy font-medium">
                      Décision Admin : {row.admin_note}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-border gap-2">
                    <span className="text-[11px] text-foreground-muted flex items-center gap-1">
                      <Warehouse className="w-3.5 h-3.5 text-gold shrink-0" />
                      {row.warehouse_nom || row.warehouse}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setRestockTarget({
                            stockId: row.stock_id,
                            bookId: row.book_id,
                            bookTitle: row.book_title,
                            isbn: row.isbn,
                            warehouseName: row.warehouse_nom,
                            warehouseCode: row.warehouse,
                            currentQuantity: row.current_quantity,
                            alertThreshold: row.seuil_alerte,
                          })
                        }
                        className="px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-bold text-navy hover:border-gold flex items-center gap-1 min-h-[38px]"
                      >
                        <PackagePlus className="w-3.5 h-3.5 text-gold" />
                        Réassort
                      </button>
                      <button
                        onClick={() => setArbitrageTarget(row)}
                        className="px-3.5 py-1.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy/90 flex items-center gap-1.5 min-h-[38px]"
                      >
                        <Scale className="w-3.5 h-3.5 text-gold" />
                        Arbitrer
                      </button>
                    </div>
                  </div>
                </div>
              );
            }}
          />
        </div>
      )}

      {/* CONTENU ONGLET 2 : Toutes les Alertes Régionales (Entrepôts) */}
      {activeTab === "alerts" && (
        <div className="space-y-4">
          {/* Barre de Recherche et Filtres */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none" />
              <input
                type="text"
                value={alertSearch}
                onChange={(e) => setAlertSearch(e.target.value)}
                placeholder="Rechercher une alerte par livre, ISBN ou entrepôt..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:border-gold text-foreground placeholder:text-foreground-muted"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: "all", label: "Toutes les alertes" },
                { id: "out_of_stock", label: "Ruptures franches (0 ex.)" },
                { id: "low_stock", label: "Seuils bas" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setAlertTypeFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    alertTypeFilter === f.id
                      ? "bg-navy text-white shadow-xs"
                      : "bg-background-secondary text-foreground-muted hover:text-navy border border-border"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Liste des alertes avec leviers exécutifs Admin */}
          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-12 bg-background-secondary/40 rounded-2xl border border-border p-6">
                <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
                <h3 className="font-serif font-bold text-navy text-sm">
                  Aucune alerte de rupture
                </h3>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Tous les stocks des entrepôts régionaux sont au-dessus des seuils d&apos;alerte.
                </p>
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                const coverUrl =
                  alert.cover_url ||
                  (alert.book_id ? `/api/bff/catalog/books/${alert.book_id}/cover/` : undefined);
                const isPaperAvail = alert.is_paper_available !== false;

                return (
                  <div
                    key={alert.id}
                    className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-background border border-border hover:border-gold/30 transition-all shadow-xs"
                  >
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <BookCover3D
                        title={alert.book_title}
                        authors={alert.authors}
                        discipline={alert.discipline}
                        coverUrl={coverUrl}
                        size="xs"
                        interactive={false}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <StatusBadge status={alert.alert_type} />
                          {alert.escalation_status === "escalated" ? (
                            <span className="text-[10px] font-bold text-gold bg-gold/10 border border-gold/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <ArrowUpCircle className="w-3 h-3" />
                              Escaladée par le gestionnaire
                            </span>
                          ) : (
                            <span className="text-[10px] text-foreground-muted bg-background-secondary px-2 py-0.5 rounded-full border border-border">
                              Non escaladée
                            </span>
                          )}
                          <span className="text-[10px] text-foreground-muted flex items-center gap-1 font-medium">
                            <Warehouse className="w-3 h-3 text-gold shrink-0" />
                            {alert.warehouse_nom || alert.warehouse}
                          </span>
                        </div>
                        <h4 className="font-semibold text-xs sm:text-sm text-navy truncate max-w-xl">
                          {alert.book_title}
                        </h4>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-foreground-muted flex-wrap">
                          <span>
                            Stock disponible :{" "}
                            <strong className={alert.quantity === 0 ? "text-error font-bold font-mono" : "text-navy font-mono font-bold"}>
                              {alert.quantity} ex.
                            </strong>
                          </span>
                          <span>•</span>
                          <span>Seuil configuré : {alert.alert_threshold} ex.</span>
                          {alert.isbn && (
                            <>
                              <span>•</span>
                              <span className="font-mono">{alert.isbn}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions Exécutives Administrateur */}
                    <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto flex-wrap">
                      {/* Bascule Vente Papier Vitrine */}
                      <button
                        onClick={() => handleTogglePaperSale(alert.book_id, isPaperAvail, alert.book_title)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer min-h-[38px] ${
                          isPaperAvail
                            ? "bg-success/10 text-success border-success/30 hover:bg-success/20"
                            : "bg-error/10 text-error border-error/30 hover:bg-error/20"
                        }`}
                        title="Activer ou suspendre la vente papier sur la boutique en ligne"
                      >
                        {isPaperAvail ? (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            Vente Vitrine Active
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            Vente Vitrine Coupée
                          </>
                        )}
                      </button>

                      {/* Ordonner Réapprovisionnement */}
                      <button
                        onClick={() =>
                          setRestockTarget({
                            stockId: alert.id,
                            bookId: alert.book_id,
                            bookTitle: alert.book_title,
                            isbn: alert.isbn,
                            warehouseName: alert.warehouse_nom,
                            warehouseCode: alert.warehouse,
                            currentQuantity: alert.quantity,
                            alertThreshold: alert.alert_threshold,
                          })
                        }
                        className="px-3.5 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy/90 transition-colors flex items-center gap-1.5 min-h-[38px] cursor-pointer shadow-xs whitespace-nowrap"
                      >
                        <PackagePlus className="w-4 h-4 text-gold" />
                        Ordonner un Réassort
                      </button>

                      {/* Lien Fiche Stock */}
                      <Link
                        href={`/admin/stock`}
                        className="p-2 rounded-xl border border-border bg-background hover:border-gold text-foreground-muted hover:text-navy transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer"
                        title="Consulter le hub dans la supervision stock"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Modale d'Ordre de Réapprovisionnement */}
      {restockTarget && (
        <AdminRestockModal
          isOpen={!!restockTarget}
          onClose={() => setRestockTarget(null)}
          onSuccess={loadData}
          item={restockTarget}
        />
      )}

      {/* Modale d'Arbitrage Exécutif */}
      {arbitrageTarget && (
        <AdminArbitrageModal
          isOpen={!!arbitrageTarget}
          onClose={() => setArbitrageTarget(null)}
          onSuccess={loadData}
          outage={arbitrageTarget}
        />
      )}
    </div>
  );
}
